import unittest
import asyncio
import uuid
import random
from datetime import timedelta, date
import jwt
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.config import settings
from apps.backend.app.core.security import create_access_token, decode_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, DriverProfile, PassengerProfile


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestAuthAndRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def test_token_creation_and_decoding(self):
        """Verify token generation, signature integrity, and claims extraction."""
        token = create_access_token(
            subject="usr_test_123",
            claims={"phone": "+919876543210", "roles": ["PASSENGER"]},
            expires_delta=timedelta(minutes=30),
        )
        self.assertIsInstance(token, str)
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "usr_test_123")
        self.assertEqual(payload["phone"], "+919876543210")
        self.assertIn("PASSENGER", payload["roles"])

    def test_expired_token_rejected(self):
        """Verify expired tokens are rejected with ExpiredSignatureError."""
        expired_token = create_access_token(
            subject="usr_expired",
            expires_delta=timedelta(seconds=-10),  # expired 10s ago
        )
        with self.assertRaises(jwt.ExpiredSignatureError):
            decode_access_token(expired_token)

        # HTTP level check
        resp = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(resp.status_code, 401)
        data = resp.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "HTTP_401")

    def test_tampered_token_rejected(self):
        """Verify tokens with modified signature or invalid secret are rejected."""
        valid_token = create_access_token(subject="usr_legit")
        tampered_token = valid_token[:-5] + "XXXXX"
        with self.assertRaises(jwt.InvalidTokenError):
            decode_access_token(tampered_token)

        resp = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )
        self.assertEqual(resp.status_code, 401)

    def test_unauthenticated_request_rejected(self):
        """Protected endpoints reject calls missing the Authorization Bearer header."""
        resp = self.client.get("/api/v1/auth/me")
        self.assertEqual(resp.status_code, 401)
        data = resp.json()
        self.assertFalse(data["success"])
        self.assertIn("not provided", data["error"]["message"])

    def test_otp_dispatch_and_verification_flow(self):
        """End-to-end OTP request and verification generating user and session token."""
        phone = random_phone()
        # 1. Request OTP
        req_resp = self.client.post(
            "/api/v1/auth/otp/request",
            json={"phone": phone},
        )
        self.assertEqual(req_resp.status_code, 200)
        req_data = req_resp.json()
        self.assertTrue(req_data["success"])
        dev_otp = req_data["data"]["dev_otp"]

        # 2. Verify OTP
        verify_resp = self.client.post(
            "/api/v1/auth/otp/verify",
            json={
                "phone": phone,
                "otp": dev_otp,
                "full_name": "Deepak Shinde",
            },
        )
        self.assertEqual(verify_resp.status_code, 200)
        verify_data = verify_resp.json()
        self.assertTrue(verify_data["success"])
        token = verify_data["data"]["access_token"]
        user_info = verify_data["data"]["user"]
        self.assertEqual(user_info["full_name"], "Deepak Shinde")
        self.assertTrue(user_info["is_passenger"])
        self.assertFalse(user_info["is_driver"])

        # 3. Access /auth/me with the issued token
        me_resp = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["data"]["phone"], f"+91{phone}")

    def test_rbac_passenger_forbidden_from_admin_and_driver(self):
        """Ensure standard passenger token is rejected (403 Forbidden) from admin/driver routes."""
        phone = random_phone()
        # Register passenger
        verify_resp = self.client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": phone, "otp": "123456", "full_name": "Sunita Rao"},
        )
        token = verify_resp.json()["data"]["access_token"]

        # Attempt to access admin users list
        admin_resp = self.client.get(
            "/api/v1/auth/admin/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(admin_resp.status_code, 403)
        self.assertEqual(admin_resp.json()["error"]["code"], "HTTP_403")

        # Attempt to access driver test gate
        driver_resp = self.client.get(
            "/api/v1/auth/driver/test-gate",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(driver_resp.status_code, 403)

    def test_unverified_driver_kyc_gate(self):
        """Driver without administrative verification cannot pass driver gate."""
        phone = random_phone()
        licence_num = f"KA38-{random.randint(10000000, 99999999)}"
        # Register user
        verify_resp = self.client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": phone, "otp": "123456", "full_name": "Prakash Biradar"},
        )
        token = verify_resp.json()["data"]["access_token"]

        # Submit driver onboarding documents
        onboard_resp = self.client.post(
            "/api/v1/auth/driver-onboard",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "licence_number": licence_num,
                "licence_expiry": str(date.today() + timedelta(days=730)),
                "licence_document_id": f"kyc/dl_{licence_num}",
            },
        )
        self.assertEqual(onboard_resp.status_code, 200)
        self.assertFalse(onboard_resp.json()["data"]["driver_verified"])

        # Try to pass driver gate -> rejected with 403 pending admin review
        gate_resp = self.client.get(
            "/api/v1/auth/driver/test-gate",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(gate_resp.status_code, 403)
        self.assertIn("pending verification", gate_resp.json()["error"]["message"])

    def test_admin_privilege_and_suspension_control(self):
        """Admin user can list users and toggle account suspension."""
        admin_phone = f"+91{random_phone()}"
        async def create_admin():
            async with async_session_factory() as session:
                admin_user = User(
                    phone=admin_phone,
                    full_name="Platform Admin",
                    is_admin=True,
                    is_passenger=True,
                    is_active=True,
                    is_suspended=False,
                )
                session.add(admin_user)
                await session.commit()
                return admin_user.id

        admin_id = self.loop.run_until_complete(create_admin())
        admin_token = create_access_token(
            subject=admin_id,
            claims={"roles": ["ADMIN", "PASSENGER"], "is_admin": True},
        )

        # Admin calls list users
        list_resp = self.client.get(
            "/api/v1/auth/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(list_resp.status_code, 200)
        users = list_resp.json()["data"]
        self.assertTrue(len(users) >= 1)

    def test_suspended_user_blocked(self):
        """Suspended user is immediately blocked from accessing protected endpoints."""
        susp_phone = f"+91{random_phone()}"
        async def create_suspended():
            async with async_session_factory() as session:
                user = User(
                    phone=susp_phone,
                    full_name="Suspended BadActor",
                    is_passenger=True,
                    is_active=True,
                    is_suspended=True,
                )
                session.add(user)
                await session.commit()
                return user.id

        bad_id = self.loop.run_until_complete(create_suspended())
        bad_token = create_access_token(subject=bad_id)

        resp = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("suspended", resp.json()["error"]["message"].lower())


if __name__ == "__main__":
    unittest.main()
