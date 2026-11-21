import hmac
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status

from apps.backend.app.core.config import settings
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_user, get_current_active_user
from apps.backend.app.models.user import User

router = APIRouter(prefix="/mobile", tags=["Mobile Applications Engine"])

# In-memory stores for mobile devices and live telemetry
REGISTERED_DEVICES: Dict[str, Dict[str, Any]] = {}
RIDE_TELEMETRY: Dict[str, Dict[str, Any]] = {}


class DeviceRegisterRequest(BaseModel):
    device_id: str = Field(..., min_length=3, max_length=128)
    fcm_token: str = Field(..., min_length=10, max_length=512)
    platform: str = Field(..., pattern="^(ios|android|web)$")
    app_version: str = Field(default="1.0.0")
    device_model: Optional[str] = None
    os_version: Optional[str] = None


class TelemetryRequest(BaseModel):
    ride_id: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: Optional[float] = Field(default=0.0, ge=0.0)
    heading: Optional[float] = Field(default=0.0, ge=0.0, le=360.0)


class OfflineVerifyRequest(BaseModel):
    token: str


def _generate_offline_ticket_signature(payload: Dict[str, Any]) -> str:
    """Generates an HMAC-SHA256 signature for offline ticket verification."""
    data_str = (
        f"{payload['booking_id']}:{payload['passenger_id']}:{payload['ride_id']}:"
        f"{payload['seat_count']}:{payload['valid_until']}"
    )
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        data_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


@router.get("/config", response_model=ApiResponse[Dict[str, Any]])
async def get_mobile_config():
    """
    Returns mobile client configuration parameters, minimum supported app versions,
    emergency contact hotlines, and corridor offline cache TTL rules.
    """
    return ApiResponse.ok(
        data={
            "min_version": "1.0.0",
            "latest_version": "1.0.0",
            "force_update": False,
            "emergency_helpline": "+91 8482 112 112",
            "standard_fare": 310,
            "corridor_name": "Bidar ⇄ Hyderabad (NH 65)",
            "offline_cache_ttl_hours": 48,
            "support_email": "support@bidarconnect.in",
            "waypoints": [
                "Bidar New Bus Stand",
                "Guru Nanak Gate",
                "Humnabad Bypass",
                "Zaheerabad Bypass",
                "Sangareddy X-Roads",
                "Miyapur Metro Station",
                "Gachibowli DLF Hub",
            ],
        }
    )


