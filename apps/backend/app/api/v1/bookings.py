from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import random
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Header
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.pricing import ACTIVE_COMMISSION_RULE

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# In-memory booking records
ACTIVE_BOOKINGS: Dict[str, Dict[str, Any]] = {}


class BookingInitiateRequest(BaseModel):
    ride_id: str
    passenger_id: str
    passenger_name: str
    passenger_phone: str
    requested_seats: int = Field(ge=1, le=4)
    pickup_point: str
    drop_point: str


@router.post("/initiate", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def initiate_booking(
    payload: BookingInitiateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """
    Initiate seat reservation with 10-minute hold.
    Enforces atomic seat verification, fare snapshot, and platform commission snapshot.
    """
    # Find matching ride
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == payload.ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Concurrency / Capacity Check
    if ride["available_seats"] < payload.requested_seats:
        raise HTTPException(
            status_code=409,
            detail=f"Requested {payload.requested_seats} seats, but only {ride['available_seats']} remain available."
        )

    # Invariant: Snapshot pricing and commission
    fare_per_seat = ride["fare_per_seat"]
    total_fare = fare_per_seat * payload.requested_seats
    commission_per_seat = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = commission_per_seat * payload.requested_seats
    driver_payable = total_fare - total_commission

    # Decrement inventory
    ride["available_seats"] -= payload.requested_seats

    booking_id = f"bkg_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
    reference_code = f"BC-{datetime.now(timezone.utc).strftime('%Y%m')}-{random.randint(1000, 9999)}"
    reserved_until = datetime.now(timezone.utc) + timedelta(minutes=10)

    booking_record = {
        "booking_id": booking_id,
        "reference_code": reference_code,
        "ride_id": payload.ride_id,
        "passenger": {
            "passenger_id": payload.passenger_id,
            "name": payload.passenger_name,
            "phone": payload.passenger_phone
        },
        "driver": ride["driver"],
        "vehicle": ride["vehicle"],
        "route": {
            "origin_city": ride["origin_city"],
            "destination_city": ride["destination_city"],
            "pickup_point": payload.pickup_point,
            "drop_point": payload.drop_point,
            "departure_time": ride["departure_time"]
        },
        "seats_booked": payload.requested_seats,
        "fare_snapshot": {
            "fare_per_seat": fare_per_seat,
            "total_fare": total_fare,
            "company_commission": total_commission,
            "driver_payable": driver_payable,
            "commission_rule_id": ACTIVE_COMMISSION_RULE["rule_id"]
        },
        "booking_status": "CONFIRMED",
        "payment_status": "CAPTURED",
        "reserved_until": reserved_until.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    ACTIVE_BOOKINGS[booking_id] = booking_record
    return ApiResponse.ok(data=booking_record)


@router.get("/{booking_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_booking_details(booking_id: str):
    """Retrieve full booking receipt and digital ticket by ID."""
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found.")
    return ApiResponse.ok(data=booking)
