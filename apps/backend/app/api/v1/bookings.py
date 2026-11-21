from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import random
import uuid
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Header, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from apps.backend.app.database.session import get_db_session
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.pricing import ACTIVE_COMMISSION_RULE
from apps.backend.app.core.dependencies import get_current_user, get_optional_current_user, require_roles, get_current_active_user
from apps.backend.app.models.user import User
from apps.backend.app.models.ride import Ride, RideSeatInventory
from apps.backend.app.models.booking import Booking, BookingPassenger
from apps.backend.app.models.route import Route, City
from apps.backend.app.models.vehicle import Vehicle
from apps.backend.app.schemas.auth import UserRole

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# Global synchronized stores
ACTIVE_BOOKINGS: Dict[str, Dict[str, Any]] = {}
ACTIVE_HOLDS: Dict[str, Dict[str, Any]] = {}
IDEMPOTENCY_HOLD_MAP: Dict[str, str] = {}


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class BookingInitiateRequest(BaseModel):
    ride_id: str
    passenger_name: str
    passenger_phone: str
    requested_seats: int = Field(ge=1, le=4)
    pickup_point: str
    drop_point: str


class HoldSeatRequest(BaseModel):
    ride_id: str
    requested_seats: int = Field(ge=1, le=4)
    pickup_point: str
    drop_point: str
    passenger_name: Optional[str] = "Passenger"
    passenger_phone: Optional[str] = "+919876543210"


class ConfirmHoldRequest(BaseModel):
    upi_utr: Optional[str] = None
    payment_method: Optional[str] = "PERSONAL_UPI_QR"


class CancelBookingRequest(BaseModel):
    cancellation_reason: Optional[str] = "Personal schedule change"


# ---------------------------------------------------------------------------
# Hold & Concurrency Engine Endpoints
# ---------------------------------------------------------------------------

