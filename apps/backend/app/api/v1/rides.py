from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.pricing import ACTIVE_ROUTE_PRICES

router = APIRouter(prefix="/rides", tags=["Rides"])

# Baseline verified rides (Bidar ⇄ Hyderabad corridor)
SAMPLE_RIDES: List[Dict[str, Any]] = [
    {
        "ride_id": "ride_b2h_001",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "departure_time": "2026-11-05T07:30:00+05:30",
        "pickup_point": "New Bus Stand, Bidar",
        "drop_point": "Gachibowli DLF, Hyderabad",
        "available_seats": 3,
        "total_offered_seats": 4,
        "fare_per_seat": 310.00,
        "driver": {
            "driver_id": "drv_101",
            "name": "Ramesh Patil",
            "rating": 4.9,
            "total_completed_trips": 48,
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        },
        "vehicle": {
            "vehicle_id": "veh_201",
            "make": "Hyundai",
            "model": "Creta",
            "color": "Silver",
            "registration_number": "KA 38 M 5678",
            "fuel_type": "DIESEL",
            "passenger_capacity": 4
        },
        "notes": "Non-smoking car. Boot space available for 2 medium bags.",
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy", "Miyapur"]
    },
    {
        "ride_id": "ride_b2h_002",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "departure_time": "2026-11-05T09:00:00+05:30",
        "pickup_point": "Mailoor Cross, Bidar",
        "drop_point": "Miyapur Cross Roads, Hyderabad",
        "available_seats": 2,
        "total_offered_seats": 4,
        "fare_per_seat": 310.00,
        "driver": {
            "driver_id": "drv_102",
            "name": "Suresh Kulkarni",
            "rating": 4.8,
            "total_completed_trips": 31,
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        },
        "vehicle": {
            "vehicle_id": "veh_202",
            "make": "Maruti Suzuki",
            "model": "Dzire",
            "color": "White",
            "registration_number": "TS 08 FA 1234",
            "fuel_type": "CNG",
            "passenger_capacity": 4
        },
        "notes": "AC on throughout the journey. Punctual departure guaranteed.",
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy"]
    },
    {
        "ride_id": "ride_b2h_003",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "departure_time": "2026-11-05T13:30:00+05:30",
        "pickup_point": "Shivaji Chowk, Bidar",
        "drop_point": "Kukatpally Y Junction, Hyderabad",
        "available_seats": 4,
        "total_offered_seats": 4,
        "fare_per_seat": 310.00,
        "driver": {
            "driver_id": "drv_104",
            "name": "Anil Biradar",
            "rating": 4.95,
            "total_completed_trips": 52,
            "avatar_url": None
        },
        "vehicle": {
            "vehicle_id": "veh_204",
            "make": "Honda",
            "model": "City",
            "color": "Golden Brown",
            "registration_number": "KA 38 P 4411",
            "fuel_type": "PETROL",
            "passenger_capacity": 4
        },
        "notes": "Spacious boot space. Smooth highway cruising on NH 65.",
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy", "Kukatpally"]
    },
    {
        "ride_id": "ride_h2b_001",
        "origin_city": "Hyderabad",
        "destination_city": "Bidar",
        "departure_time": "2026-11-05T17:30:00+05:30",
        "pickup_point": "Gachibowli DLF, Hyderabad",
        "drop_point": "New Bus Stand, Bidar",
        "available_seats": 4,
        "total_offered_seats": 4,
        "fare_per_seat": 310.00,
        "driver": {
            "driver_id": "drv_103",
            "name": "Mohammad Rizwan",
            "rating": 5.0,
            "total_completed_trips": 64,
            "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150"
        },
        "vehicle": {
            "vehicle_id": "veh_203",
            "make": "Tata",
            "model": "Nexon EV",
            "color": "Foliage Green",
            "registration_number": "KA 38 N 9012",
            "fuel_type": "EV",
            "passenger_capacity": 4
        },
        "notes": "Smooth EV ride. Comfortable seats and clean interior.",
        "status": "SCHEDULED",
        "stops": ["Miyapur", "Sangareddy", "Zaheerabad", "Humnabad"]
    }
]


class PublishRideRequest(BaseModel):
    origin_city: str
    destination_city: str
    departure_time: str
    pickup_point: str
    drop_point: str
    available_seats: int = Field(ge=1, le=6)
    driver_id: str
    vehicle_id: str
    driver_notes: Optional[str] = None


