from typing import List, Dict, Any
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS, ACTIVE_HOLDS
from apps.backend.app.api.v1.admin import ADMIN_AUDIT_LOGS

TEST_SAMPLE_RIDES: List[Dict[str, Any]] = [
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
            "name": "Shiva Bhalke",
            "rating": 5.0,
            "total_completed_trips": 48,
            "avatar_url": None,
        },
        "vehicle": {
            "vehicle_id": "veh_201",
            "make": "Hyundai",
            "model": "Creta",
            "color": "Silver",
            "registration_number": "KA 38 M 5678",
            "fuel_type": "DIESEL",
            "passenger_capacity": 4,
        },
        "notes": "Non-smoking car. Boot space available for 2 medium bags.",
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy", "Miyapur"],
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
            "avatar_url": None,
        },
        "vehicle": {
            "vehicle_id": "veh_202",
            "make": "Maruti Suzuki",
            "model": "Dzire",
            "color": "White",
            "registration_number": "TS 08 FA 1234",
            "fuel_type": "CNG",
            "passenger_capacity": 4,
        },
        "notes": "AC on throughout the journey. Punctual departure guaranteed.",
        "status": "SCHEDULED",
        "stops": ["Humnabad", "Zaheerabad", "Sangareddy"],
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
            "avatar_url": None,
        },
        "vehicle": {
            "vehicle_id": "veh_203",
            "make": "Tata",
            "model": "Nexon EV",
            "color": "Foliage Green",
            "registration_number": "KA 38 N 9012",
            "fuel_type": "EV",
            "passenger_capacity": 4,
        },
        "notes": "Smooth EV ride. Comfortable seats and clean interior.",
        "status": "SCHEDULED",
        "stops": ["Miyapur", "Sangareddy", "Zaheerabad", "Humnabad"],
    },
]


def seed_test_fixtures():
    SAMPLE_RIDES.clear()
    import copy
    from datetime import datetime, timezone, timedelta
    cloned = copy.deepcopy(TEST_SAMPLE_RIDES)
    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
    for r in cloned:
        orig_time = r["departure_time"].split("T")[1]
        r["departure_time"] = f"{future_date}T{orig_time}"
    SAMPLE_RIDES.extend(cloned)


def clear_test_fixtures():
    SAMPLE_RIDES.clear()
    ACTIVE_BOOKINGS.clear()
    ACTIVE_HOLDS.clear()
    ADMIN_AUDIT_LOGS.clear()

