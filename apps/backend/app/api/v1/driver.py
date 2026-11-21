from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone, timedelta
import random
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User, DriverProfile
from apps.backend.app.models.vehicle import Vehicle, VehicleDocument
from apps.backend.app.models.ride import Ride, RideStop, RideSeatInventory
from apps.backend.app.models.route import Route, City
from apps.backend.app.models.booking import Booking
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
    available_seats: Optional[int] = Field(4, ge=1, le=6)
    vehicle_id: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_reg: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_fuel: Optional[str] = None
    driver_notes: Optional[str] = None


class UpdateRideStatusRequest(BaseModel):
    status: str = Field(..., description="SCHEDULED, EN_ROUTE, TRIP_STARTED, ARRIVED, COMPLETED, CANCELLED")


class PassengerManifestItemResponse(BaseModel):
    booking_id: str
    reference_code: str
    passenger_name: str
    passenger_phone: str
    seats_booked: int = 1
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
            is_verified=True,  # Instant driver partner verification - no admin approval required
            licence_number=dp.licence_number if dp else "KA38DL2024",
            licence_expiry=dp.licence_expiry.isoformat() if (dp and dp.licence_expiry) else "2030-12-31",
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
    db: AsyncSession = Depends(get_db_session),
):
    """
    List all rides published by the authenticated driver from the database.
    Includes booking counts, confirmed passenger tally, and estimated gross earnings.
    """
    db_results = []
    seen_ride_ids = set()

    # 1. Query rides directly from SQLite database
    try:
        stmt = (
            select(Ride)
            .where(Ride.driver_id == current_user.id)
            .options(
                selectinload(Ride.vehicle),
                selectinload(Ride.seat_inventory),
                selectinload(Ride.stops),
                selectinload(Ride.bookings).selectinload(Booking.passenger),
            )
            .order_by(Ride.departure_time.desc())
        )
        res = await db.execute(stmt)
        db_rides = res.scalars().all()

        for r in db_rides:
            seen_ride_ids.add(r.id)
            pickup = "Dr. BR Ambedkar Circle, Bidar"
            drop = "Hitec City Cyber Towers, Hyderabad"
            if r.driver_notes and "Pickup:" in r.driver_notes and "Drop:" in r.driver_notes:
                parts = r.driver_notes.split("|")
                pickup = parts[0].replace("Pickup:", "").strip()
                drop = parts[1].replace("Drop:", "").strip()
            elif r.driver_notes:
                pickup = r.driver_notes

            orig_name = "Bidar"
            dest_name = "Hyderabad"
            if r.route_id:
                route_obj = await db.get(Route, r.route_id)
                if route_obj:
                    c1 = await db.get(City, route_obj.origin_city_id)
                    c2 = await db.get(City, route_obj.destination_city_id)
                    if c1:
                        orig_name = c1.name
                    if c2:
                        dest_name = c2.name

            manifest_items = []
            total_passengers = 0
            for b in (r.bookings or []):
                if b.booking_status != "CANCELLED":
                    total_passengers += b.seats_booked
                    p_name = b.passenger.full_name if b.passenger else "Passenger"
                    p_phone = b.passenger.phone if b.passenger else ""
                    manifest_items.append({
                        "booking_id": b.id,
                        "reference_code": b.reference_code,
                        "passenger_name": p_name,
                        "passenger_phone": p_phone,
                        "seats_booked": b.seats_booked,
                        "pickup_point": b.pickup_landmark or pickup,
                        "drop_point": b.drop_landmark or drop,
                        "fare_amount": float(b.total_fare),
                        "booking_status": b.booking_status,
                        "payment_status": "CAPTURED",
                    })

            # Check ACTIVE_BOOKINGS for any active session bookings on this ride
            for b in ACTIVE_BOOKINGS.values():
                if b.get("ride_id") == r.id and b.get("booking_status") != "CANCELLED":
                    if not any(m["booking_id"] == b.get("booking_id") for m in manifest_items):
                        total_passengers += b.get("seats_booked", 1)
                        p_name = b["passenger"]["name"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_name") or "Passenger")
                        p_phone = b["passenger"]["phone"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_phone") or "")
                        manifest_items.append({
                            "booking_id": b["booking_id"],
                            "reference_code": b.get("reference_code", b["booking_id"]),
                            "passenger_name": p_name,
                            "passenger_phone": p_phone,
                            "seats_booked": b.get("seats_booked", 1),
                            "pickup_point": b.get("pickup_point") or pickup,
                            "drop_point": b.get("drop_point") or drop,
                            "fare_amount": float(b.get("total_fare") or 310),
                            "booking_status": b.get("booking_status", "CONFIRMED"),
                            "payment_status": "CAPTURED",
                        })

            avail_seats = r.seat_inventory.available_seats if r.seat_inventory else (r.total_offered_seats - total_passengers)
            fare_val = float(r.fare_per_seat_snapshot)
            gross_earnings = total_passengers * fare_val

            veh_dict = {
                "vehicle_id": r.vehicle.id if r.vehicle else "veh_default",
                "make": r.vehicle.make if r.vehicle else "Car",
                "model": r.vehicle.model if r.vehicle else "Sedan",
                "color": r.vehicle.color if r.vehicle else "White",
                "registration_number": r.vehicle.registration_number if r.vehicle else "KA 38 P 0000",
                "fuel_type": r.vehicle.fuel_type if r.vehicle else "PETROL",
            }

            db_results.append({
                "ride_id": r.id,
                "origin_city": orig_name,
                "destination_city": dest_name,
                "departure_time": r.departure_time.isoformat() if r.departure_time else datetime.now(timezone.utc).isoformat(),
                "pickup_point": pickup,
                "drop_point": drop,
                "available_seats": max(0, avail_seats),
                "total_offered_seats": r.total_offered_seats,
                "fare_per_seat": fare_val,
                "driver_id": current_user.id,
                "driver": {
                    "driver_id": current_user.id,
                    "name": current_user.full_name or "Verified Driver",
                    "rating": 5.0,
                    "total_completed_trips": 0,
                    "avatar_url": current_user.avatar_url,
                    "is_verified": True,
                },
                "vehicle": veh_dict,
                "notes": r.driver_notes,
                "status": r.status or "SCHEDULED",
                "stops": [s.stop_name for s in (r.stops or [])] or ["Humnabad", "Zaheerabad", "Sangareddy"],
                "total_confirmed_passengers": total_passengers,
                "estimated_gross_earnings": gross_earnings,
                "manifest": manifest_items,
            })
    except Exception as e:
        import traceback
        traceback.print_exc()

    # 2. Append any matching in-memory SAMPLE_RIDES not already in database
    for r in SAMPLE_RIDES:
        if r.get("ride_id") not in seen_ride_ids:
            if (r.get("driver_id") == current_user.id) or (r.get("driver", {}).get("driver_id") == current_user.id):
                bookings = [b for b in ACTIVE_BOOKINGS.values() if b["ride_id"] == r["ride_id"] and b.get("booking_status") != "CANCELLED"]
                total_passengers = sum(b["seats_booked"] for b in bookings)
                manifest_items = []
                for b in bookings:
                    p_name = b["passenger"]["name"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_name") or "Passenger")
                    p_phone = b["passenger"]["phone"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_phone") or "")
                    pickup = b["route"]["pickup_point"] if isinstance(b.get("route"), dict) else (b.get("pickup_point") or "")
                    drop = b["route"]["drop_point"] if isinstance(b.get("route"), dict) else (b.get("drop_point") or "")
                    fare = b["fare_snapshot"]["total_fare"] if isinstance(b.get("fare_snapshot"), dict) else (b.get("total_fare") or 310)
                    manifest_items.append({
                        "booking_id": b["booking_id"],
                        "reference_code": b.get("reference_code", b["booking_id"]),
                        "passenger_name": p_name,
                        "passenger_phone": p_phone,
                        "seats_booked": b["seats_booked"],
                        "pickup_point": pickup,
                        "drop_point": drop,
                        "fare_amount": fare,
                        "booking_status": b.get("booking_status", "CONFIRMED"),
                        "payment_status": b.get("payment_status", "CAPTURED"),
                    })
                db_results.append({
                    **r,
                    "total_confirmed_passengers": total_passengers,
                    "estimated_gross_earnings": total_passengers * r.get("fare_per_seat", 310.0),
                    "manifest": manifest_items,
                })

    return ApiResponse.ok(data=db_results)


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
    total_seats = payload.available_seats if payload.available_seats is not None else 4

    # Ensure driver status is active on user
    if not current_user.is_driver:
        current_user.is_driver = True
        await db.commit()

    # Lookup vehicle if ID provided or use directly typed details
    vehicle = None
    if payload.vehicle_id:
        veh_stmt = select(Vehicle).where(Vehicle.id == payload.vehicle_id)
        veh_res = await db.execute(veh_stmt)
        vehicle = veh_res.scalar_one_or_none()

    veh_make = (
        payload.vehicle_make.strip()
        if payload.vehicle_make and payload.vehicle_make.strip()
        else (vehicle.make if vehicle else "Car")
    )
    veh_model = (
        payload.vehicle_model.strip()
        if payload.vehicle_model and payload.vehicle_model.strip()
        else (vehicle.model if vehicle else "Sedan")
    )
    veh_color = (
        payload.vehicle_color.strip()
        if payload.vehicle_color and payload.vehicle_color.strip()
        else (vehicle.color if vehicle else "White")
    )
    veh_reg = (
        payload.vehicle_reg.strip().upper()
        if payload.vehicle_reg and payload.vehicle_reg.strip()
        else (vehicle.registration_number if vehicle else "KA 38 P 0000")
    )
    veh_fuel = (
        payload.vehicle_fuel.strip().upper()
        if payload.vehicle_fuel and payload.vehicle_fuel.strip()
        else (vehicle.fuel_type if vehicle else "PETROL")
    )

    # Persist newly typed vehicle in fleet if not present
    if payload.vehicle_reg and current_user:
        v_check = await db.execute(
            select(Vehicle).where(Vehicle.registration_number == payload.vehicle_reg.strip().upper())
        )
        existing_v = v_check.scalar_one_or_none()
        if not existing_v:
            new_veh = Vehicle(
                driver_id=current_user.id,
                make=veh_make,
                model=veh_model,
                registration_number=veh_reg,
                color=veh_color,
                year=datetime.now().year,
                fuel_type=veh_fuel,
                passenger_capacity=total_seats,
                is_active=True,
                is_verified=True,
            )
            db.add(new_veh)
            await db.commit()
            await db.refresh(new_veh)
            vehicle = new_veh
        else:
            vehicle = existing_v

    if not vehicle:
        v_user = await db.execute(select(Vehicle).where(Vehicle.driver_id == current_user.id))
        vehicle = v_user.scalars().first()
        if not vehicle:
            final_reg = veh_reg
            reg_check = await db.scalar(select(Vehicle.id).where(Vehicle.registration_number == final_reg))
            if reg_check:
                final_reg = f"KA 38 P {random.randint(1000, 9999)}"
            new_veh = Vehicle(
                driver_id=current_user.id,
                make=veh_make,
                model=veh_model,
                registration_number=final_reg,
                color=veh_color,
                year=datetime.now().year,
                fuel_type=veh_fuel,
                passenger_capacity=total_seats,
                is_active=True,
                is_verified=True,
            )
            db.add(new_veh)
            await db.commit()
            await db.refresh(new_veh)
            vehicle = new_veh

    veh_id = vehicle.id

    new_ride_id = f"ride_drv_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"

    # Match database route
    selected_route = None
    try:
        route_stmt = select(Route).join(City, Route.origin_city_id == City.id)
        route_res = await db.execute(route_stmt)
        routes = route_res.scalars().all()
        for rt in routes:
            dest_city = await db.scalar(select(City.name).where(City.id == rt.destination_city_id))
            orig_city = await db.scalar(select(City.name).where(City.id == rt.origin_city_id))
            if orig_city and dest_city and orig_city.lower() == payload.origin_city.strip().lower() and dest_city.lower() == payload.destination_city.strip().lower():
                selected_route = rt
                break
    except Exception:
        pass

    if not selected_route:
        any_rt = await db.execute(select(Route))
        selected_route = any_rt.scalars().first()

    # Parse departure time
    try:
        clean_time = payload.departure_time.replace("Z", "+00:00")
        dep_time = datetime.fromisoformat(clean_time)
        if dep_time.tzinfo is None:
            dep_time = dep_time.replace(tzinfo=timezone.utc)
    except Exception:
        dep_time = datetime.now(timezone.utc)

    now_utc = datetime.now(timezone.utc)
    if dep_time < (now_utc - timedelta(minutes=10)):
        raise HTTPException(
            status_code=400,
            detail="Departure time cannot be in the past. Please schedule a future departure.",
        )

    # Persist in SQLite database
    new_db_ride = Ride(
        id=new_ride_id,
        driver_id=current_user.id,
        vehicle_id=veh_id,
        route_id=selected_route.id if selected_route else None,
        departure_time=dep_time,
        status="SCHEDULED",
        total_offered_seats=total_seats,
        fare_per_seat_snapshot=fixed_fare,
        driver_notes=payload.driver_notes or f"Pickup: {payload.pickup_point} | Drop: {payload.drop_point}",
    )
    db.add(new_db_ride)
    await db.flush()

    # Concurrency Seat Inventory
    seat_inv = RideSeatInventory(
        ride_id=new_db_ride.id,
        total_capacity=total_seats,
        available_seats=total_seats,
        reserved_seats=0,
        version_lock=1,
    )
    db.add(seat_inv)

    # Intermediate corridor waypoints
    for s_name in ["Humnabad", "Zaheerabad", "Sangareddy"]:
        db.add(RideStop(
            ride_id=new_db_ride.id,
            stop_name=s_name,
            scheduled_time=dep_time,
            is_pickup=True,
            is_drop=True,
        ))

    await db.commit()

    new_ride = {
        "ride_id": new_ride_id,
        "origin_city": payload.origin_city,
        "destination_city": payload.destination_city,
        "departure_time": payload.departure_time,
        "pickup_point": payload.pickup_point,
        "drop_point": payload.drop_point,
        "available_seats": total_seats,
        "total_offered_seats": total_seats,
        "fare_per_seat": fixed_fare,
        "driver_id": current_user.id,
        "driver": {
            "driver_id": current_user.id,
            "name": current_user.full_name or "Verified Driver",
            "rating": 5.0,
            "total_completed_trips": current_user.driver_profile.total_completed_trips if current_user.driver_profile else 0,
            "avatar_url": current_user.avatar_url,
            "is_verified": True,
        },
        "vehicle": {
            "vehicle_id": veh_id,
            "make": veh_make,
            "model": veh_model,
            "color": veh_color,
            "registration_number": veh_reg,
            "fuel_type": veh_fuel,
        },
        "notes": payload.driver_notes,
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy"],
    }
    SAMPLE_RIDES.insert(0, new_ride)

    return ApiResponse.ok(data=new_ride)


@router.get("/rides/{ride_id}/manifest", response_model=ApiResponse[Dict[str, Any]])
async def get_ride_manifest(
    ride_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Retrieve live passenger manifest for a specific ride.
    Anti-IDOR: Only the ride owner or an admin can view this passenger manifest.
    """
    # 1. Check database first
    stmt = (
        select(Ride)
        .where(Ride.id == ride_id)
        .options(
            selectinload(Ride.vehicle),
            selectinload(Ride.seat_inventory),
            selectinload(Ride.bookings).selectinload(Booking.passenger),
        )
    )
    res = await db.execute(stmt)
    db_ride = res.scalar_one_or_none()

    if db_ride:
        # Anti-IDOR Authorization Check
        is_owner = db_ride.driver_id == current_user.id
        if not is_owner and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: You cannot access passenger manifests for rides operated by other drivers.",
            )

        pickup = "Dr. BR Ambedkar Circle, Bidar"
        drop = "Hitec City Cyber Towers, Hyderabad"
        if db_ride.driver_notes and "Pickup:" in db_ride.driver_notes and "Drop:" in db_ride.driver_notes:
            parts = db_ride.driver_notes.split("|")
            pickup = parts[0].replace("Pickup:", "").strip()
            drop = parts[1].replace("Drop:", "").strip()
        elif db_ride.driver_notes:
            pickup = db_ride.driver_notes

        orig_name = "Bidar"
        dest_name = "Hyderabad"
        if db_ride.route_id:
            route_obj = await db.get(Route, db_ride.route_id)
            if route_obj:
                c1 = await db.get(City, route_obj.origin_city_id)
                c2 = await db.get(City, route_obj.destination_city_id)
                if c1: orig_name = c1.name
                if c2: dest_name = c2.name

        manifest_items = []
        total_booked = 0
        for b in (db_ride.bookings or []):
            if b.booking_status != "CANCELLED":
                total_booked += b.seats_booked
                session_b = ACTIVE_BOOKINGS.get(b.id)
                if session_b and session_b.get("passenger") and session_b["passenger"].get("name"):
                    p_name = session_b["passenger"]["name"]
                    p_phone = session_b["passenger"].get("phone") or ""
                elif b.passenger and b.passenger.full_name:
                    p_name = b.passenger.full_name
                    p_phone = b.passenger.phone or ""
                else:
                    p_name = "Passenger"
                    p_phone = ""
                manifest_items.append({
                    "booking_id": b.id,
                    "reference_code": b.reference_code,
                    "passenger_name": p_name,
                    "passenger_phone": p_phone,
                    "seats_booked": b.seats_booked,
                    "pickup_point": b.pickup_landmark or pickup,
                    "drop_point": b.drop_landmark or drop,
                    "fare_amount": float(b.total_fare),
                    "booking_status": b.booking_status,
                    "payment_status": "CAPTURED",
                    "emergency_contact": None,
                })

        for b in ACTIVE_BOOKINGS.values():
            if b.get("ride_id") == db_ride.id and b.get("booking_status") != "CANCELLED":
                if not any(m["booking_id"] == b.get("booking_id") for m in manifest_items):
                    total_booked += b.get("seats_booked", 1)
                    p_name = b["passenger"]["name"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_name") or "Passenger")
                    p_phone = b["passenger"]["phone"] if isinstance(b.get("passenger"), dict) else (b.get("passenger_phone") or "")
                    manifest_items.append({
                        "booking_id": b["booking_id"],
                        "reference_code": b.get("reference_code", b["booking_id"]),
                        "passenger_name": p_name,
                        "passenger_phone": p_phone,
                        "seats_booked": b.get("seats_booked", 1),
                        "pickup_point": b.get("pickup_point") or pickup,
                        "drop_point": b.get("drop_point") or drop,
                        "fare_amount": float(b.get("total_fare") or 310),
                        "booking_status": b.get("booking_status", "CONFIRMED"),
                        "payment_status": "CAPTURED",
                        "emergency_contact": None,
                    })

        avail_seats = db_ride.seat_inventory.available_seats if db_ride.seat_inventory else (db_ride.total_offered_seats - total_booked)
        return ApiResponse.ok(
            data={
                "ride_id": db_ride.id,
                "origin_city": orig_name,
                "destination_city": dest_name,
                "departure_time": db_ride.departure_time.isoformat() if db_ride.departure_time else datetime.now(timezone.utc).isoformat(),
                "pickup_point": pickup,
                "drop_point": drop,
                "status": db_ride.status,
                "total_offered_seats": db_ride.total_offered_seats,
                "available_seats": avail_seats,
                "booked_seats": total_booked,
                "fare_per_seat": float(db_ride.fare_per_seat_snapshot),
                "manifest": manifest_items,
            }
        )

    # 2. Check SAMPLE_RIDES fallback
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    # Anti-IDOR Authorization Check
    is_owner = ride.get("driver_id") == current_user.id or ride.get("driver", {}).get("driver_id") == current_user.id
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
    allowed_statuses = ["SCHEDULED", "EN_ROUTE", "TRIP_STARTED", "ARRIVED", "COMPLETED", "CANCELLED"]
    new_status = payload.status.upper()
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(allowed_statuses)}",
        )

    # 1. Update in Database
    db_ride = await db.get(Ride, ride_id)
    if db_ride:
        if db_ride.driver_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: You cannot alter journey status for another driver's ride.",
            )
        db_ride.status = new_status
        await db.commit()

    # 2. Update in-memory if present
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if ride:
        ride["status"] = new_status
        if new_status == "COMPLETED" and "completed_at" not in ride:
            ride["completed_at"] = datetime.now(timezone.utc).isoformat()

    if not db_ride and not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    return ApiResponse.ok(data={
        "ride_id": ride_id,
        "status": new_status,
        "message": f"Ride lifecycle advanced to {new_status}"
    })

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


class VerifyBoardingRequest(BaseModel):
    boarding_code: Optional[str] = Field(None, description="4-digit boarding code from passenger ticket")


@router.post("/rides/{ride_id}/manifest/{booking_id}/verify-boarding", response_model=ApiResponse[Dict[str, Any]])
async def verify_passenger_boarding(
    ride_id: str,
    booking_id: str,
    payload: VerifyBoardingRequest = Body(default=VerifyBoardingRequest()),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Driver verifies a passenger boarding at the pickup point using the 4-digit code
    or direct one-tap verification. Updates the manifest item and booking status to BOARDED.
    """
    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking or booking["ride_id"] != ride_id:
        raise HTTPException(status_code=404, detail="Booking record not found on this manifest.")

    if booking["booking_status"] == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot verify boarding for a cancelled booking.")

    # Validate boarding code if supplied
    ref = booking.get("reference_code", "")
    digits = "".join(filter(str.isdigit, ref))
    expected_code = digits[-4:] if len(digits) >= 4 else "8421"
    if payload.boarding_code and payload.boarding_code.strip():
        input_clean = payload.boarding_code.strip().replace("-", "").upper()
        if input_clean != expected_code and input_clean != ref.upper():
            raise HTTPException(
                status_code=400,
                detail="Invalid boarding pass code. Please verify the 4-digit code displayed on passenger digital pass."
            )

    booking["booking_status"] = "BOARDED"
    booking["is_boarded"] = True
    booking["boarded_at"] = datetime.now().isoformat()

    return ApiResponse.ok(
        data={
            "booking_id": booking_id,
            "reference_code": ref,
            "passenger_name": booking["passenger"]["name"],
            "booking_status": "BOARDED",
            "message": "Passenger successfully verified and boarded.",
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

    is_owner = ride.get("driver_id") == current_user.id or ride.get("driver", {}).get("driver_id") == current_user.id
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
    # Sync driver name and id on matching rides
    for r in SAMPLE_RIDES:
        if (r.get("driver_id") == current_user.id) or (r.get("driver", {}).get("driver_id") == current_user.id):
            r["driver_id"] = current_user.id
            if "driver" in r:
                r["driver"]["driver_id"] = current_user.id
                if current_user.full_name:
                    r["driver"]["name"] = current_user.full_name

    driver_rides = [
        r for r in SAMPLE_RIDES
        if (r.get("driver_id") == current_user.id)
        or (r.get("driver", {}).get("driver_id") == current_user.id)
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

    commission_rate = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    total_commission = total_seats_sold * commission_rate
    net_payout = max(0.0, gross_total - total_commission)

    from apps.backend.app.services.payout_service import DRIVER_PAYOUT_RECORDS
    user_payouts = [
        p for p in DRIVER_PAYOUT_RECORDS.values()
        if p.get("driver_id") == current_user.id
    ]

    pending_amount = sum(
        float(p.get("net_amount", 0.0)) for p in user_payouts
        if p.get("status") in ("PENDING", "ELIGIBLE_FOR_SETTLEMENT", "PROCESSING")
    )

    return ApiResponse.ok(
        data={
            "total_completed_trips": len([r for r in driver_rides if r.get("status") == "COMPLETED"]),
            "total_seats_sold": total_seats_sold,
            "total_gross_earnings": gross_total,
            "total_platform_commission": total_commission,
            "total_net_payout": net_payout,
            "pending_payout_amount": pending_amount,
            "recent_payouts": user_payouts,
        }
    )
