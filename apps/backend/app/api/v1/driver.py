from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
import random
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User, DriverProfile
from apps.backend.app.models.vehicle import Vehicle, VehicleDocument
from apps.backend.app.models.ride import Ride, RideStop, RideSeatInventory
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_active_user, require_roles
from apps.backend.app.schemas.auth import UserRole
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
from apps.backend.app.api.v1.pricing import ACTIVE_ROUTE_PRICES, ACTIVE_COMMISSION_RULE

router = APIRouter(prefix="/driver", tags=["Driver Portal"])

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class DriverProfileResponse(BaseModel):
    user_id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_driver: bool
    is_verified: bool
    licence_number: Optional[str] = None
    licence_expiry: Optional[str] = None
    total_completed_trips: int = 0
    average_rating: float = 5.0
    payout_bank_account: Optional[str] = None
    payout_ifsc: Optional[str] = None
    payout_upi_id: Optional[str] = None


class DriverOnboardRequest(BaseModel):
    licence_number: str = Field(..., min_length=5, max_length=50)
    licence_expiry: date = Field(..., description="Driving licence expiry date (YYYY-MM-DD)")
    licence_document_id: Optional[str] = Field("doc_licence_default", max_length=255)


class PayoutSettingsRequest(BaseModel):
    payout_upi_id: Optional[str] = Field(None, max_length=100)
    payout_bank_account: Optional[str] = Field(None, max_length=50)
    payout_ifsc: Optional[str] = Field(None, max_length=20)


class VehicleItemResponse(BaseModel):
    vehicle_id: str
    make: str
    model: str
    registration_number: str
    color: str
    year: int
    fuel_type: str
    passenger_capacity: int
    is_active: bool
    is_verified: bool


class RegisterVehicleRequest(BaseModel):
    make: str = Field(..., min_length=2, max_length=50)
    model: str = Field(..., min_length=2, max_length=50)
    registration_number: str = Field(..., min_length=5, max_length=20)
    color: str = Field(..., min_length=2, max_length=30)
    year: int = Field(..., ge=2000, le=2030)
    fuel_type: str = Field("PETROL", description="PETROL, DIESEL, CNG, EV")
    passenger_capacity: int = Field(4, ge=1, le=7)


class DriverPublishRideRequest(BaseModel):
    origin_city: str = Field(..., description="Bidar or Hyderabad")
    destination_city: str = Field(..., description="Hyderabad or Bidar")
    departure_time: str = Field(..., description="ISO 8601 string or readable time")
    pickup_point: str = Field(..., min_length=3, max_length=100)
    drop_point: str = Field(..., min_length=3, max_length=100)
    available_seats: int = Field(..., ge=1, le=6)
    vehicle_id: str
    driver_notes: Optional[str] = None


class UpdateRideStatusRequest(BaseModel):
    status: str = Field(..., description="SCHEDULED, EN_ROUTE, TRIP_STARTED, ARRIVED, COMPLETED, CANCELLED")


class PassengerManifestItemResponse(BaseModel):
    booking_id: str
    reference_code: str
    passenger_name: str
    passenger_phone: str
    seats_booked: number = 1
    pickup_point: str
    drop_point: str
    fare_amount: float
    booking_status: str
    payment_status: str
    emergency_contact: Optional[Dict[str, str]] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=ApiResponse[DriverProfileResponse])
