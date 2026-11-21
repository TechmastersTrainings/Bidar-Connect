from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
import uuid

from fastapi import HTTPException, status
from apps.backend.app.core.config import settings
from apps.backend.app.services.payment_gateway_adapter import get_payment_gateway
from apps.backend.app.services.ledger_service import LedgerService
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS


# Synchronized in-memory Driver Payout Records & Requests
DRIVER_PAYOUT_RECORDS: Dict[str, Dict[str, Any]] = {}
PAYOUT_REQUESTS: Dict[str, Dict[str, Any]] = {}


class PayoutService:
    @staticmethod
    def get_ride_payout_eligibility(ride_id: str) -> Dict[str, Any]:
        """
        Audits a ride's completion status, passenger payment captures,
        and safety hold window buffer.
        """
        ride = next((r for r in SAMPLE_RIDES if r.get("ride_id") == ride_id), None)
        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ride {ride_id} does not exist."
            )

        # 1. Ride Completion Check
        is_completed = ride.get("status") == "COMPLETED"

        # 2. Passenger Bookings & Payments Check
        ride_bookings = [
            b for b in ACTIVE_BOOKINGS.values()
            if b.get("ride_id") == ride_id and b.get("booking_status", b.get("status")) in ("CONFIRMED", "COMPLETED")
        ]

        total_seats_booked = sum(b.get("seats_booked", 0) for b in ride_bookings)
        gross_fares = sum(float(b.get("fare_snapshot", {}).get("total_fare", b.get("total_fare", 0.0))) for b in ride_bookings)
        commission_deducted = sum(float(b.get("fare_snapshot", {}).get("company_commission", b.get("company_commission", 0.0))) for b in ride_bookings)
        net_driver_payable = sum(float(b.get("fare_snapshot", {}).get("driver_payable", b.get("driver_payable", 0.0))) for b in ride_bookings)

        if net_driver_payable == 0.0:
            total_s = ride.get("total_seats", ride.get("total_offered_seats", 0))
            avail_s = ride.get("available_seats", total_s)
            if total_s > avail_s:
                confirmed_seats = total_s - avail_s
                fare_per_seat = float(ride.get("fare_per_seat", 310.0))
                comm_per_seat = 20.0
                gross_fares = confirmed_seats * fare_per_seat
                commission_deducted = confirmed_seats * comm_per_seat
                net_driver_payable = gross_fares - commission_deducted

        driver_id = ride.get("driver_id") or ride.get("driver", {}).get("driver_id", "usr_default_driver")

        # 3. Safety Hold Buffer Evaluation (5 minutes post-completion)
        completed_at_str = ride.get("completed_at")
        time_elapsed_seconds = 0
        buffer_remaining_seconds = 0
        buffer_satisfied = False

        if completed_at_str:
            try:
                comp_dt = datetime.fromisoformat(completed_at_str.replace("Z", "+00:00"))
                now_dt = datetime.now(timezone.utc)
                time_elapsed_seconds = int((now_dt - comp_dt).total_seconds())
                buffer_req = settings.MIN_PAYOUT_DELAY_SECONDS
                if time_elapsed_seconds >= buffer_req:
                    buffer_satisfied = True
                else:
                    buffer_remaining_seconds = buffer_req - time_elapsed_seconds
            except Exception:
                buffer_satisfied = True
        else:
            # If ride is completed but timestamp unrecorded, initialize timestamp
            if is_completed:
                buffer_satisfied = True

        existing_payout = DRIVER_PAYOUT_RECORDS.get(ride_id)

        return {
            "ride_id": ride_id,
            "driver_id": ride.get("driver_id", "usr_default_driver"),
            "ride_status": ride.get("status"),
            "is_completed": is_completed,
            "total_bookings_count": len(ride_bookings),
            "total_seats_booked": total_seats_booked,
            "gross_amount": round(gross_fares, 2),
            "commission_deducted": round(commission_deducted, 2),
            "net_payable": round(net_driver_payable, 2),
            "buffer_satisfied": buffer_satisfied,
            "buffer_remaining_seconds": buffer_remaining_seconds,
            "existing_payout": existing_payout,
            "is_eligible": is_completed and (net_driver_payable > 0) and (existing_payout is None or existing_payout.get("status") == "FAILED"),
        }

    @staticmethod
    def disburse_payout(
        ride_id: str,
        caller_user_id: str,
        is_admin: bool = False,
        force_override_buffer: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes driver payout for a completed ride following state machine rules:
        PENDING_ELIGIBILITY -> QUEUED -> PROCESSING -> SETTLED
        """
        eligibility = PayoutService.get_ride_payout_eligibility(ride_id)

        if not eligibility["is_completed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payout cannot be disbursed for a ride that has not reached COMPLETED status.",
            )

        if eligibility["net_payable"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Net payable amount must be strictly positive to disburse payout.",
            )

        # Buffer check (unless admin overrides or flag is set)
        if not eligibility["buffer_satisfied"] and not force_override_buffer and not is_admin:
            rem = eligibility["buffer_remaining_seconds"]
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Safety hold buffer active. Payout eligible in {rem} seconds to allow passenger dispute filing.",
            )

        # Check existing payout
        existing = DRIVER_PAYOUT_RECORDS.get(ride_id)
        if existing and existing.get("status") in ("PROCESSING", "SETTLED"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Payout for ride {ride_id} is already in state {existing.get('status')}.",
            )

        driver_id = eligibility["driver_id"]
        gateway = get_payment_gateway()

        # Destination mock credentials (UPI or Bank)
        destination = {
            "type": "UPI",
            "vpa": f"{driver_id[:8]}@okaxis",
            "bank_account": "HDFC0001234_9876543210",
        }

        # Dispatch via gateway
        ref_id = f"REF_POUT_{ride_id[:8]}"
        gateway_resp = gateway.disburse_payout(
            driver_id=driver_id,
            amount=eligibility["net_payable"],
            destination=destination,
            reference_id=ref_id,
        )

        payout_id = gateway_resp["payout_id"]
        utr = gateway_resp["utr"]
        settled_at = datetime.now(timezone.utc).isoformat()

        payout_record = {
            "payout_id": payout_id,
            "ride_id": ride_id,
            "driver_id": driver_id,
            "gross_amount": eligibility["gross_amount"],
            "commission_deducted": eligibility["commission_deducted"],
            "net_payable": eligibility["net_payable"],
            "status": "SETTLED",  # Confirmed settlement with bank UTR
            "payout_reference_utr": utr,
            "settled_at": settled_at,
            "payout_method": "IMPS_INSTANT_UPI",
            "destination": destination["vpa"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        DRIVER_PAYOUT_RECORDS[ride_id] = payout_record

        # Double-entry ledger recording:
        # Debit DRIVER_ESCROW_PAYABLE -> Credit DRIVER_BANK_DISBURSEMENT
        LedgerService.record_driver_payout(
            payout_id=payout_id,
            ride_id=ride_id,
            driver_id=driver_id,
            amount=eligibility["net_payable"],
        )

        return payout_record

    @staticmethod
    def get_driver_payouts(driver_id: str) -> List[Dict[str, Any]]:
        return [
            p for p in DRIVER_PAYOUT_RECORDS.values()
            if p.get("driver_id") == driver_id
        ]

    @staticmethod
    def create_payout_request(ride_id: str, caller_user_id: str) -> Dict[str, Any]:
        """
        Submits a formal driver payout request upon ride completion.
        Enters PENDING_AUDIT status with a 5-minute automated clearance timer.
        """
        ride = next((r for r in SAMPLE_RIDES if r.get("ride_id") == ride_id), None)
        if not ride:
            raise HTTPException(status_code=404, detail=f"Ride {ride_id} does not exist.")

        if ride.get("status") != "COMPLETED":
            raise HTTPException(
                status_code=400,
                detail="Payout request can only be submitted after ride status is COMPLETED.",
            )

        eligibility = PayoutService.get_ride_payout_eligibility(ride_id)
        if eligibility["net_payable"] <= 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot request payout for a ride with zero net payable amount.",
            )

        # Check if already settled
        existing_settlement = DRIVER_PAYOUT_RECORDS.get(ride_id)
        if existing_settlement and existing_settlement.get("status") == "SETTLED":
            return existing_settlement

        # Check existing request
        existing_req = PAYOUT_REQUESTS.get(ride_id)
        if existing_req and existing_req.get("status") == "PENDING_AUDIT":
            try:
                auto_dt = datetime.fromisoformat(existing_req["auto_disburse_at"].replace("Z", "+00:00"))
                now_dt = datetime.now(timezone.utc)
                existing_req["remaining_seconds"] = max(0, int((auto_dt - now_dt).total_seconds()))
            except Exception:
                existing_req["remaining_seconds"] = 0
            return existing_req

        # Gather driver information
        driver_id = eligibility["driver_id"]
        driver_info = ride.get("driver", {})
        driver_name = driver_info.get("name", "Basavaraj Patil")
        driver_phone = driver_info.get("phone", "+91 98450 12345")
        driver_rating = driver_info.get("rating", 4.9)
        vehicle_info = ride.get("vehicle", {})
        vehicle_str = f"{vehicle_info.get('make', 'Maruti Suzuki')} {vehicle_info.get('model', 'Ertiga')} ({vehicle_info.get('registration_number', 'KA-38-N-4421')})"

        # Gather passenger manifest details
        ride_bookings = [
            b for b in ACTIVE_BOOKINGS.values()
            if b.get("ride_id") == ride_id and (
                b.get("booking_status") in ("CONFIRMED", "BOARDED", "COMPLETED")
                or b.get("status") in ("CONFIRMED", "BOARDED", "COMPLETED")
            )
        ]

        passenger_manifest_items = []
        for b in ride_bookings:
            passenger_manifest_items.append({
                "booking_id": b.get("booking_id"),
                "reference_code": b.get("reference_code", f"BC-{b.get('booking_id', '')[:6]}"),
                "passenger_name": b.get("passenger_name") or b.get("passenger", {}).get("name", "Verified Passenger"),
                "passenger_phone": b.get("passenger_phone") or b.get("passenger", {}).get("phone", "+91 94812 00000"),
                "seats_booked": b.get("seats_booked", 1),
                "fare_paid": float(b.get("total_fare") or (b.get("fare_snapshot", {}).get("total_fare", 310.0))),
                "pickup_point": b.get("pickup_point") or b.get("route", {}).get("pickup_point", "Bidar Central Bus Stand"),
                "drop_point": b.get("drop_point") or b.get("route", {}).get("drop_point", "Miyapur Metro Station"),
                "boarding_status": b.get("booking_status", "CONFIRMED"),
                "emergency_contact": b.get("emergency_contact", "N/A"),
            })

        now_utc = datetime.now(timezone.utc)
        auto_disburse_dt = now_utc + timedelta(seconds=settings.MIN_PAYOUT_DELAY_SECONDS)

        req_record = {
            "request_id": f"pout_req_{uuid.uuid4().hex[:8]}",
            "ride_id": ride_id,
            "driver_id": driver_id,
            "driver_name": driver_name,
            "driver_phone": driver_phone,
            "driver_rating": driver_rating,
            "vehicle": vehicle_str,
            "bank_name": "HDFC Bank Ltd",
            "bank_account_masked": "XXXX-XXXX-4120",
            "ifsc_code": "HDFC0001234",
            "upi_id": f"{driver_id[:8]}@okaxis",
            "origin_city": ride.get("origin_city", "Bidar"),
            "destination_city": ride.get("destination_city", "Hyderabad"),
            "departure_time": ride.get("departure_time", "08:00 AM"),
            "completed_at": ride.get("completed_at", now_utc.isoformat()),
            "total_seats_booked": eligibility["total_seats_booked"],
            "gross_amount": eligibility["gross_amount"],
            "commission_deducted": eligibility["commission_deducted"],
            "net_payable": eligibility["net_payable"],
            "passengers": passenger_manifest_items,
            "status": "PENDING_AUDIT",
            "requested_at": now_utc.isoformat(),
            "auto_disburse_at": auto_disburse_dt.isoformat(),
            "delay_seconds": settings.MIN_PAYOUT_DELAY_SECONDS,
            "remaining_seconds": settings.MIN_PAYOUT_DELAY_SECONDS,
            "payout_reference_utr": None,
            "settled_at": None,
        }

        PAYOUT_REQUESTS[ride_id] = req_record
        return req_record

    @staticmethod
    def get_all_payout_requests() -> List[Dict[str, Any]]:
        """
        Retrieves all payout requests with real-time remaining countdown seconds.
        """
        now_dt = datetime.now(timezone.utc)
        results = []
        for req in PAYOUT_REQUESTS.values():
            item = dict(req)
            if item.get("status") == "PENDING_AUDIT":
                try:
                    auto_dt = datetime.fromisoformat(item["auto_disburse_at"].replace("Z", "+00:00"))
                    rem = max(0, int((auto_dt - now_dt).total_seconds()))
                    item["remaining_seconds"] = rem
                except Exception:
                    item["remaining_seconds"] = 0
            results.append(item)
        results.sort(key=lambda x: x.get("requested_at", ""), reverse=True)
        return results

    @staticmethod
    def approve_payout_request(ride_id: str, admin_user_id: str) -> Dict[str, Any]:
        """
        Admin immediately approves a pending payout request and triggers instant IMPS transfer.
        """
        req = PAYOUT_REQUESTS.get(ride_id)
        if not req:
            req = PayoutService.create_payout_request(ride_id, admin_user_id)

        if req.get("status") == "SETTLED":
            return req

        settlement = PayoutService.disburse_payout(
            ride_id=ride_id,
            caller_user_id=admin_user_id,
            is_admin=True,
            force_override_buffer=True,
        )

        req["status"] = "SETTLED"
        req["payout_reference_utr"] = settlement.get("payout_reference_utr")
        req["settled_at"] = settlement.get("settled_at")
        req["approved_by"] = admin_user_id
        req["remaining_seconds"] = 0
        return req

    @staticmethod
    def hold_payout_request(ride_id: str, admin_user_id: str, reason: str = "Passenger Dispute / Audit Required") -> Dict[str, Any]:
        """
        Puts a pending payout request on hold, halting automated clearing.
        """
        req = PAYOUT_REQUESTS.get(ride_id)
        if not req:
            raise HTTPException(status_code=404, detail=f"Payout request for ride {ride_id} not found.")

        if req.get("status") == "SETTLED":
            raise HTTPException(status_code=400, detail="Cannot hold an already settled payout.")

        req["status"] = "ON_HOLD"
        req["hold_reason"] = reason
        req["held_by"] = admin_user_id
        req["held_at"] = datetime.now(timezone.utc).isoformat()
        return req

    @staticmethod
    def process_automated_payouts() -> int:
        """
        Automated clearing processor:
        Runs periodically. If 5 minutes have elapsed since payout request was queued
        and status is PENDING_AUDIT, automatically settles to driver bank account via IMPS.
        """
        now_dt = datetime.now(timezone.utc)
        disbursed_count = 0

        for ride_id, req in list(PAYOUT_REQUESTS.items()):
            if req.get("status") != "PENDING_AUDIT":
                continue

            try:
                auto_dt = datetime.fromisoformat(req["auto_disburse_at"].replace("Z", "+00:00"))
                if now_dt >= auto_dt:
                    settlement = PayoutService.disburse_payout(
                        ride_id=ride_id,
                        caller_user_id="sys_automation_worker",
                        is_admin=True,
                        force_override_buffer=True,
                    )
                    req["status"] = "SETTLED"
                    req["payout_reference_utr"] = settlement.get("payout_reference_utr")
                    req["settled_at"] = settlement.get("settled_at")
                    req["processed_by"] = "AUTOMATION_ENGINE"
                    req["remaining_seconds"] = 0
                    disbursed_count += 1
            except Exception:
                pass

        return disbursed_count
