from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.api.v1.pricing import ACTIVE_ROUTE_PRICES

router = APIRouter(prefix="/rides", tags=["Rides"])

# In-memory initial verified baseline rides (Bidar ⇄ Hyderabad corridor)
SAMPLE_RIDES = [
    {
        "ride_id": "ride_b2h_001",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "departure_time": "2026-11-05T07:30:00+05:30",
        "pickup_point": "New Bus Stand, Bidar",
        "drop_point": "Gachibowli DLF, Hyderabad",
        "available_seats": 3,
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
            "fuel_type": "DIESEL"
        },
        "notes": "Non-smoking car. Boot space available for 2 medium bags."
    },
    {
        "ride_id": "ride_b2h_002",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "departure_time": "2026-11-05T09:00:00+05:30",
        "pickup_point": "Mailoor Cross, Bidar",
        "drop_point": "Miyapur Cross Roads, Hyderabad",
        "available_seats": 2,
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
            "fuel_type": "CNG"
        },
        "notes": "AC on throughout the journey. Punctual departure guaranteed."
    },
    {
        "ride_id": "ride_h2b_001",
        "origin_city": "Hyderabad",
        "destination_city": "Bidar",
        "departure_time": "2026-11-05T17:30:00+05:30",
        "pickup_point": "Gachibowli DLF, Hyderabad",
        "drop_point": "New Bus Stand, Bidar",
        "available_seats": 4,
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
            "model": "Nexon",
            "color": "Foliage Green",
            "registration_number": "KA 38 N 9012",
            "fuel_type": "EV"
        },
        "notes": "Smooth EV ride. Comfortable seats and clean interior."
    }
]


class RideSearchFilter(BaseModel):
    origin_city: str
    destination_city: str
    travel_date: Optional[str] = None
    seats: int = 1


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
):
    """Search available rides matching route and seat requirements."""
    matched = [
        ride for ride in SAMPLE_RIDES
        if ride["origin_city"].lower() == origin_city.lower()
        and ride["destination_city"].lower() == destination_city.lower()
        and ride["available_seats"] >= seats
    ]
    return ApiResponse.ok(data=matched)


@router.post("", response_model=ApiResponse[Dict[str, Any]], status_code=201)
async def publish_ride(payload: PublishRideRequest):
    """Publish a new ride. Fare is strictly determined by Admin pricing rules."""
    # Find authoritative admin pricing for this route
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

    # Invariant: Driver cannot set fare; it is snapshotted from admin pricing
    fare_per_seat = route_match["fare_per_seat"]

    new_ride = {
        "ride_id": f"ride_gen_{int(datetime.now(timezone.utc).timestamp())}",
        "origin_city": payload.origin_city,
        "destination_city": payload.destination_city,
        "departure_time": payload.departure_time,
        "pickup_point": payload.pickup_point,
        "drop_point": payload.drop_point,
        "available_seats": payload.available_seats,
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
            "fuel_type": "PETROL"
        },
        "notes": payload.driver_notes,
        "status": "PUBLISHED"
    }
    SAMPLE_RIDES.append(new_ride)
    return ApiResponse.ok(data=new_ride)