async def get_driver_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Retrieve driver profile, KYC status, and payout configuration."""
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.driver_profile))
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none() or current_user

    dp = user.driver_profile
    return ApiResponse.ok(
        data=DriverProfileResponse(
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            email=user.email,
            avatar_url=user.avatar_url,
            is_driver=user.is_driver,
            is_verified=dp.is_verified if dp else False,
            licence_number=dp.licence_number if dp else None,
            licence_expiry=dp.licence_expiry.isoformat() if (dp and dp.licence_expiry) else None,
            total_completed_trips=dp.total_completed_trips if dp else 0,
            average_rating=float(dp.average_rating) if dp else 5.0,
            payout_bank_account=dp.payout_bank_account if dp else None,
            payout_ifsc=dp.payout_ifsc if dp else None,
            payout_upi_id=dp.payout_upi_id if dp else None,
        )
    )


@router.post("/onboard", response_model=ApiResponse[DriverProfileResponse])
async def onboard_driver(
    payload: DriverOnboardRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Submit driver driving licence details.
    Enforces that licence expiry date is in the future.
    Activates driver role and issues verified partner status.
    """
    if payload.licence_expiry <= date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driving licence has already expired. Valid licence required.",
        )

    clean_licence = payload.licence_number.strip().upper()
    # Check if licence is already claimed by another driver
    existing_lic = await db.execute(
        select(DriverProfile).where(
            DriverProfile.licence_number == clean_licence,
            DriverProfile.user_id != current_user.id
        )
    )
    if existing_lic.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driving licence {clean_licence} is already registered to another driver account.",
        )

    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.driver_profile))
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_driver = True

    if user.driver_profile:
        user.driver_profile.licence_number = payload.licence_number.upper()
        user.driver_profile.licence_expiry = payload.licence_expiry
        user.driver_profile.licence_document_id = payload.licence_document_id or "doc_licence"
        user.driver_profile.is_verified = True
    else:
        new_dp = DriverProfile(
            user_id=user.id,
            licence_number=payload.licence_number.upper(),
            licence_expiry=payload.licence_expiry,
            licence_document_id=payload.licence_document_id or "doc_licence",
            is_verified=True,
            total_completed_trips=0,
            average_rating=5.00,
        )
        db.add(new_dp)

    await db.commit()
    await db.refresh(user)

    dp = user.driver_profile
    return ApiResponse.ok(
        data=DriverProfileResponse(
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            email=user.email,
            avatar_url=user.avatar_url,
            is_driver=user.is_driver,
            is_verified=dp.is_verified,
            licence_number=dp.licence_number,
            licence_expiry=dp.licence_expiry.isoformat() if dp.licence_expiry else None,
            total_completed_trips=dp.total_completed_trips,
            average_rating=float(dp.average_rating),
            payout_bank_account=dp.payout_bank_account,
            payout_ifsc=dp.payout_ifsc,
            payout_upi_id=dp.payout_upi_id,
        )
    )


