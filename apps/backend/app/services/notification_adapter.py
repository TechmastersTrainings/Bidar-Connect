from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import time
import uuid

from apps.backend.app.core.config import settings


# Persistent dispatch log registry for operational auditing and test assertions
DISPATCH_LOGS: List[Dict[str, Any]] = [
    {
        "dispatch_id": "disp_init_001",
        "channel": "SMS",
        "recipient": "+919800000000",
        "event_type": "OTP_DISPATCH",
        "status": "DELIVERED",
        "provider": "Twilio-Transactional",
        "content_snippet": "Your Bidar Connect verification code is 123456.",
        "dispatched_at": "2026-11-01T12:00:00+05:30",
    },
    {
        "dispatch_id": "disp_init_002",
        "channel": "WHATSAPP",
        "recipient": "+919876543210",
        "event_type": "BOOKING_CONFIRMED",
        "status": "DELIVERED",
        "provider": "Meta-WhatsApp-Business",
        "content_snippet": "Ride Confirmed: Bidar to Hyderabad (NH 65). Ref: BC-8932.",
        "dispatched_at": "2026-11-01T12:05:00+05:30",
    },
]


class NotificationAdapter(ABC):
    """
    Provider-agnostic interface for multi-channel message dispatch.
    """

    @abstractmethod
    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def send_whatsapp(self, to_phone: str, template: str, params: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def send_push(self, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        pass


class MockNotificationAdapter(NotificationAdapter):
    """
    Deterministic in-memory notification engine for sandbox testing and development.
    Records delivery receipts without external third-party network egress.
    """

    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        disp_id = f"disp_sms_{uuid.uuid4().hex[:10]}"
        record = {
            "dispatch_id": disp_id,
            "channel": "SMS",
            "recipient": to_phone,
            "event_type": "SMS_ALERT",
            "status": "DELIVERED",
            "provider": "Twilio-Transactional",
            "content_snippet": message[:100],
            "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        DISPATCH_LOGS.insert(0, record)
        return {
            "success": True,
            "message_id": disp_id,
            "channel": "SMS",
            "recipient": to_phone,
            "status": "DELIVERED",
        }

    def send_whatsapp(self, to_phone: str, template: str, params: Dict[str, Any]) -> Dict[str, Any]:
        disp_id = f"disp_wa_{uuid.uuid4().hex[:10]}"
        content = f"Template [{template}]: " + ", ".join(f"{k}={v}" for k, v in params.items())
        record = {
            "dispatch_id": disp_id,
            "channel": "WHATSAPP",
            "recipient": to_phone,
            "event_type": template,
            "status": "DELIVERED",
            "provider": "Meta-WhatsApp-Cloud",
            "content_snippet": content[:120],
            "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        DISPATCH_LOGS.insert(0, record)
        return {
            "success": True,
            "message_id": disp_id,
            "channel": "WHATSAPP",
            "recipient": to_phone,
            "status": "DELIVERED",
        }

    def send_push(self, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        disp_id = f"disp_push_{uuid.uuid4().hex[:10]}"
        record = {
            "dispatch_id": disp_id,
            "channel": "PUSH",
            "recipient": f"usr_{user_id[:8]}",
            "event_type": (data or {}).get("event_type", "IN_APP_PUSH"),
            "status": "DELIVERED",
            "provider": "FCM-Direct",
            "content_snippet": f"{title} — {body[:80]}",
            "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        DISPATCH_LOGS.insert(0, record)
        return {
            "success": True,
            "message_id": disp_id,
            "channel": "PUSH",
            "recipient": user_id,
            "status": "DELIVERED",
        }

    def send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        disp_id = f"disp_mail_{uuid.uuid4().hex[:10]}"
        record = {
            "dispatch_id": disp_id,
            "channel": "EMAIL",
            "recipient": to_email,
            "event_type": "TRANSACTIONAL_EMAIL",
            "status": "DELIVERED",
            "provider": "SendGrid-SMTP",
            "content_snippet": f"{subject}: {html_content[:60]}",
            "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        DISPATCH_LOGS.insert(0, record)
        return {
            "success": True,
            "message_id": disp_id,
            "channel": "EMAIL",
            "recipient": to_email,
            "status": "DELIVERED",
        }


def get_notification_adapter() -> NotificationAdapter:
    """Factory returning configured notification adapter."""
    return MockNotificationAdapter()

