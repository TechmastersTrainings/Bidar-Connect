from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

from apps.backend.app.core.config import settings
from apps.backend.app.services.notification_adapter import get_notification_adapter, DISPATCH_LOGS


# In-memory synchronized registries
USER_NOTIFICATIONS: List[Dict[str, Any]] = [
    {
        "id": "notif_seed_001",
        "user_id": "usr_default_passenger",
        "title": "Welcome to Bidar Connect",
        "message": "Your intercity ride sharing account is active for the Bidar ⇄ Hyderabad corridor.",
        "event_type": "OTP_DISPATCH",
        "channel": "PUSH",
        "is_read": False,
        "metadata": {"corridor": "NH 65"},
        "created_at": "2026-11-01T12:00:00+05:30",
    }
]

USER_NOTIFICATION_PREFERENCES: Dict[str, Dict[str, Any]] = {}

ACTIVE_SOS_ALERTS: Dict[str, Dict[str, Any]] = {}


class NotificationService:
    @staticmethod
    def get_preferences(user_id: str) -> Dict[str, Any]:
        """Returns notification channel preferences for a user."""
        if user_id not in USER_NOTIFICATION_PREFERENCES:
            USER_NOTIFICATION_PREFERENCES[user_id] = {
                "user_id": user_id,
                "sms_enabled": True,
                "whatsapp_enabled": True,
                "push_enabled": True,
                "email_enabled": True,
                "trip_reminders": True,
                "marketing_updates": False,
            }
        return USER_NOTIFICATION_PREFERENCES[user_id]

    @staticmethod
    def update_preferences(user_id: str, prefs: Dict[str, Any]) -> Dict[str, Any]:
        current = NotificationService.get_preferences(user_id)
        current.update(prefs)
        USER_NOTIFICATION_PREFERENCES[user_id] = current
        return current

    @staticmethod
    def send_notification(
        user_id: str,
        event_type: str,
        title: str,
        message: str,
        channel: str = "PUSH",
        metadata: Optional[Dict[str, Any]] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches multi-channel notification and stores in user's in-app inbox.
        Respects user's opted notification preferences.
        """
        prefs = NotificationService.get_preferences(user_id)
        adapter = get_notification_adapter()

        # In-app inbox entry
        notif_id = f"notif_{uuid.uuid4().hex[:10]}"
        item = {
            "id": notif_id,
            "user_id": user_id,
            "title": title,
            "message": message,
            "event_type": event_type,
            "channel": channel,
            "is_read": False,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        USER_NOTIFICATIONS.insert(0, item)

        # External channel dispatch based on preferences
        if channel == "SMS" and prefs.get("sms_enabled", True) and phone:
            adapter.send_sms(phone, f"Bidar Connect: {title}. {message}")
        elif channel == "WHATSAPP" and prefs.get("whatsapp_enabled", True) and phone:
            adapter.send_whatsapp(phone, event_type, {"title": title, "body": message})
        elif channel == "PUSH" and prefs.get("push_enabled", True):
            adapter.send_push(user_id, title, message, {"event_type": event_type})
        elif channel == "EMAIL" and prefs.get("email_enabled", True) and email:
            adapter.send_email(email, title, message)

        return item

    @staticmethod
    def get_user_notifications(user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        user_items = [n for n in USER_NOTIFICATIONS if n["user_id"] == user_id]
        if unread_only:
            user_items = [n for n in user_items if not n["is_read"]]
        return user_items

    @staticmethod
    def mark_as_read(user_id: str, notification_id: str) -> bool:
        for n in USER_NOTIFICATIONS:
            if n["id"] == notification_id and n["user_id"] == user_id:
                n["is_read"] = True
                return True
        return False

    @staticmethod
    def mark_all_as_read(user_id: str) -> int:
        count = 0
        for n in USER_NOTIFICATIONS:
            if n["user_id"] == user_id and not n["is_read"]:
                n["is_read"] = True
                count += 1
        return count

    @staticmethod
    def trigger_emergency_sos(
        passenger_id: str,
        passenger_name: str,
        passenger_phone: str,
        booking_id: Optional[str] = None,
        ride_id: Optional[str] = None,
        driver_name: Optional[str] = None,
        vehicle_number: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        landmark: Optional[str] = None,
        emergency_contacts: Optional[List[Dict[str, str]]] = None,
        details: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Instant Highway Emergency SOS pipeline.
        Dispatches emergency SMS & WhatsApp to trusted contacts, notifies driver & admin.
        """
        alert_id = f"sos_{uuid.uuid4().hex[:10]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        adapter = get_notification_adapter()

        location_desc = landmark or f"Lat: {latitude}, Long: {longitude}" if (latitude and longitude) else "Corridor NH 65 (Bidar ⇄ Hyderabad)"

        contacts = emergency_contacts or [
            {"name": "Emergency Contact 1", "phone": "+919876543210"},
            {"name": "Emergency Control Room", "phone": settings.EMERGENCY_HELPLINE},
        ]

        # 1. Dispatch High-Priority SMS to Emergency Contacts
        sms_text = (
            f"EMERGENCY ALERT: {passenger_name} ({passenger_phone}) triggered SOS on Bidar Connect. "
            f"Location: {location_desc}. Corridor: NH 65. Ride: {ride_id or 'Intercity'}. "
            f"Helpline: {settings.EMERGENCY_HELPLINE}."
        )

        for c in contacts:
            c_phone = c.get("phone")
            if c_phone:
                adapter.send_sms(c_phone, sms_text)
                adapter.send_whatsapp(c_phone, "EMERGENCY_SOS_TRIGGERED", {
                    "passenger": passenger_name,
                    "location": location_desc,
                    "details": details or "Immediate safety assistance requested.",
                })

        alert_record = {
            "alert_id": alert_id,
            "passenger_id": passenger_id,
            "passenger_name": passenger_name,
            "passenger_phone": passenger_phone,
            "ride_id": ride_id,
            "driver_name": driver_name,
            "vehicle_number": vehicle_number,
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "landmark": location_desc,
            },
            "status": "ACTIVE_EMERGENCY",
            "dispatched_contacts_count": len(contacts),
            "triggered_at": timestamp,
            "emergency_notes": details or "Passenger activated highway SOS trigger.",
        }

        ACTIVE_SOS_ALERTS[alert_id] = alert_record

        # 2. In-App Notification to User
        NotificationService.send_notification(
            user_id=passenger_id,
            event_type="EMERGENCY_SOS_TRIGGERED",
            title="Emergency SOS Dispatched",
            message=f"SOS alert dispatched to {len(contacts)} contacts and 24x7 Corridor Helpline ({settings.EMERGENCY_HELPLINE}). Stay calm; support is activated.",
            channel="SMS",
            metadata={"alert_id": alert_id, "location": location_desc},
            phone=passenger_phone,
        )

        return alert_record

    @staticmethod
    def get_all_sos_alerts() -> List[Dict[str, Any]]:
        return list(ACTIVE_SOS_ALERTS.values())

    @staticmethod
    def acknowledge_sos(alert_id: str, actor_name: str) -> Optional[Dict[str, Any]]:
        alert = ACTIVE_SOS_ALERTS.get(alert_id)
        if alert:
            alert["status"] = "ACKNOWLEDGED"
            alert["acknowledged_by"] = actor_name
            alert["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
            return alert
        return None

    @staticmethod
    def resolve_sos(alert_id: str, actor_name: str, resolution_notes: str) -> Optional[Dict[str, Any]]:
        alert = ACTIVE_SOS_ALERTS.get(alert_id)
        if alert:
            alert["status"] = "RESOLVED"
            alert["resolved_by"] = actor_name
            alert["resolution_notes"] = resolution_notes
            alert["resolved_at"] = datetime.now(timezone.utc).isoformat()
            return alert
        return None

    @staticmethod
    def broadcast_advisory(
        title: str,
        message: str,
        channels: List[str],
        target_audience: str = "ALL",
    ) -> Dict[str, Any]:
        """Broadcasts corridor advisory (e.g. NH 65 weather/traffic warning)."""
        adapter = get_notification_adapter()
        broadcast_id = f"bcst_{uuid.uuid4().hex[:10]}"

        for ch in channels:
            if ch == "SMS":
                adapter.send_sms("+91_CORRIDOR_BROADCAST", f"Bidar Connect Advisory: {title} — {message}")
            elif ch == "WHATSAPP":
                adapter.send_whatsapp("+91_CORRIDOR_BROADCAST", "CORRIDOR_ADVISORY", {"title": title, "msg": message})
            elif ch == "PUSH":
                adapter.send_push("ALL_USERS", title, message, {"event_type": "CORRIDOR_ADVISORY"})

        # Record in system notifications
        NotificationService.send_notification(
            user_id="SYSTEM_BROADCAST",
            event_type="CORRIDOR_ADVISORY",
            title=title,
            message=message,
            channel="PUSH",
            metadata={"broadcast_id": broadcast_id, "target_audience": target_audience},
        )

        return {
            "broadcast_id": broadcast_id,
            "title": title,
            "channels": channels,
            "target_audience": target_audience,
            "status": "DISPATCHED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