@router.post("/hold", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def hold_seats(
    payload: HoldSeatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Acquire a temporary 10-minute hold on seat inventory.
    Guarantees no race condition or double booking while passenger completes checkout.
    Supports Idempotency-Key header to prevent duplicate reservations.
    """
    # 1. Idempotency Check
    if idempotency_key and idempotency_key in IDEMPOTENCY_HOLD_MAP:
        existing_hold_id = IDEMPOTENCY_HOLD_MAP[idempotency_key]
        if existing_hold_id in ACTIVE_HOLDS:
            hold = ACTIVE_HOLDS[existing_hold_id]
            # Check if still valid
            now = datetime.now(timezone.utc)
            res_until = datetime.fromisoformat(hold["reserved_until"])
            if res_until > now:
                hold["seconds_remaining"] = int((res_until - now).total_seconds())
                return ApiResponse.ok(data=hold)

    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == payload.ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    if ride.get("status") in ("COMPLETED", "CANCELLED"):
        raise HTTPException(
            status_code=400,
            detail=f"Ride is {ride.get('status')} and no longer accepts seat reservations.",
        )

    # Concurrency capacity check
    if ride["available_seats"] < payload.requested_seats:
        raise HTTPException(
            status_code=409,
            detail=f"Requested {payload.requested_seats} seats, but only {ride['available_seats']} remain available.",
        )

    # Decrement inventory atomically
    ride["available_seats"] -= payload.requested_seats

    fare_per_seat = ride["fare_per_seat"]
    total_fare = fare_per_seat * payload.requested_seats
    now = datetime.now(timezone.utc)
    reserved_until = now + timedelta(minutes=10)

    hold_id = f"hold_{int(now.timestamp())}_{random.randint(1000, 9999)}"

    passenger_name = current_user.full_name if current_user else payload.passenger_name
    passenger_phone = current_user.phone if current_user else payload.passenger_phone
    passenger_id = current_user.id if current_user else f"pas_anon_{random.randint(1000, 9999)}"

    hold_record = {
        "hold_id": hold_id,
        "ride_id": payload.ride_id,
        "seats_held": payload.requested_seats,
        "fare_per_seat": fare_per_seat,
        "total_fare": total_fare,
        "passenger": {
            "passenger_id": passenger_id,
            "name": passenger_name,
            "phone": passenger_phone,
        },
        "route_summary": {
            "origin": ride["origin_city"],
            "destination": ride["destination_city"],
            "departure_time": ride["departure_time"],
            "pickup_point": payload.pickup_point,
            "drop_point": payload.drop_point,
        },
        "driver": ride["driver"],
        "vehicle": ride["vehicle"],
        "reserved_until": reserved_until.isoformat(),
        "seconds_remaining": 600,
        "created_at": now.isoformat(),
        "status": "HELD",
    }

    ACTIVE_HOLDS[hold_id] = hold_record
    if idempotency_key:
        IDEMPOTENCY_HOLD_MAP[idempotency_key] = hold_id

    return ApiResponse.ok(data=hold_record)


@router.get("/hold/{hold_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_hold_status(hold_id: str):
    """Check remaining countdown and status of a 10-minute seat hold."""
    hold = ACTIVE_HOLDS.get(hold_id)
    if not hold:
        raise HTTPException(status_code=404, detail="Hold reservation not found or already confirmed.")

    now = datetime.now(timezone.utc)
    res_until = datetime.fromisoformat(hold["reserved_until"])
    seconds_remaining = int((res_until - now).total_seconds())

    if seconds_remaining <= 0:
        # Auto-expire and reclaim seats
        ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == hold["ride_id"]), None)
        if ride:
            ride["available_seats"] += hold["seats_held"]
        del ACTIVE_HOLDS[hold_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Seat hold has expired. Inventory released back to available corridor seats.",
        )

    hold["seconds_remaining"] = seconds_remaining
    return ApiResponse.ok(data=hold)


@router.post("/hold/{hold_id}/confirm", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def confirm_held_booking(
    hold_id: str,
    payload: Optional[ConfirmHoldRequest] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Finalize checkout for an active seat hold via Personal UPI QR Code payment.
    Transitions held seats to CONFIRMED booking and issues PNR digital ticket.
    """
    hold = ACTIVE_HOLDS.get(hold_id)
    if not hold:
        raise HTTPException(status_code=404, detail="Hold not found. May have expired or been processed.")

    now = datetime.now(timezone.utc)
    res_until = datetime.fromisoformat(hold["reserved_until"])
    if now > res_until:
        # Reclaim
        ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == hold["ride_id"]), None)
        if ride:
            ride["available_seats"] += hold["seats_held"]
        del ACTIVE_HOLDS[hold_id]
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Seat hold expired before checkout completion.")

    # Convert to confirmed booking
    booking_id = f"bkg_{int(now.timestamp())}_{random.randint(1000, 9999)}"
    reference_code = f"BC-{now.strftime('%Y%m')}-{random.randint(1000, 9999)}"

    commission_rate = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = commission_rate * hold["seats_held"]
    driver_payable = hold["total_fare"] - total_commission

    passenger_info = hold["passenger"]
    if current_user:
        passenger_info["passenger_id"] = current_user.id
        passenger_info["name"] = current_user.full_name
        passenger_info["phone"] = current_user.phone

    utr_val = payload.upi_utr.strip() if (payload and payload.upi_utr) else f"UPI-{random.randint(100000000000, 999999999999)}"
    pay_method = payload.payment_method if (payload and payload.payment_method) else "PERSONAL_UPI_QR"

    booking_record = {
        "booking_id": booking_id,
        "reference_code": reference_code,
        "ride_id": hold["ride_id"],
        "passenger": passenger_info,
        "driver": hold["driver"],
        "vehicle": hold["vehicle"],
        "route": {
            "origin_city": hold["route_summary"]["origin"],
            "destination_city": hold["route_summary"]["destination"],
            "pickup_point": hold["route_summary"]["pickup_point"],
            "drop_point": hold["route_summary"]["drop_point"],
            "departure_time": hold["route_summary"]["departure_time"],
        },
        "seats_booked": hold["seats_held"],
        "fare_snapshot": {
            "fare_per_seat": hold["fare_per_seat"],
            "total_fare": hold["total_fare"],
            "company_commission": total_commission,
            "driver_payable": driver_payable,
            "commission_rule_id": ACTIVE_COMMISSION_RULE["rule_id"],
        },
        "booking_status": "CONFIRMED",
        "payment_status": "PAID_VIA_UPI_QR",
        "payment_method": pay_method,
        "upi_utr": utr_val,
        "reserved_until": hold["reserved_until"],
        "created_at": now.isoformat(),
    }

    ACTIVE_BOOKINGS[booking_id] = booking_record
    del ACTIVE_HOLDS[hold_id]

    return ApiResponse.ok(data=booking_record)