@router.post("/device/register", response_model=ApiResponse[Dict[str, Any]])
async def register_mobile_device(
    payload: DeviceRegisterRequest,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Registers a mobile client device token for FCM push notification dispatches.
    Associates the push token with the authenticated user ID if logged in.
    """
    user_id = current_user.id if current_user else "ANONYMOUS"
    entry = {
        "device_id": payload.device_id,
        "fcm_token": payload.fcm_token,
        "platform": payload.platform,
        "app_version": payload.app_version,
        "device_model": payload.device_model,
        "os_version": payload.os_version,
        "user_id": user_id,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    REGISTERED_DEVICES[payload.device_id] = entry

    return ApiResponse.ok(
        data={
            "status": "REGISTERED",
            "device_id": payload.device_id,
            "user_id": user_id,
            "platform": payload.platform,
        }
    )


@router.get("/tickets/{booking_id}/offline-payload", response_model=ApiResponse[Dict[str, Any]])
async def get_offline_ticket_payload(
    booking_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates a cryptographically signed offline digital pass with an HMAC-SHA256 signature.
    The passenger client saves this payload locally in AsyncStorage to present in highway dead-zones.
    """
    # Sample fallback for local testing
    from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
    from apps.backend.app.api.v1.rides import SAMPLE_RIDES

    booking = ACTIVE_BOOKINGS.get(booking_id)
    if not booking:
        # Generate mock pass for demonstration / testing
        ride = SAMPLE_RIDES[0] if SAMPLE_RIDES else {}
        booking = {
            "booking_id": booking_id,
            "passenger_id": current_user.id,
            "passenger_name": current_user.full_name,
            "passenger_phone": current_user.phone,
            "ride_id": ride.get("ride_id", "ride_b2h_001"),
            "origin_city": ride.get("origin_city", "Bidar"),
            "destination_city": ride.get("destination_city", "Hyderabad"),
            "pickup_point": ride.get("pickup_point", "New Bus Stand, Bidar"),
            "drop_point": ride.get("drop_point", "Gachibowli DLF, Hyderabad"),
            "departure_time": ride.get("departure_time", "2026-11-05T07:30:00+05:30"),
            "booked_seats": 1,
            "total_fare": 310.0,
            "vehicle_registration": ride.get("vehicle", {}).get("registration_number", "KA 38 M 4120"),
            "vehicle_model": f"{ride.get('vehicle', {}).get('make', 'Maruti')} {ride.get('vehicle', {}).get('model', 'Ertiga')}",
            "driver_name": ride.get("driver", {}).get("name", "Prakash Biradar"),
            "driver_phone": "+919550856204",
        }

    now = datetime.now(timezone.utc)
    valid_until = (now + timedelta(hours=48)).isoformat()

    ticket_data = {
        "booking_id": booking["booking_id"],
        "passenger_id": current_user.id,
        "passenger_name": current_user.full_name,
        "passenger_phone": current_user.phone,
        "ride_id": booking["ride_id"],
        "origin_city": booking.get("origin_city", "Bidar"),
        "destination_city": booking.get("destination_city", "Hyderabad"),
        "pickup_point": booking.get("pickup_point", "New Bus Stand"),
        "drop_point": booking.get("drop_point", "Gachibowli DLF"),
        "departure_time": booking.get("departure_time", "2026-11-05T07:30:00+05:30"),
        "seat_count": booking.get("booked_seats", 1),
        "total_fare": float(booking.get("total_fare", 310.0)),
        "vehicle_registration": booking.get("vehicle_registration", "KA 38 M 4120"),
        "vehicle_model": booking.get("vehicle_model", "Maruti Ertiga"),
        "driver_name": booking.get("driver_name", "Prakash Biradar"),
        "driver_phone": booking.get("driver_phone", "+919550856204"),
        "issued_at": now.isoformat(),
        "valid_until": valid_until,
    }

    sig = _generate_offline_ticket_signature(ticket_data)
    ticket_data["signature"] = sig

    return ApiResponse.ok(data=ticket_data)


@router.post("/tickets/verify-offline", response_model=ApiResponse[Dict[str, Any]])
async def verify_offline_ticket(payload: OfflineVerifyRequest):
    """
    Validates the cryptographic HMAC signature of an offline ticket presented via QR scan.
    Returns 200 OK with ticket details if signature is authentic and not expired.
    """
    try:
        data = json.loads(payload.token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed offline ticket token format.",
        )

    expected_sig = _generate_offline_ticket_signature(data)
    provided_sig = data.get("signature", "")

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tampered ticket detected. Cryptographic signature invalid.",
        )

    valid_until = datetime.fromisoformat(data["valid_until"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > valid_until:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Offline ticket validity period has expired.",
        )

    return ApiResponse.ok(
        data={
            "is_valid": True,
            "booking_id": data["booking_id"],
            "passenger_name": data["passenger_name"],
            "seat_count": data["seat_count"],
            "vehicle_registration": data["vehicle_registration"],
            "driver_name": data["driver_name"],
            "verification_status": "AUTHENTIC_PASS",
        }
    )


@router.post("/driver/telemetry", response_model=ApiResponse[Dict[str, Any]])
async def update_driver_telemetry(
    payload: TelemetryRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Ingests driver live GPS coordinate updates along the NH 65 corridor.
    Stores the latest location for real-time passenger tracking and safety monitoring.
    """
    telemetry_record = {
        "ride_id": payload.ride_id,
        "driver_id": current_user.id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "speed_kmh": payload.speed_kmh,
        "heading": payload.heading,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    RIDE_TELEMETRY[payload.ride_id] = telemetry_record

    return ApiResponse.ok(
        data={
            "status": "TELEMETRY_RECORDED",
            "ride_id": payload.ride_id,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
        }
    )


@router.get("/driver/rides/{ride_id}/telemetry", response_model=ApiResponse[Dict[str, Any]])
async def get_ride_telemetry(ride_id: str):
    """
    Retrieves the latest recorded GPS location of an active corridor ride.
    """
    record = RIDE_TELEMETRY.get(ride_id)
    if not record:
        # Default midpoint telemetry on NH 65 (near Zaheerabad)
        record = {
            "ride_id": ride_id,
            "driver_id": "drv_default",
            "latitude": 17.6833,
            "longitude": 77.6000,
            "speed_kmh": 75.0,
            "heading": 120.0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "landmark": "Near Zaheerabad Bypass (NH 65)",
        }
    return ApiResponse.ok(data=record)

