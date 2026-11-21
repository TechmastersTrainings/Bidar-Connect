from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status

from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_active_user, require_admin
from apps.backend.app.models.user import User
from apps.backend.app.services.notification_service import NotificationService
from apps.backend.app.services.notification_adapter import DISPATCH_LOGS
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
from apps.backend.app.api.v1.rides import SAMPLE_RIDES


router = APIRouter(prefix="/notifications", tags=["Notifications & Integrations"])


class NotificationPreferencesUpdate(BaseModel):
    sms_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    trip_reminders: Optional[bool] = None
    marketing_updates: Optional[bool] = None


class SOSTriggerRequest(BaseModel):
    booking_id: Optional[str] = None
    ride_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark: Optional[str] = None
    details: Optional[str] = None


class SOSResolutionRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=3, description="Incident resolution summary")


class BroadcastAdvisoryRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    message: str = Field(..., min_length=5, max_length=500)
    channels: List[str] = Field(default=["PUSH", "SMS"])
    target_audience: Optional[str] = Field("ALL", description="ALL, PASSENGERS, or DRIVERS")


@router.get("/my", response_model=ApiResponse[List[dict]])
async def get_my_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieves in-app notifications for the authenticated user."""
    items = NotificationService.get_user_notifications(current_user.id, unread_only=unread_only)
    return ApiResponse.ok(items)


@router.put("/{notification_id}/read", response_model=ApiResponse[dict])
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Marks a specific in-app notification as read."""
    success = NotificationService.mark_as_read(current_user.id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notification_id} not found."
        )
    return ApiResponse.ok({"marked_read": True, "notification_id": notification_id})


@router.post("/read-all", response_model=ApiResponse[dict])
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
):
    """Marks all unread notifications as read for current user."""
    count = NotificationService.mark_all_as_read(current_user.id)
    return ApiResponse.ok({"marked_read_count": count})


@router.get("/preferences", response_model=ApiResponse[dict])
async def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieves user's multi-channel notification preferences."""
    prefs = NotificationService.get_preferences(current_user.id)
    return ApiResponse.ok(prefs)


@router.put("/preferences", response_model=ApiResponse[dict])
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Updates user's multi-channel notification preferences."""
    data = payload.model_dump(exclude_unset=True)
    updated = NotificationService.update_preferences(current_user.id, data)
    return ApiResponse.ok(updated)


@router.post("/sos", response_model=ApiResponse[dict])
async def trigger_emergency_sos(
    payload: SOSTriggerRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Triggers an instant highway emergency SOS alert.
    Dispatches SMS & WhatsApp to emergency contacts and notifies platform operators.
    """
    booking = ACTIVE_BOOKINGS.get(payload.booking_id) if payload.booking_id else None
    ride_id = payload.ride_id or (booking.get("ride_id") if booking else None)

    ride = next((r for r in SAMPLE_RIDES if r.get("ride_id") == ride_id), None) if ride_id else None
    driver_name = ride.get("driver", {}).get("name") if ride else None
    vehicle_number = ride.get("vehicle", {}).get("registration_number") if ride else None

    # Passenger emergency contacts from profile or fallback
    emergency_contacts = [
        {"name": "Emergency Control Room", "phone": "+918482112112"},
        {"name": "Designated Contact", "phone": "+919876543210"},
    ]

    alert = NotificationService.trigger_emergency_sos(
        passenger_id=current_user.id,
        passenger_name=current_user.full_name,
        passenger_phone=current_user.phone,
        booking_id=payload.booking_id,
        ride_id=ride_id,
        driver_name=driver_name,
        vehicle_number=vehicle_number,
        latitude=payload.latitude,
        longitude=payload.longitude,
        landmark=payload.landmark,
        emergency_contacts=emergency_contacts,
        details=payload.details,
    )

    return ApiResponse.ok(alert)


@router.get("/sos/alerts", response_model=ApiResponse[List[dict]])
async def get_all_sos_alerts(
    current_user: User = Depends(require_admin),
):
    """Admin-only overview of all highway emergency SOS alerts."""
    alerts = NotificationService.get_all_sos_alerts()
    return ApiResponse.ok(alerts)


@router.post("/sos/{alert_id}/acknowledge", response_model=ApiResponse[dict])
async def acknowledge_sos_alert(
    alert_id: str,
    current_user: User = Depends(require_admin),
):
    """Acknowledge an active emergency SOS alert."""
    alert = NotificationService.acknowledge_sos(alert_id, current_user.full_name)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SOS Alert {alert_id} not found."
        )
    return ApiResponse.ok(alert)


@router.post("/sos/{alert_id}/resolve", response_model=ApiResponse[dict])
async def resolve_sos_alert(
    alert_id: str,
    payload: SOSResolutionRequest,
    current_user: User = Depends(require_admin),
):
    """Resolve an emergency SOS alert with incident notes."""
    alert = NotificationService.resolve_sos(alert_id, current_user.full_name, payload.resolution_notes)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SOS Alert {alert_id} not found."
        )
    return ApiResponse.ok(alert)


@router.get("/dispatches", response_model=ApiResponse[List[dict]])
async def get_dispatch_logs(
    limit: int = 100,
    current_user: User = Depends(require_admin),
):
    """Admin-only inspection log of all dispatched SMS, WhatsApp, Push, and Email messages."""
    return ApiResponse.ok(DISPATCH_LOGS[:limit])


@router.post("/broadcast", response_model=ApiResponse[dict])
async def broadcast_corridor_advisory(
    payload: BroadcastAdvisoryRequest,
    current_user: User = Depends(require_admin),
):
    """Admin-only highway corridor broadcast advisory."""
    res = NotificationService.broadcast_advisory(
        title=payload.title,
        message=payload.message,
        channels=payload.channels,
        target_audience=payload.target_audience,
    )
    return ApiResponse.ok(res)