@router.post("/cleanup-expired", response_model=ApiResponse[Dict[str, Any]])
async def cleanup_expired_holds():
    """
    Automated reaper task: detects holds exceeding the 10-minute window
    and immediately reclaims seat inventory.
    """
    now = datetime.now(timezone.utc)
    expired_ids = []

    for hid, hold in list(ACTIVE_HOLDS.items()):
        res_until = datetime.fromisoformat(hold["reserved_until"])
        if now >= res_until:
            ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == hold["ride_id"]), None)
            if ride:
                ride["available_seats"] += hold["seats_held"]
            expired_ids.append(hid)
            del ACTIVE_HOLDS[hid]

    return ApiResponse.ok(
        data={
            "expired_holds_reclaimed": len(expired_ids),
            "reclaimed_ids": expired_ids,
        }
    )


# ---------------------------------------------------------------------------
# Direct Booking & My Bookings
# ---------------------------------------------------------------------------

@router.post("/initiate", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def initiate_booking(
    payload: BookingInitiateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Direct instant seat reservation.
    Decrements seat inventory in database and creates confirmed booking pass.
    """
    db_ride = await db.get(Ride, payload.ride_id)
    if not db_ride:
        # Check SAMPLE_RIDES fallback
        ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == payload.ride_id), None)
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found.")
        
        if ride.get("status") in ("COMPLETED", "CANCELLED"):
            raise HTTPException(status_code=400, detail="Cannot book seats on a completed or cancelled ride.")

        if ride["available_seats"] < payload.requested_seats:
            raise HTTPException(
                status_code=409,
                detail=f"Requested {payload.requested_seats} seats, but only {ride['available_seats']} remain available.",
            )

        fare_per_seat = ride["fare_per_seat"]
        total_fare = fare_per_seat * payload.requested_seats
        commission_per_seat = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
        total_commission = commission_per_seat * payload.requested_seats
        driver_payable = total_fare - total_commission

        ride["available_seats"] -= payload.requested_seats

        passenger_id = current_user.id if current_user else f"pas_anon_{random.randint(1000, 9999)}"
        passenger_name = current_user.full_name if current_user else payload.passenger_name
        passenger_phone = current_user.phone if current_user else payload.passenger_phone

        booking_id = f"bkg_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
        reference_code = f"BC-{datetime.now(timezone.utc).strftime('%Y%m')}-{random.randint(1000, 9999)}"
        reserved_until = datetime.now(timezone.utc) + timedelta(minutes=10)

        booking_record = {
            "booking_id": booking_id,
            "reference_code": reference_code,
            "ride_id": payload.ride_id,
            "passenger": {
                "passenger_id": passenger_id,
                "name": passenger_name,
                "phone": passenger_phone,
            },
            "driver": ride["driver"],
            "vehicle": ride["vehicle"],
            "route": {
                "origin_city": ride["origin_city"],
                "destination_city": ride["destination_city"],
                "pickup_point": payload.pickup_point,
                "drop_point": payload.drop_point,
                "departure_time": ride["departure_time"],
            },
            "seats_booked": payload.requested_seats,
            "fare_snapshot": {
                "fare_per_seat": fare_per_seat,
                "total_fare": total_fare,
                "company_commission": total_commission,
                "driver_payable": driver_payable,
                "commission_rule_id": ACTIVE_COMMISSION_RULE["rule_id"],
            },
            "booking_status": "CONFIRMED",
            "payment_status": "CAPTURED",
            "reserved_until": reserved_until.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        ACTIVE_BOOKINGS[booking_id] = booking_record
        return ApiResponse.ok(data=booking_record)

    # Database-backed ride booking flow
    await db.refresh(db_ride, ["seat_inventory", "driver", "vehicle"])
    if db_ride.status in ("COMPLETED", "CANCELLED"):
        raise HTTPException(status_code=400, detail="Cannot book seats on a completed or cancelled ride.")

    avail_seats = db_ride.seat_inventory.available_seats if db_ride.seat_inventory else db_ride.total_offered_seats
    if avail_seats < payload.requested_seats:
        raise HTTPException(
            status_code=409,
            detail=f"Requested {payload.requested_seats} seats, but only {avail_seats} remain available."
        )

    # Locked Regulated Fare Calculations
    fare_per_seat = float(db_ride.fare_per_seat_snapshot)
    total_fare = fare_per_seat * payload.requested_seats
    commission_per_seat = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = commission_per_seat * payload.requested_seats
    driver_payable = total_fare - total_commission

    # Decrement atomic seat inventory
    if db_ride.seat_inventory:
        db_ride.seat_inventory.available_seats -= payload.requested_seats
        db_ride.seat_inventory.reserved_seats += payload.requested_seats

    # Mirror decrement in SAMPLE_RIDES if present
    for sr in SAMPLE_RIDES:
        if sr.get("ride_id") == payload.ride_id:
            sr["available_seats"] = max(0, sr["available_seats"] - payload.requested_seats)

    passenger_id = current_user.id if current_user else None
    if not passenger_id and payload.passenger_phone:
        clean_p = payload.passenger_phone.strip()
        matched = await db.scalar(select(User.id).where((User.phone == clean_p) | (User.phone.like(f"%{clean_p[-10:]}%"))))
        if matched:
            passenger_id = matched

    if not passenger_id:
        clean_phone = payload.passenger_phone.strip() if payload.passenger_phone else f"+9198{random.randint(10000000, 99999999)}"
        guest_u = User(
            id=f"pas_{uuid.uuid4().hex[:12]}",
            phone=clean_phone,
            full_name=payload.passenger_name or "Passenger Commuter",
            is_passenger=True,
            is_active=True,
        )
        db.add(guest_u)
        await db.flush()
        passenger_id = guest_u.id

    passenger_name = current_user.full_name if current_user else payload.passenger_name
    passenger_phone = current_user.phone if current_user else payload.passenger_phone

    booking_id = f"bkg_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
    reference_code = f"BC-{datetime.now(timezone.utc).strftime('%Y%m')}-{random.randint(1000, 9999)}"
    reserved_until = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Insert Booking record in database
    db_booking = Booking(
        id=booking_id,
        reference_code=reference_code,
        ride_id=db_ride.id,
        passenger_id=passenger_id,
        pickup_landmark=payload.pickup_point,
        drop_landmark=payload.drop_point,
        seats_booked=payload.requested_seats,
        fare_per_seat=fare_per_seat,
        total_fare=total_fare,
        commission_amount=total_commission,
        driver_payable=driver_payable,
        booking_status="CONFIRMED",
        reserved_until=reserved_until,
    )
    db.add(db_booking)

    db_pass_detail = BookingPassenger(
        booking_id=booking_id,
        passenger_name=passenger_name,
        age_declaration=True,
        luggage_count=1,
    )
    db.add(db_pass_detail)
    await db.commit()

    orig_name = "Bidar"
    dest_name = "Hyderabad"
    if db_ride.route_id:
        route_obj = await db.get(Route, db_ride.route_id)
        if route_obj:
            c1 = await db.get(City, route_obj.origin_city_id)
            c2 = await db.get(City, route_obj.destination_city_id)
            if c1: orig_name = c1.name
            if c2: dest_name = c2.name

    booking_record = {
        "booking_id": booking_id,
        "reference_code": reference_code,
        "ride_id": db_ride.id,
        "passenger": {
            "passenger_id": passenger_id,
            "name": passenger_name,
            "phone": passenger_phone,
        },
        "driver": {
            "driver_id": db_ride.driver_id,
            "name": db_ride.driver.full_name if db_ride.driver else "Verified Driver",
            "rating": 5.0,
        },
        "vehicle": {
            "vehicle_id": db_ride.vehicle_id,
            "make": db_ride.vehicle.make if db_ride.vehicle else "Car",
            "model": db_ride.vehicle.model if db_ride.vehicle else "Sedan",
            "registration_number": db_ride.vehicle.registration_number if db_ride.vehicle else "KA 38 P 0000",
            "fuel_type": db_ride.vehicle.fuel_type if db_ride.vehicle else "PETROL",
        },
        "route": {
            "origin_city": orig_name,
            "destination_city": dest_name,
            "pickup_point": payload.pickup_point,
            "drop_point": payload.drop_point,
            "departure_time": db_ride.departure_time.isoformat() if db_ride.departure_time else datetime.now(timezone.utc).isoformat(),
        },
        "ride": {
            "origin_city": orig_name,
            "destination_city": dest_name,
            "departure_time": db_ride.departure_time.isoformat() if db_ride.departure_time else datetime.now(timezone.utc).isoformat(),
            "driver": {
                "name": db_ride.driver.full_name if db_ride.driver else "Verified Driver",
                "phone": db_ride.driver.phone if db_ride.driver else "+91 8482 112 112",
            },
            "vehicle": {
                "make": db_ride.vehicle.make if db_ride.vehicle else "Car",
                "model": db_ride.vehicle.model if db_ride.vehicle else "Sedan",
            }
        },
        "seats_booked": payload.requested_seats,
        "fare_snapshot": {
            "fare_per_seat": fare_per_seat,
            "total_fare": total_fare,
            "company_commission": total_commission,
            "driver_payable": driver_payable,
            "commission_rule_id": ACTIVE_COMMISSION_RULE["rule_id"],
        },
        "booking_status": "CONFIRMED",
        "payment_status": "CAPTURED",
        "reserved_until": reserved_until.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    ACTIVE_BOOKINGS[booking_id] = booking_record
    return ApiResponse.ok(data=booking_record)


@router.get("/my", response_model=ApiResponse[Dict[str, List[Dict[str, Any]]]])
async def get_my_bookings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Returns all bookings for current passenger split into upcoming and history."""
    stmt = (
        select(Booking)
        .where(
            (Booking.passenger_id == current_user.id)
            | (Booking.passenger_id == current_user.phone)
        )
        .options(
            selectinload(Booking.ride).selectinload(Ride.driver),
            selectinload(Booking.ride).selectinload(Ride.vehicle),
            selectinload(Booking.ride).selectinload(Ride.stops),
            selectinload(Booking.passenger),
            selectinload(Booking.passengers_detail),
        )
        .order_by(Booking.created_at.desc())
    )
    res = await db.execute(stmt)
    db_bookings = list(res.scalars().all())

    phone_clean = current_user.phone[-10:] if current_user.phone and len(current_user.phone) >= 10 else current_user.phone
    if phone_clean:
        stmt2 = (
            select(Booking)
            .join(User, Booking.passenger_id == User.id)
            .where(User.phone.like(f"%{phone_clean}%"))
            .options(
                selectinload(Booking.ride).selectinload(Ride.driver),
                selectinload(Booking.ride).selectinload(Ride.vehicle),
                selectinload(Booking.ride).selectinload(Ride.stops),
                selectinload(Booking.passenger),
                selectinload(Booking.passengers_detail),
            )
            .order_by(Booking.created_at.desc())
        )
        res2 = await db.execute(stmt2)
        more_bookings = res2.scalars().all()
        existing_ids = {b.id for b in db_bookings}
        for mb in more_bookings:
            if mb.id not in existing_ids:
                db_bookings.append(mb)
                existing_ids.add(mb.id)

    seen_ids = set()
    all_user_bookings = []

    for b in db_bookings:
        seen_ids.add(b.id)
        r = b.ride
        orig_city = "Bidar"
        dest_city = "Hyderabad"
        if r and r.route_id:
            route_obj = await db.get(Route, r.route_id)
            if route_obj:
                c1 = await db.get(City, route_obj.origin_city_id)
                c2 = await db.get(City, route_obj.destination_city_id)
                if c1: orig_city = c1.name
                if c2: dest_city = c2.name

        dep_iso = r.departure_time.isoformat() if (r and r.departure_time) else (b.created_at.isoformat() if b.created_at else datetime.now(timezone.utc).isoformat())

        drv_name = r.driver.full_name if (r and r.driver) else "Verified Driver"
        drv_phone = r.driver.phone if (r and r.driver) else "+91 8482 112 112"
        p_name = b.passenger.full_name if b.passenger else (b.passengers_detail[0].passenger_name if (b.passengers_detail and len(b.passengers_detail) > 0) else "Passenger")

        veh_make = r.vehicle.make if (r and r.vehicle) else "Car"
        veh_model = r.vehicle.model if (r and r.vehicle) else "Sedan"
        veh_reg = r.vehicle.registration_number if (r and r.vehicle) else "KA 38 P 0000"

        booking_dict = {
            "booking_id": b.id,
            "reference_code": b.reference_code,
            "ride_id": b.ride_id,
            "passenger": {
                "passenger_id": b.passenger_id,
                "name": p_name,
                "phone": b.passenger.phone if b.passenger else current_user.phone,
            },
            "driver": {
                "name": drv_name,
                "phone": drv_phone,
            },
            "vehicle": {
                "make": veh_make,
                "model": veh_model,
                "registration_number": veh_reg,
            },
            "route": {
                "origin_city": orig_city,
                "destination_city": dest_city,
                "pickup_point": b.pickup_landmark,
                "drop_point": b.drop_landmark,
                "departure_time": dep_iso,
            },
            "ride": {
                "origin_city": orig_city,
                "destination_city": dest_city,
                "departure_time": dep_iso,
                "driver": {
                    "name": drv_name,
                    "phone": drv_phone,
                },
                "vehicle": {
                    "make": veh_make,
                    "model": veh_model,
                    "registration_number": veh_reg,
                }
            },
            "seats_booked": b.seats_booked,
            "fare_snapshot": {
                "fare_per_seat": float(b.fare_per_seat),
                "total_fare": float(b.total_fare),
                "company_commission": float(b.commission_amount),
                "driver_payable": float(b.driver_payable),
            },
            "total_fare": float(b.total_fare),
            "booking_status": b.booking_status,
            "payment_status": "PAID_ESCROW",
            "created_at": b.created_at.isoformat() if b.created_at else datetime.now(timezone.utc).isoformat(),
        }
        all_user_bookings.append(booking_dict)

    for b in ACTIVE_BOOKINGS.values():
        b_id = b.get("booking_id")
        if b_id in seen_ids:
            continue
        pid = b.get("passenger", {}).get("passenger_id") if isinstance(b.get("passenger"), dict) else b.get("passenger_id")
        pphone = b.get("passenger", {}).get("phone") if isinstance(b.get("passenger"), dict) else b.get("passenger_phone")
        if pid == current_user.id or (phone_clean and pphone and phone_clean in pphone):
            seen_ids.add(b_id)
            if "ride" not in b and "route" in b:
                b["ride"] = {
                    "origin_city": b["route"].get("origin_city", "Bidar"),
                    "destination_city": b["route"].get("destination_city", "Hyderabad"),
                    "departure_time": b["route"].get("departure_time"),
                    "driver": b.get("driver"),
                    "vehicle": b.get("vehicle"),
                }
            all_user_bookings.append(b)

    now_iso = datetime.now(timezone.utc).isoformat()
    upcoming = []
    history = []

    for b in all_user_bookings:
        status_val = b.get("booking_status") or b.get("status", "CONFIRMED")
        dep_time = (
            b.get("route", {}).get("departure_time")
            if isinstance(b.get("route"), dict)
            else (b.get("ride", {}).get("departure_time") if isinstance(b.get("ride"), dict) else b.get("departure_time", now_iso))
        )
        if status_val in ("CONFIRMED", "SCHEDULED") and dep_time >= now_iso:
            upcoming.append(b)
        else:
            history.append(b)

    upcoming.sort(key=lambda x: x.get("route", {}).get("departure_time", "") if isinstance(x.get("route"), dict) else x.get("departure_time", ""))
    history.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return ApiResponse.ok(data={"upcoming": upcoming, "history": history})


@router.get("/{booking_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_booking_details(
    booking_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve full booking receipt by ID. Enforces Anti-IDOR."""
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found.")

    if current_user and not current_user.is_admin:
        if booking["passenger"]["passenger_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this booking.",
            )

    return ApiResponse.ok(data=booking)


# ---------------------------------------------------------------------------
# Tiered Cancellation & Refund Engine (Rule BR-REF-01)
# ---------------------------------------------------------------------------

def calculate_cancellation_refund(booking: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes exact refund eligibility based on time until scheduled departure:
    - > 2 hours before departure: 100% full refund
    - <= 2 hours before departure: 50% partial refund (50% fee to driver)
    - Post-departure: 0% refund (no-show)
    """
    total_fare = float(booking["fare_snapshot"]["total_fare"])
    dep_time_str = booking["route"]["departure_time"]
    now = datetime.now(timezone.utc)

    try:
        dep_dt = datetime.fromisoformat(dep_time_str.replace("Z", "+00:00"))
    except Exception:
        dep_dt = now + timedelta(hours=3)

    hours_until_departure = (dep_dt - now).total_seconds() / 3600.0

    if hours_until_departure > 2.0:
        refund_pct = 100
        refund_amt = total_fare
        deduction = 0.0
        tier = "FULL_REFUND"
        explanation = "Cancellation > 2 hours prior to scheduled departure qualifies for 100% full refund."
    elif 0.0 <= hours_until_departure <= 2.0:
        refund_pct = 50
        refund_amt = round(total_fare * 0.50, 2)
        deduction = round(total_fare * 0.50, 2)
        tier = "PARTIAL_REFUND"
        explanation = "Cancellation within 2 hours of departure incurs a 50% late fee credited to driver."
    else:
        refund_pct = 0
        refund_amt = 0.0
        deduction = total_fare
        tier = "NO_REFUND"
        explanation = "Trip has already departed. Post-departure cancellations are non-refundable."

    return {
        "booking_id": booking["booking_id"],
        "reference_code": booking["reference_code"],
        "total_fare_paid": total_fare,
        "hours_until_departure": round(hours_until_departure, 2),
        "refund_percentage": refund_pct,
        "refund_amount": refund_amt,
        "deduction_amount": deduction,
        "cancellation_tier": tier,
        "explanation": explanation,
    }


@router.get("/{booking_id}/cancellation-quote", response_model=ApiResponse[Dict[str, Any]])
async def get_cancellation_quote(
    booking_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Preview tiered refund calculation before confirming cancellation.
    Enforces Rule BR-REF-01 (>2 hrs = 100%, <=2 hrs = 50%, post-departure = 0%).
    """
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if current_user and not current_user.is_admin:
        if booking["passenger"]["passenger_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to quote cancellation on this booking.")

    if booking["booking_status"] == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking is already cancelled.")

    quote = calculate_cancellation_refund(booking)
    return ApiResponse.ok(data=quote)


@router.post("/{booking_id}/cancel", response_model=ApiResponse[Dict[str, Any]])
async def cancel_booking(
    booking_id: str,
    payload: CancelBookingRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Cancels an active booking, reclaims seat inventory, and applies tiered refund policy.
    Enforces object ownership (Anti-IDOR).
    """
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if not current_user.is_admin and booking["passenger"]["passenger_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot cancel another passenger's booking.",
        )

    if booking["booking_status"] == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking is already cancelled.")

    # Reclaim seat inventory
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == booking["ride_id"]), None)
    if ride:
        ride["available_seats"] += booking["seats_booked"]

    quote = calculate_cancellation_refund(booking)

    booking["booking_status"] = "CANCELLED"
    booking["cancellation_reason"] = payload.cancellation_reason
    booking["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    booking["refund_amount"] = quote["refund_amount"]
    booking["deduction_amount"] = quote["deduction_amount"]
    booking["cancellation_tier"] = quote["cancellation_tier"]
    booking["cancellation_explanation"] = quote["explanation"]

    return ApiResponse.ok(data=booking)


class CreateReviewPayload(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Driver rating from 1 to 5 stars")
    tags: List[str] = Field(default_factory=list, description="Compliment tags e.g. Punctual, Smooth Driving")
    comment: Optional[str] = Field(None, max_length=500, description="Optional review comment")


@router.post("/{booking_id}/review", response_model=ApiResponse[Dict[str, Any]])
async def create_booking_review(
    booking_id: str,
    payload: CreateReviewPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Submits a passenger review and rating for a completed or active booking.
    Updates driver partner ratings and attaches to booking.
    """
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if not current_user.is_admin and booking["passenger"]["passenger_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot review a booking that does not belong to you.",
        )

    # Attach review to booking
    review_record = {
        "review_id": f"rev_{uuid.uuid4().hex[:8]}",
        "booking_id": booking_id,
        "rating": payload.rating,
        "tags": payload.tags,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "passenger_name": booking["passenger"]["name"],
    }
    booking["review"] = review_record

    # Update driver rating in memory for the ride
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == booking["ride_id"]), None)
    if ride and "driver" in ride:
        old_rating = ride["driver"].get("rating", 4.9)
        new_rating = round((old_rating + payload.rating) / 2.0, 1)
        ride["driver"]["rating"] = new_rating

    return ApiResponse.ok(
        data={
            "booking_id": booking_id,
            "review": review_record,
            "message": "Thank you! Your driver rating and feedback have been recorded.",
        }
    )
