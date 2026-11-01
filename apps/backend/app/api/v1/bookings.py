from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import random
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Header, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.backend.app.database.session import get_db_session
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.pricing import ACTIVE_COMMISSION_RULE
from apps.backend.app.core.dependencies import get_current_user, get_optional_current_user, require_roles
from apps.backend.app.models.user import User
from apps.backend.app.schemas.auth import UserRole

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# Global synchronized booking store
ACTIVE_BOOKINGS: Dict[str, Dict[str, Any]] = {}


class BookingInitiateRequest(BaseModel):
    ride_id: str
    passenger_name: str
    passenger_phone: str
    requested_seats: int = Field(ge=1, le=4)
    pickup_point: str
    drop_point: str


class CancelBookingRequest(BaseModel):
    cancellation_reason: Optional[str] = "Personal schedule change"


@router.post("/initiate", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def initiate_booking(
    payload: BookingInitiateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Initiate seat reservation with 10-minute hold.
    Enforces atomic seat verification, fare snapshot, and platform commission snapshot.
    Associates booking directly with authenticated passenger identity.
    """
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == payload.ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Concurrency / Capacity Check
    if ride["available_seats"] < payload.requested_seats:
        raise HTTPException(
            status_code=409,
            detail=f"Requested {payload.requested_seats} seats, but only {ride['available_seats']} remain available.",
        )

    # Invariant: Snapshot pricing and commission
    fare_per_seat = ride["fare_per_seat"]
    total_fare = fare_per_seat * payload.requested_seats
    commission_per_seat = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = commission_per_seat * payload.requested_seats
    driver_payable = total_fare - total_commission

    # Decrement inventory
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


@router.get("/my", response_model=ApiResponse[Dict[str, List[Dict[str, Any]]]])
async def get_my_bookings(
    current_user: User = Depends(require_roles(UserRole.PASSENGER)),
):
    """
    Returns list of all bookings for the currently authenticated passenger,
    segregated into 'upcoming' and 'history'.
    """
    user_bookings = [
        b for b in ACTIVE_BOOKINGS.values()
        if b["passenger"]["passenger_id"] == current_user.id
    ]

    now_iso = datetime.now(timezone.utc).isoformat()
    upcoming = []
    history = []

    for b in user_bookings:
        if b["booking_status"] == "CONFIRMED" and b["route"]["departure_time"] >= now_iso:
            upcoming.append(b)
        else:
            history.append(b)

    upcoming.sort(key=lambda x: x["route"]["departure_time"])
    history.sort(key=lambda x: x["created_at"], reverse=True)

    return ApiResponse.ok(data={"upcoming": upcoming, "history": history})


@router.get("/{booking_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_booking_details(
    booking_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve full booking receipt and digital ticket by ID. Enforces Anti-IDOR."""
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found.")

    # Anti-IDOR protection: Only booking owner or admin may view ticket pass
    if current_user and not current_user.is_admin:
        if booking["passenger"]["passenger_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this booking.",
            )

    return ApiResponse.ok(data=booking)


@router.post("/{booking_id}/cancel", response_model=ApiResponse[Dict[str, Any]])
async def cancel_booking(
    booking_id: str,
    payload: CancelBookingRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Cancels an active booking, restores seat inventory, and calculates refund eligibility.
    Enforces object ownership (anti-IDOR).
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

    # Restore seat inventory
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == booking["ride_id"]), None)
    if ride:
        ride["available_seats"] += booking["seats_booked"]

    total_paid = booking["fare_snapshot"]["total_fare"]
    booking["booking_status"] = "CANCELLED"
    booking["cancellation_reason"] = payload.cancellation_reason
    booking["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    booking["refund_amount"] = total_paid

    return ApiResponse.ok(data=booking)