@router.get("/search", response_model=ApiResponse[List[Dict[str, Any]]])
async def search_rides(
    origin_city: str = Query(..., description="Origin city (e.g. Bidar or Hyderabad)"),
    destination_city: str = Query(..., description="Destination city (e.g. Hyderabad or Bidar)"),
    seats: int = Query(1, ge=1, le=6, description="Required passenger seats"),
    travel_date: Optional[str] = Query(None, description="Filter by travel date (YYYY-MM-DD)"),
    time_window: Optional[str] = Query(None, description="MORNING (05:00-11:59), AFTERNOON (12:00-16:59), EVENING (17:00-23:59)"),
    fuel_type: Optional[str] = Query(None, description="PETROL, DIESEL, CNG, EV"),
    pickup_point: Optional[str] = Query(None, description="Pickup waypoint match"),
    drop_point: Optional[str] = Query(None, description="Drop waypoint match"),
    sort_by: Optional[str] = Query("departure_asc", description="departure_asc, rating_desc, price_asc"),
):
    """
    Advanced Multi-Criteria Ride Search Engine.
    Filters by corridor route, seat capacity, travel date, departure time windows,
    fuel types, intermediate waypoints, and customizable sorting.
    """
    matched = []

    for ride in SAMPLE_RIDES:
        # Route match
        if ride["origin_city"].lower() != origin_city.lower():
            continue
        if ride["destination_city"].lower() != destination_city.lower():
            continue

        # Capacity match
        if ride["available_seats"] < seats:
            continue

        # Exclude completed or cancelled rides
        if ride.get("status") in ("COMPLETED", "CANCELLED"):
            continue

        # Date match
        if travel_date:
            try:
                ride_date = ride["departure_time"].split("T")[0]
                if ride_date != travel_date:
                    continue
            except Exception:
                pass

        # Time Window match
        if time_window and time_window.upper() != "ALL":
            try:
                # Parse hour from departure_time
                time_part = ride["departure_time"].split("T")[1][:5]
                hour = int(time_part.split(":")[0])
                win = time_window.upper()
                if win == "MORNING" and not (5 <= hour < 12):
                    continue
                elif win == "AFTERNOON" and not (12 <= hour < 17):
                    continue
                elif win == "EVENING" and not (17 <= hour <= 23 or hour < 5):
                    continue
            except Exception:
                pass

        # Fuel Type match
        if fuel_type and fuel_type.upper() != "ALL":
            ride_fuel = ride["vehicle"].get("fuel_type", "").upper()
            if ride_fuel != fuel_type.upper():
                continue

        # Intermediate waypoint matching (checks pickup/drop and stops list)
        if pickup_point:
            pp = pickup_point.lower()
            in_pickup = pp in ride["pickup_point"].lower()
            in_stops = any(pp in s.lower() for s in ride.get("stops", []))
            if not in_pickup and not in_stops:
                continue

        if drop_point:
            dp = drop_point.lower()
            in_drop = dp in ride["drop_point"].lower()
            in_stops = any(dp in s.lower() for s in ride.get("stops", []))
            if not in_drop and not in_stops:
                continue

        matched.append(ride)

    # Sorting
    if sort_by == "rating_desc":
        matched.sort(key=lambda r: r["driver"].get("rating", 0.0), reverse=True)
    elif sort_by == "price_asc":
        matched.sort(key=lambda r: r.get("fare_per_seat", 310.0))
    else:  # departure_asc (default)
        matched.sort(key=lambda r: r.get("departure_time", ""))

    return ApiResponse.ok(data=matched)


@router.get("/{ride_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_ride_detail(ride_id: str):
    """Retrieve complete ride detail including route stops and vehicle specs."""
    ride = next((r for r in SAMPLE_RIDES if r["ride_id"] == ride_id), None)
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    return ApiResponse.ok(data=ride)


@router.post("", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def publish_ride(payload: PublishRideRequest):
    """Publish a new ride. Fare is strictly determined by Admin pricing rules."""
    route_match = next(
        (r for r in ACTIVE_ROUTE_PRICES
         if r["origin_city"].lower() == payload.origin_city.lower()
         and r["destination_city"].lower() == payload.destination_city.lower()),
        None
    )
    if not route_match:
        raise HTTPException(
            status_code=400,
            detail=f"Route from {payload.origin_city} to {payload.destination_city} is not supported."
        )

    fare_per_seat = route_match["fare_per_seat"]

    new_ride = {
        "ride_id": f"ride_gen_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}",
        "origin_city": payload.origin_city,
        "destination_city": payload.destination_city,
        "departure_time": payload.departure_time,
        "pickup_point": payload.pickup_point,
        "drop_point": payload.drop_point,
        "available_seats": payload.available_seats,
        "total_offered_seats": payload.available_seats,
        "fare_per_seat": fare_per_seat,
        "driver": {
            "driver_id": payload.driver_id,
            "name": "Verified Driver",
            "rating": 5.0,
            "total_completed_trips": 1,
            "avatar_url": None
        },
        "vehicle": {
            "vehicle_id": payload.vehicle_id,
            "make": "Verified",
            "model": "Vehicle",
            "color": "Standard",
            "registration_number": "KA 38 XX 0000",
            "fuel_type": "PETROL",
            "passenger_capacity": 4
        },
        "notes": payload.driver_notes,
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy"]
    }
    SAMPLE_RIDES.append(new_ride)
    return ApiResponse.ok(data=new_ride)
