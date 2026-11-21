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


class TestSecurityAndLegalAudit(unittest.TestCase):
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

                prof = PassengerProfile(
                    user_id=user.id,
                    preferred_pickup_landmark="New Bus Stand",
                    medical_emergency_notes="None",
                )
                session.add(prof)

                if is_driver:
                    drv = DriverProfile(
                        user_id=user.id,
                        licence_number=f"KA38{random.randint(2010, 2025)}{random.randint(100000, 999999)}",
                        licence_expiry=datetime.now(timezone.utc).date() + timedelta(days=365),
                        licence_document_id=f"doc_drv_{random.randint(1000, 9999)}",
                        is_verified=True,
                    )
                    session.add(drv)

                await session.commit()
                return user.id, user.phone

        uid, uphone = self.loop.run_until_complete(do_create())
        roles = ["PASSENGER"]
        if is_driver:
            roles.append("DRIVER")
        if is_admin:
            roles.append("ADMIN")

        token = create_access_token(
            subject=uid,
            claims={
                "phone": uphone,
                "roles": roles,
                "is_driver": is_driver,
                "is_admin": is_admin,
                "is_passenger": True,
            },
        )
        return uid, uphone, token

    # -------------------------------------------------------------------------
    # 1. OWASP Top 10 - Security Headers
    # -------------------------------------------------------------------------
    def test_owasp_security_headers_enforcement(self):
        """Verify presence of OWASP-mandated security headers on all responses."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        headers = res.headers
        self.assertEqual(headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(headers.get("x-frame-options"), "DENY")
        self.assertEqual(headers.get("x-xss-protection"), "1; mode=block")
        self.assertIn("max-age=31536000", headers.get("strict-transport-security", ""))
        self.assertEqual(headers.get("referrer-policy"), "strict-origin-when-cross-origin")
        self.assertIn("geolocation=(self)", headers.get("permissions-policy", ""))

    # -------------------------------------------------------------------------
    # 2. OWASP Top 10 - Injection & Input Validation Defense
    # -------------------------------------------------------------------------
    def test_sql_and_payload_injection_defense(self):
        """Verify strict regex rejects SQL injection payloads in phone parameters."""
        malicious_phones = [
            "+919800000000' OR 1=1--",
            "DROP TABLE users;",
            "<script>alert('xss')</script>",
            "+919800000000; SELECT * FROM users;",
        ]
        for bad_phone in malicious_phones:
            res = self.client.post("/api/v1/auth/otp/request", json={"phone": bad_phone})
            self.assertEqual(res.status_code, 422, f"Failed to reject malicious phone: {bad_phone}")

    # -------------------------------------------------------------------------
    # 3. OWASP Top 10 - Broken Authentication & Anti-IDOR
    # -------------------------------------------------------------------------
    def test_broken_auth_and_tampered_jwt_rejection(self):
        """Verify tampered JWT signatures and unauthorized tokens are rejected."""
        # Unauthenticated request
        unauth_res = self.client.get("/api/v1/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

        # Tampered JWT signature
        tampered_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJzdWIiOiJ1c3JfdGVzdF85OTkiLCJyb2xlcyI6WyJBRE1JTiJdfQ."
            "INVALID_SIGNATURE_TAMPERED"
        )
        tampered_res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"},
        )
        self.assertEqual(tampered_res.status_code, 401)

    def test_privilege_escalation_and_rbac_defense(self):
        """Verify passenger cannot escalate privileges to access admin governance."""
        _, _, passenger_token = self._create_user("Standard Commuter")
        admin_res = self.client.get(
            "/api/v1/admin/metrics",
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(admin_res.status_code, 403)

    # -------------------------------------------------------------------------
    # 4. DPDP Act 2023 Statutory Compliance (Items #1-#20)
    # -------------------------------------------------------------------------
    def test_dpdp_act_section_11_data_export(self):
        """Verify Section 11 Right to Access Personal Data returns complete profile."""
        uid, uphone, passenger_token = self._create_user("Privacy Conscious User")
        res = self.client.get(
            "/api/v1/auth/data/export",
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["statutory_act"], "Digital Personal Data Protection Act, 2023")
        self.assertEqual(data["section"], "Section 11 (Right to Access Personal Data)")
        self.assertEqual(data["profile"]["user_id"], uid)
        self.assertEqual(data["profile"]["phone"], uphone)

    def test_dpdp_act_section_12_data_erasure(self):
        """Verify Section 12 Right to Erasure anonymizes PII and deactivates account."""
        uid, _, passenger_token = self._create_user("User Requesting Erasure")
        res = self.client.post(
            "/api/v1/auth/data/erasure",
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["status"], "DATA_ERASED")
        self.assertEqual(data["section"], "Section 12 (Right to Erasure)")

        # Verify erased user cannot authenticate on active endpoints
        me_res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {passenger_token}"},
        )
        self.assertEqual(me_res.status_code, 403)

    # -------------------------------------------------------------------------
    # 5. Non-Commercial Carpooling Limits (Motor Vehicles Act Section 66)
    # -------------------------------------------------------------------------
    def test_non_commercial_cost_sharing_cap(self):
        """Verify standard corridor fare is locked to ₹310 with zero surge."""
        res = self.client.get("/api/v1/rides/corridor/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["standard_fare_inr"], 310)
        self.assertEqual(data["surge_multiplier"], 1.0)
        self.assertEqual(data["driver_cost_share_inr"], 290)
        self.assertEqual(data["platform_fee_inr"], 20)


if __name__ == "__main__":
    unittest.main()