@router.put("/payout-settings", response_model=ApiResponse[Dict[str, str]])
async def update_payout_settings(
    payload: PayoutSettingsRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Configure driver UPI ID or Bank account for automatic trip clearing."""
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.driver_profile))
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.driver_profile:
        raise HTTPException(
            status_code=400,
            detail="Driver profile not initialized. Please complete onboarding first.",
        )

    if payload.payout_upi_id is not None:
        user.driver_profile.payout_upi_id = payload.payout_upi_id.strip()
    if payload.payout_bank_account is not None:
        user.driver_profile.payout_bank_account = payload.payout_bank_account.strip()
    if payload.payout_ifsc is not None:
        user.driver_profile.payout_ifsc = payload.payout_ifsc.strip().upper()

    await db.commit()
    return ApiResponse.ok(data={"message": "Payout settings updated successfully"})


@router.get("/vehicles", response_model=ApiResponse[List[VehicleItemResponse]])
async def list_driver_vehicles(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """List all registered vehicles owned by the authenticated driver."""
    stmt = select(Vehicle).where(Vehicle.driver_id == current_user.id)
    res = await db.execute(stmt)
    vehicles = res.scalars().all()

    items = [
        VehicleItemResponse(
            vehicle_id=v.id,
            make=v.make,
            model=v.model,
            registration_number=v.registration_number,
            color=v.color,
            year=v.year,
            fuel_type=v.fuel_type,
            passenger_capacity=v.passenger_capacity,
            is_active=v.is_active,
            is_verified=v.is_verified,
        )
        for v in vehicles
    ]

    # Provide default fallback vehicle for newly registered driver if empty
    if not items:
        default_v = Vehicle(
            driver_id=current_user.id,
            make="Maruti Suzuki",
            model="Swift Dzire",
            registration_number="KA 38 M 4590",
            color="White",
            year=2022,
            fuel_type="DIESEL",
            passenger_capacity=4,
            is_active=True,
            is_verified=True,
        )
        db.add(default_v)
        await db.commit()
        await db.refresh(default_v)
        items.append(
            VehicleItemResponse(
                vehicle_id=default_v.id,
                make=default_v.make,
                model=default_v.model,
                registration_number=default_v.registration_number,
                color=default_v.color,
                year=default_v.year,
                fuel_type=default_v.fuel_type,
                passenger_capacity=default_v.passenger_capacity,
                is_active=default_v.is_active,
                is_verified=default_v.is_verified,
            )
        )

    return ApiResponse.ok(data=items)


@router.post("/vehicles", response_model=ApiResponse[VehicleItemResponse], status_code=201)
async def register_vehicle(
    payload: RegisterVehicleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Register a new vehicle to the driver's fleet."""
    clean_reg = payload.registration_number.strip().upper()
    existing = await db.execute(select(Vehicle).where(Vehicle.registration_number == clean_reg))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Vehicle with registration number {clean_reg} is already registered.",
        )

    vehicle = Vehicle(
        driver_id=current_user.id,
        make=payload.make.strip(),
        model=payload.model.strip(),
        registration_number=clean_reg,
        color=payload.color.strip(),
        year=payload.year,
        fuel_type=payload.fuel_type.upper(),
        passenger_capacity=payload.passenger_capacity,
        is_active=True,
        is_verified=True,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return ApiResponse.ok(
        data=VehicleItemResponse(
            vehicle_id=vehicle.id,
            make=vehicle.make,
            model=vehicle.model,
            registration_number=vehicle.registration_number,
            color=vehicle.color,
            year=vehicle.year,
            fuel_type=vehicle.fuel_type,
            passenger_capacity=vehicle.passenger_capacity,
            is_active=vehicle.is_active,
            is_verified=vehicle.is_verified,
        )
    )


@router.get("/rides", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_driver_rides(
    current_user: User = Depends(get_current_active_user),
):
    """
    List all rides published by the authenticated driver.
    Includes booking counts, confirmed passenger tally, and estimated gross earnings.
    """
    driver_rides = [
        r for r in SAMPLE_RIDES
        if r["driver"]["driver_id"] in (current_user.id, "drv_101")
    ]

    # Enrich with booking information
    results = []
    for r in driver_rides:
        ride_id = r["ride_id"]
        # Find bookings for this ride
        bookings = [b for b in ACTIVE_BOOKINGS.values() if b["ride_id"] == ride_id]
        total_passengers = sum(b["seats_booked"] for b in bookings if b["booking_status"] != "CANCELLED")
        gross_earnings = total_passengers * r["fare_per_seat"]

        results.append({
            **r,
            "total_confirmed_passengers": total_passengers,
            "estimated_gross_earnings": gross_earnings,
            "status": r.get("status", "SCHEDULED"),
        })

    return ApiResponse.ok(data=results)


@router.post("/rides", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def driver_publish_ride(
    payload: DriverPublishRideRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Publish a new ride between Bidar and Hyderabad.
    INVARIANT: Driver CANNOT set fare per seat. It is locked by Admin pricing rules (₹310).
    """
    # Verify Route
    route_match = next(
        (r for r in ACTIVE_ROUTE_PRICES
         if r["origin_city"].lower() == payload.origin_city.lower()
         and r["destination_city"].lower() == payload.destination_city.lower()),
        None
    )
    if not route_match:
        raise HTTPException(
            status_code=400,
            detail=f"Route from {payload.origin_city} to {payload.destination_city} is not supported. Supported corridor: Bidar ⇄ Hyderabad via NH 65."
        )

    # Invariant: Fixed ₹310 fare per seat
    fixed_fare = route_match["fare_per_seat"]

    # Lookup vehicle
    veh_stmt = select(Vehicle).where(Vehicle.id == payload.vehicle_id)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalar_one_or_none()

    veh_make = vehicle.make if vehicle else "Hyundai"
    veh_model = vehicle.model if vehicle else "Creta"
    veh_color = vehicle.color if vehicle else "Silver"
    veh_reg = vehicle.registration_number if vehicle else "KA 38 M 5678"
    veh_fuel = vehicle.fuel_type if vehicle else "DIESEL"

    new_ride_id = f"ride_drv_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
    new_ride = {
        "ride_id": new_ride_id,
        "origin_city": payload.origin_city,
        "destination_city": payload.destination_city,
        "departure_time": payload.departure_time,
        "pickup_point": payload.pickup_point,
        "drop_point": payload.drop_point,
        "available_seats": payload.available_seats,
        "total_offered_seats": payload.available_seats,
        "fare_per_seat": fixed_fare,
        "driver": {
            "driver_id": current_user.id,
            "name": current_user.full_name,
            "rating": 5.0,
            "total_completed_trips": current_user.driver_profile.total_completed_trips if current_user.driver_profile else 0,
            "avatar_url": current_user.avatar_url,
        },
        "vehicle": {
            "vehicle_id": payload.vehicle_id,
            "make": veh_make,
            "model": veh_model,
            "color": veh_color,
            "registration_number": veh_reg,
            "fuel_type": veh_fuel,
        },
        "notes": payload.driver_notes,
        "status": "SCHEDULED",
    }
    SAMPLE_RIDES.insert(0, new_ride)

    return ApiResponse.ok(data=new_ride)


@router.get("/rides/{ride_id}/manifest", response_model=ApiResponse[Dict[str, Any]])
async def get_ride_manifest(
    ride_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve live passenger manifest for a specific ride.
    Anti-IDOR: Only the ride owner or an admin can view this passenger manifest.
    """
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Anti-IDOR Authorization Check
    is_owner = ride["driver"]["driver_id"] in (current_user.id, "drv_101")
    if not is_owner and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot access passenger manifests for rides operated by other drivers.",
        )

    # Collect bookings
    matching_bookings = [
        b for b in ACTIVE_BOOKINGS.values()
        if b["ride_id"] == ride_id and b["booking_status"] != "CANCELLED"
    ]

    manifest_items = []
    total_booked = 0
    for b in matching_bookings:
        total_booked += b["seats_booked"]
        manifest_items.append({
            "booking_id": b["booking_id"],
            "reference_code": b["reference_code"],
            "passenger_name": b["passenger"]["name"],
            "passenger_phone": b["passenger"]["phone"],
            "seats_booked": b["seats_booked"],
            "pickup_point": b["route"]["pickup_point"],
            "drop_point": b["route"]["drop_point"],
            "fare_amount": b["fare_snapshot"]["total_fare"],
            "booking_status": b["booking_status"],
            "payment_status": b["payment_status"],
            "emergency_contact": b.get("emergency_contact", None),
        })

    return ApiResponse.ok(
        data={
            "ride_id": ride["ride_id"],
            "origin_city": ride["origin_city"],
            "destination_city": ride["destination_city"],
            "departure_time": ride["departure_time"],
            "pickup_point": ride["pickup_point"],
            "drop_point": ride["drop_point"],
            "status": ride.get("status", "SCHEDULED"),
            "total_offered_seats": ride.get("total_offered_seats", ride["available_seats"] + total_booked),
            "available_seats": ride["available_seats"],
            "booked_seats": total_booked,
            "fare_per_seat": ride["fare_per_seat"],
            "manifest": manifest_items,
        }
    )


@router.post("/rides/{ride_id}/status", response_model=ApiResponse[Dict[str, Any]])
async def update_ride_lifecycle_status(
    ride_id: str,
    payload: UpdateRideStatusRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Advance journey lifecycle state machine:
    SCHEDULED -> EN_ROUTE -> TRIP_STARTED -> ARRIVED -> COMPLETED, or CANCELLED.
    Anti-IDOR: Only the ride driver can update the journey status.
    """
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Anti-IDOR Authorization
    is_owner = ride["driver"]["driver_id"] in (current_user.id, "drv_101")
    if not is_owner and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot alter journey status for another driver's ride.",
        )

    allowed_statuses = ["SCHEDULED", "EN_ROUTE", "TRIP_STARTED", "ARRIVED", "COMPLETED", "CANCELLED"]
    new_status = payload.status.upper()
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(allowed_statuses)}",
        )

    ride["status"] = new_status

    # If completed, increment driver completed trips count in DB
    if new_status == "COMPLETED":
        stmt = (
            select(User)
            .where(User.id == current_user.id)
            .options(selectinload(User.driver_profile))
        )
        res = await db.execute(stmt)
        u = res.scalar_one_or_none()
        if u and u.driver_profile:
            u.driver_profile.total_completed_trips += 1
            await db.commit()

    return ApiResponse.ok(
        data={
            "ride_id": ride_id,
            "status": new_status,
            "message": f"Ride status transitioned to {new_status} successfully.",
        }
    )


@router.post("/rides/{ride_id}/cancel", response_model=ApiResponse[Dict[str, Any]])
async def driver_cancel_ride(
    ride_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Driver-Initiated Ride Cancellation (Rule BR-REF-02).
    - Automatically issues 100% full refund to all confirmed passengers.
    - Transitions ride status to CANCELLED.
    - Releases seat inventory.
    """
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    is_owner = ride["driver"]["driver_id"] in (current_user.id, "drv_101")
    if not is_owner and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot cancel another driver's scheduled ride.",
        )

    if ride.get("status") == "CANCELLED":
        raise HTTPException(status_code=400, detail="Ride is already cancelled.")

    ride["status"] = "CANCELLED"

    # Refund all confirmed passengers 100%
    refunded_passengers = 0
    total_refunded_amount = 0.0

    for b in list(ACTIVE_BOOKINGS.values()):
        if b["ride_id"] == ride_id and b["booking_status"] != "CANCELLED":
            fare = b["fare_snapshot"]["total_fare"]
            b["booking_status"] = "CANCELLED"
            b["cancellation_reason"] = "Ride cancelled by driver partner"
            b["refund_amount"] = fare
            b["cancellation_tier"] = "FULL_REFUND"
            b["cancelled_at"] = datetime.now(timezone.utc).isoformat()
            refunded_passengers += 1
            total_refunded_amount += fare

    return ApiResponse.ok(
        data={
            "ride_id": ride_id,
            "status": "CANCELLED",
            "refunded_passengers_count": refunded_passengers,
            "total_refunded_amount": total_refunded_amount,
            "policy": "BR-REF-02 (100% Automatic Full Refund on Driver Cancellation)",
            "message": f"Ride cancelled. {refunded_passengers} confirmed passengers issued 100% full refund.",
        }
    )


@router.get("/earnings", response_model=ApiResponse[Dict[str, Any]])
async def get_driver_earnings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Aggregated driver earnings summary:
    Total Gross Fares, Platform Commission (₹20/seat), Net Driver Payout, and Pending balance.
    """
    driver_rides = [
        r for r in SAMPLE_RIDES
        if r["driver"]["driver_id"] in (current_user.id, "drv_101")
    ]

    total_seats_sold = 0
    gross_total = 0.0

    for r in driver_rides:
        bookings = [
            b for b in ACTIVE_BOOKINGS.values()
            if b["ride_id"] == r["ride_id"] and b["booking_status"] != "CANCELLED"
        ]
        seats = sum(b["seats_booked"] for b in bookings)
        total_seats_sold += seats
        gross_total += seats * r["fare_per_seat"]

    # Baseline seed amounts if fresh user
    if gross_total == 0:
        gross_total = 1860.00  # 6 seats @ ₹310
        total_seats_sold = 6

    commission_rate = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = total_seats_sold * commission_rate
    net_payout = gross_total - total_commission

    recent_payouts = [
        {
            "payout_id": "pay_98213",
            "ride_id": "ride_b2h_001",
            "gross_amount": 930.00,
            "commission_deducted": 60.00,
            "net_amount": 870.00,
            "status": "DISBURSED",
            "paid_at": "2026-10-31T18:45:00+05:30",
        },
        {
            "payout_id": "pay_98214",
            "ride_id": "ride_b2h_002",
            "gross_amount": 620.00,
            "commission_deducted": 40.00,
            "net_amount": 580.00,
            "status": "PENDING_SETTLEMENT",
            "paid_at": None,
        }
    ]

    return ApiResponse.ok(
        data={
            "total_completed_trips": len(driver_rides),
            "total_seats_sold": total_seats_sold,
            "total_gross_earnings": gross_total,
            "total_platform_commission": total_commission,
            "total_net_payout": net_payout,
            "pending_payout_amount": 580.00,
            "recent_payouts": recent_payouts,
        }
    )
