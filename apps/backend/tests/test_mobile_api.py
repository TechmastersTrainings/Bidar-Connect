import unittest
import asyncio
import json
import random
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, PassengerProfile, DriverProfile


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestMobileApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def _create_user(self, name: str, is_driver: bool = False) -> tuple[str, str, str]:
        phone = f"+91{random_phone()}"

        async def do_create():
            async with async_session_factory() as session:
                user = User(
                    phone=phone,
                    full_name=name,
                    is_passenger=True,
                    is_driver=is_driver,
                    is_admin=False,
                    is_active=True,
                    is_suspended=False,
                )
                session.add(user)
                await session.flush()

                prof = PassengerProfile(user_id=user.id)
                session.add(prof)

                if is_driver:
                    drv = DriverProfile(
                        user_id=user.id,
                        licence_number=f"KA38{random.randint(2010, 2025)}{random.randint(100000, 999999)}",
                        licence_expiry=datetime.now(timezone.utc).date() + timedelta(days=365),
                        licence_document_id=f"doc_drv_lic_{random.randint(1000, 9999)}",
                        is_verified=True,
                    )
                    session.add(drv)

                await session.commit()
                return user.id, user.phone

        uid, uphone = self.loop.run_until_complete(do_create())
        roles = ["PASSENGER"]
        if is_driver:
            roles.append("DRIVER")

        token = create_access_token(
            subject=uid,
            claims={
                "phone": uphone,
                "roles": roles,
                "is_driver": is_driver,
                "is_admin": False,
                "is_passenger": True,
            },
        )
        return uid, uphone, token

    def test_get_mobile_config(self):
        """Verify public mobile app configuration and corridor parameters."""
        res = self.client.get("/api/v1/mobile/config")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["standard_fare"], 310)
        self.assertEqual(data["emergency_helpline"], "+91 8482 112 112")
        self.assertGreaterEqual(len(data["waypoints"]), 6)
        self.assertEqual(data["min_version"], "1.0.0")

    def test_register_device_token(self):
        """Verify FCM device registration for iOS and Android."""
        _, _, passenger_token = self._create_user("Mobile Passenger Alpha")
        payload = {
            "device_id": "mob_dev_iphone_15_pro",
            "fcm_token": "fcm_token_sample_abc123xyz456",
            "platform": "ios",
            "app_version": "1.0.0",
            "device_model": "iPhone 15 Pro",
            "os_version": "iOS 18.1",
        }
        res = self.client.post(
            "/api/v1/mobile/device/register",
            json=payload,
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["status"], "REGISTERED")
        self.assertEqual(data["device_id"], "mob_dev_iphone_15_pro")
        self.assertEqual(data["platform"], "ios")

    def test_offline_ticket_signing_and_verification(self):
        """Verify cryptographic HMAC-SHA256 signing and offline verification."""
        _, _, passenger_token = self._create_user("Offline Commuter Beta")

        # 1. Fetch offline signed payload
        res = self.client.get(
            "/api/v1/mobile/tickets/bk_mob_test_999/offline-payload",
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(res.status_code, 200)
        ticket = res.json()["data"]
        self.assertIn("signature", ticket)
        self.assertIn("valid_until", ticket)
        self.assertEqual(ticket["booking_id"], "bk_mob_test_999")

        # 2. Verify authentic ticket offline scan
        verify_res = self.client.post(
            "/api/v1/mobile/tickets/verify-offline",
            json={"token": json.dumps(ticket)},
        )
        self.assertEqual(verify_res.status_code, 200)
        verify_data = verify_res.json()["data"]
        self.assertTrue(verify_data["is_valid"])
        self.assertEqual(verify_data["verification_status"], "AUTHENTIC_PASS")

        # 3. Verify tampered ticket rejection (e.g. seat count modified from 1 to 4)
        tampered_ticket = dict(ticket)
        tampered_ticket["seat_count"] = 4
        tampered_res = self.client.post(
            "/api/v1/mobile/tickets/verify-offline",
            json={"token": json.dumps(tampered_ticket)},
        )
        self.assertEqual(tampered_res.status_code, 401)

        # 4. Verify expired ticket rejection
        expired_ticket = dict(ticket)
        expired_ticket["valid_until"] = (
            datetime.now(timezone.utc) - timedelta(days=2)
        ).isoformat()
        # Regenerate signature for the expired payload to test expiration check
        from apps.backend.app.api.v1.mobile import _generate_offline_ticket_signature
        expired_ticket["signature"] = _generate_offline_ticket_signature(expired_ticket)
        expired_res = self.client.post(
            "/api/v1/mobile/tickets/verify-offline",
            json={"token": json.dumps(expired_ticket)},
        )
        self.assertEqual(expired_res.status_code, 410)

    def test_driver_gps_telemetry(self):
        """Verify driver live GPS coordinate ingestion and passenger retrieval."""
        _, _, driver_token = self._create_user("Mobile Driver Gamma", is_driver=True)
        ride_id = "ride_mob_telemetry_001"
        payload = {
            "ride_id": ride_id,
            "latitude": 17.6854,
            "longitude": 77.6042,
            "speed_kmh": 82.5,
            "heading": 115.0,
        }
        post_res = self.client.post(
            "/api/v1/mobile/driver/telemetry",
            json=payload,
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        self.assertEqual(post_res.status_code, 200)
        self.assertEqual(post_res.json()["data"]["status"], "TELEMETRY_RECORDED")

        # Query telemetry
        get_res = self.client.get(f"/api/v1/mobile/driver/rides/{ride_id}/telemetry")
        self.assertEqual(get_res.status_code, 200)
        telemetry = get_res.json()["data"]
        self.assertEqual(telemetry["latitude"], 17.6854)
        self.assertEqual(telemetry["longitude"], 77.6042)
        self.assertEqual(telemetry["speed_kmh"], 82.5)


if __name__ == "__main__":
    unittest.main()
