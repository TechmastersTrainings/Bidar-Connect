import unittest
import asyncio
import random
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, PassengerProfile
from apps.backend.app.services.notification_service import NotificationService
from apps.backend.app.services.notification_adapter import DISPATCH_LOGS


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestNotificationsApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def _create_user(self, name: str, is_admin: bool = False, is_driver: bool = False) -> tuple[str, str, str]:
        phone = f"+91{random_phone()}"
        async def do_create():
            async with async_session_factory() as session:
                user = User(
                    phone=phone,
                    full_name=name,
                    is_passenger=True,
                    is_driver=is_driver,
                    is_admin=is_admin,
                    is_active=True,
                    is_suspended=False,
                )
                session.add(user)
                await session.flush()
                prof = PassengerProfile(user_id=user.id)
                session.add(prof)
                await session.commit()
                return str(user.id), phone
        user_id, phone_res = self.loop.run_until_complete(do_create())
        token = create_access_token(
            subject=user_id,
            claims={
                "phone": phone_res,
                "roles": (["ADMIN"] if is_admin else []) + (["DRIVER"] if is_driver else []) + ["PASSENGER"],
                "is_admin": is_admin,
                "is_driver": is_driver,
            }
        )
        return user_id, token, phone_res

    def test_user_notifications_lifecycle(self):
        user_id, token, phone = self._create_user("Notif Passenger")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Send in-app notification
        NotificationService.send_notification(
            user_id=user_id,
            event_type="BOOKING_CONFIRMED",
            title="Seat Reserved",
            message="Your seat on Bidar ⇄ Hyderabad ride is confirmed.",
            channel="PUSH",
            phone=phone,
        )

        # 2. Retrieve user notifications
        res_list = self.client.get("/api/v1/notifications/my", headers=headers)
        self.assertEqual(res_list.status_code, 200)
        items = res_list.json()["data"]
        self.assertTrue(len(items) >= 1)
        target = next((n for n in items if n["title"] == "Seat Reserved"), None)
        self.assertIsNotNone(target)
        self.assertFalse(target["is_read"])

        # 3. Mark single notification as read
        notif_id = target["id"]
        res_read = self.client.put(f"/api/v1/notifications/{notif_id}/read", headers=headers)
        self.assertEqual(res_read.status_code, 200)
        self.assertTrue(res_read.json()["data"]["marked_read"])

        # 4. Check unread filter
        res_unread = self.client.get("/api/v1/notifications/my?unread_only=true", headers=headers)
        self.assertEqual(res_unread.status_code, 200)
        unread_items = res_unread.json()["data"]
        self.assertFalse(any(n["id"] == notif_id for n in unread_items))

    def test_notification_preferences_management(self):
        user_id, token, _ = self._create_user("Prefs User")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Get default preferences
        res_get = self.client.get("/api/v1/notifications/preferences", headers=headers)
        self.assertEqual(res_get.status_code, 200)
        prefs = res_get.json()["data"]
        self.assertTrue(prefs["sms_enabled"])
        self.assertTrue(prefs["whatsapp_enabled"])

        # 2. Update preferences (opt out of email, opt into marketing)
        res_update = self.client.put(
            "/api/v1/notifications/preferences",
            headers=headers,
            json={"email_enabled": False, "marketing_updates": True},
        )
        self.assertEqual(res_update.status_code, 200)
        u_prefs = res_update.json()["data"]
        self.assertFalse(u_prefs["email_enabled"])
        self.assertTrue(u_prefs["marketing_updates"])

    def test_emergency_sos_trigger_and_dispatch(self):
        user_id, token, phone = self._create_user("SOS Passenger")
        headers = {"Authorization": f"Bearer {token}"}

        # Trigger SOS
        res_sos = self.client.post(
            "/api/v1/notifications/sos",
            headers=headers,
            json={
                "landmark": "NH 65 near Zahirabad Toll Gate",
                "latitude": 17.6833,
                "longitude": 77.6083,
                "details": "Flat tire on highway, driver stopped at emergency bay.",
            },
        )
        self.assertEqual(res_sos.status_code, 200, res_sos.text)
        sos_data = res_sos.json()["data"]
        self.assertEqual(sos_data["status"], "ACTIVE_EMERGENCY")
        self.assertEqual(sos_data["passenger_id"], user_id)
        self.assertGreater(sos_data["dispatched_contacts_count"], 0)
        self.assertIn("Zahirabad", sos_data["location"]["landmark"])

        # Check dispatch logs recorded emergency message
        emergency_dispatches = [
            d for d in DISPATCH_LOGS if "EMERGENCY ALERT" in d.get("content_snippet", "")
        ]
        self.assertTrue(len(emergency_dispatches) > 0)

    def test_admin_sos_governance_and_resolution(self):
        admin_id, admin_token, _ = self._create_user("Safety Admin", is_admin=True)
        a_headers = {"Authorization": f"Bearer {admin_token}"}

        user_id, user_token, _ = self._create_user("Distressed Rider")
        u_headers = {"Authorization": f"Bearer {user_token}"}

        # Rider triggers SOS
        res_sos = self.client.post(
            "/api/v1/notifications/sos",
            headers=u_headers,
            json={"landmark": "Humnabad Bypass", "details": "Need highway patrol assistance"},
        )
        alert_id = res_sos.json()["data"]["alert_id"]

        # Admin lists SOS alerts
        res_alerts = self.client.get("/api/v1/notifications/sos/alerts", headers=a_headers)
        self.assertEqual(res_alerts.status_code, 200)
        alerts_list = res_alerts.json()["data"]
        self.assertTrue(any(a["alert_id"] == alert_id for a in alerts_list))

        # Admin acknowledges SOS alert
        res_ack = self.client.post(f"/api/v1/notifications/sos/{alert_id}/acknowledge", headers=a_headers)
        self.assertEqual(res_ack.status_code, 200)
        self.assertEqual(res_ack.json()["data"]["status"], "ACKNOWLEDGED")

        # Admin resolves SOS alert
        res_resolve = self.client.post(
            f"/api/v1/notifications/sos/{alert_id}/resolve",
            headers=a_headers,
            json={"resolution_notes": "Highway patrol arrived, spare tire replaced safely."},
        )
        self.assertEqual(res_resolve.status_code, 200)
        self.assertEqual(res_resolve.json()["data"]["status"], "RESOLVED")

    def test_admin_broadcast_and_dispatch_logs(self):
        admin_id, admin_token, _ = self._create_user("Broadcaster Admin", is_admin=True)
        a_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Admin sends broadcast advisory
        res_bcst = self.client.post(
            "/api/v1/notifications/broadcast",
            headers=a_headers,
            json={
                "title": "NH 65 Monsoon Advisory",
                "message": "Heavy rain between Humnabad and Zahirabad. Maintain 60 km/h speed limit.",
                "channels": ["SMS", "PUSH"],
                "target_audience": "ALL",
            },
        )
        self.assertEqual(res_bcst.status_code, 200)
        self.assertEqual(res_bcst.json()["data"]["status"], "DISPATCHED")

        # 2. Admin inspects dispatch logs
        res_logs = self.client.get("/api/v1/notifications/dispatches", headers=a_headers)
        self.assertEqual(res_logs.status_code, 200)
        logs = res_logs.json()["data"]
        self.assertIsInstance(logs, list)
        self.assertTrue(len(logs) >= 2)


if __name__ == "__main__":
    unittest.main()

