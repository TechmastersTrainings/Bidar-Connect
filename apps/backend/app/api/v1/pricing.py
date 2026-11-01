from typing import List, Dict, Any
from fastapi import APIRouter
from apps.backend.app.schemas.common import ApiResponse

router = APIRouter(prefix="/pricing", tags=["Pricing & Commission"])

# Admin-configured authoritative pricing table
ACTIVE_ROUTE_PRICES = [
    {
        "route_id": "route_bidar_hyderabad",
        "origin_city": "Bidar",
        "destination_city": "Hyderabad",
        "distance_km": 140,
        "fare_per_seat": 310.00,
        "currency": "INR",
        "pickup_points": [
            "New Bus Stand",
            "Mailoor Cross",
            "Shivaji Chowk",
            "Humnabad Ring Road"
        ],
        "drop_points": [
            "Miyapur Cross Roads",
            "Kukatpally",
            "Gachibowli DLF",
            "Secunderabad Station",
            "Lakdikapul",
            "RGIA Airport"
        ],
        "is_active": True
    },
    {
        "route_id": "route_hyderabad_bidar",
        "origin_city": "Hyderabad",
        "destination_city": "Bidar",
        "distance_km": 140,
        "fare_per_seat": 310.00,
        "currency": "INR",
        "pickup_points": [
            "Miyapur Cross Roads",
            "Gachibowli DLF",
            "Secunderabad Station"
        ],
        "drop_points": [
            "New Bus Stand",
            "Mailoor Cross",
            "Shivaji Chowk"
        ],
        "is_active": True
    },
    {
        "route_id": "route_bidar_humnabad",
        "origin_city": "Bidar",
        "destination_city": "Humnabad",
        "distance_km": 52,
        "fare_per_seat": 70.00,
        "currency": "INR",
        "pickup_points": ["New Bus Stand"],
        "drop_points": ["Humnabad Bus Stand", "National Highway Junction"],
        "is_active": True
    }
]

ACTIVE_COMMISSION_RULE = {
    "rule_id": "comm_v1_fixed",
    "rule_type": "FIXED_PER_SEAT",
    "fixed_fee_per_seat": 10.00,
    "effective_from": "2026-11-01T00:00:00Z",
    "description": "Standard ₹10 platform commission per booked seat"
}


@router.get("/routes", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_route_pricing():
    """Returns admin-controlled route pricing matrix."""
    return ApiResponse.ok(data=ACTIVE_ROUTE_PRICES)


@router.get("/commission-rules/active", response_model=ApiResponse[Dict[str, Any]])
async def get_active_commission_rule():
    """Returns current active platform commission rule."""
    return ApiResponse.ok(data=ACTIVE_COMMISSION_RULE)
