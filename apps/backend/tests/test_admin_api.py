import unittest
import asyncio
import random
from datetime import date, timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, DriverProfile, PassengerProfile
from apps.backend.app.api.v1.pricing import ACTIVE_ROUTE_PRICES


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestAdminApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def _create_user(self, name: str, is_admin: bool = False, is_driver: bool = False) -> tuple[str, str]:
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

                if is_driver:
                    dp = DriverProfile(
                        user_id=user.id,
                        licence_number=f"KA38{random.randint(10000000, 99999999)}",
                        licence_expiry=date.today() + timedelta(days=365),
                        licence_document_id="doc_lic_adm",
                        is_verified=False,
                        total_completed_trips=2,
                        average_rating=4.8,
                    )
                    session.add(dp)

                await session.commit()
                return user.id

        user_id = self.loop.run_until_complete(do_create())
        roles = ["PASSENGER"]
        if is_driver:
            roles.append("DRIVER")
        if is_admin:
            roles.extend(["ADMIN", "SUPER_ADMIN"])

        token = create_access_token(
            subject=user_id,
            claims={"phone": phone, "roles": roles, "is_admin": is_admin, "is_driver": is_driver},
        )
        return user_id, token

    def test_admin_metrics_retrieval(self):
        """Verifies that an administrator can access executive metrics."""
        _, admin_token = self._create_user("Super Administrator", is_admin=True)

        resp = self.client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertIn("gross_booking_value", data)
        self.assertIn("net_platform_commission", data)
        self.assertIn("active_published_rides", data)
        self.assertIn("total_registered_users", data)

    def test_admin_users_list_and_search(self):
        """Verifies user directory listing, search, and role filtering."""
        _, admin_token = self._create_user("Admin Listing Tester", is_admin=True)
        self._create_user("Specific Target User", is_driver=True)

        # 1. List all
        resp = self.client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(resp.status_code, 200)
        users = resp.json()["data"]
        self.assertGreaterEqual(len(users), 1)

        # 2. Search by query
        search_resp = self.client.get(
            "/api/v1/admin/users?query=Specific+Target",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(search_resp.status_code, 200)
        matched = search_resp.json()["data"]
        self.assertTrue(any("Specific Target" in u["full_name"] for u in matched))

    def test_admin_user_suspend_and_unsuspend(self):
        """Verifies that admin can suspend a user, which denies their token access immediately."""
        _, admin_token = self._create_user("Governance Admin", is_admin=True)
        victim_id, victim_token = self._create_user("Rule Breaker Passenger")

        # 1. Suspend account
        susp_resp = self.client.post(
            f"/api/v1/admin/users/{victim_id}/suspend",
            json={"reason": "Safety policy violation on corridor ride."},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(susp_resp.status_code, 200)
        self.assertTrue(susp_resp.json()["data"]["is_suspended"])

        # 2. Victim attempts calling authenticated endpoint -> 403 Forbidden
        pas_resp = self.client.get(
            "/api/v1/passenger/profile",
            headers={"Authorization": f"Bearer {victim_token}"},
        )
        self.assertEqual(pas_resp.status_code, 403)
        err_msg = pas_resp.json().get("error", {}).get("message", "") or pas_resp.json().get("detail", "")
        self.assertIn("suspended", err_msg.lower())

        # 3. Unsuspend account
        unsusp_resp = self.client.post(
            f"/api/v1/admin/users/{victim_id}/unsuspend",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(unsusp_resp.status_code, 200)
        self.assertFalse(unsusp_resp.json()["data"]["is_suspended"])

    def test_admin_kyc_review_approve_and_reject(self):
        """Verifies driver KYC inspection queue and review action."""
        _, admin_token = self._create_user("KYC Inspector Admin", is_admin=True)
        driver_id, _ = self._create_user("Pending Verification Driver", is_driver=True)

        # 1. Fetch KYC Queue
        queue_resp = self.client.get("/api/v1/admin/kyc-queue", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(queue_resp.status_code, 200)
        queue = queue_resp.json()["data"]
        self.assertGreaterEqual(len(queue), 1)

        # 2. Approve driver KYC
        appr_resp = self.client.post(
            f"/api/v1/admin/kyc-queue/{driver_id}/review",
            json={"action": "APPROVE"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(appr_resp.status_code, 200)
        self.assertTrue(appr_resp.json()["data"]["is_verified"])

    def test_admin_pricing_and_commission_update(self):
        """Verifies that admin can update fixed corridor rates and platform commission."""
        _, admin_token = self._create_user("Pricing Controller Admin", is_admin=True)

        # 1. Get pricing
        price_resp = self.client.get("/api/v1/admin/pricing", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(price_resp.status_code, 200)

        # 2. Update corridor rate
        update_resp = self.client.put(
            "/api/v1/admin/pricing/route_bidar_hyderabad",
            json={"fare_per_seat": 320.0},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["data"]["new_fare"], 320.0)

        # Reset back to 310.0 for invariants
        self.client.put(
            "/api/v1/admin/pricing/route_bidar_hyderabad",
            json={"fare_per_seat": 310.0},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        # 3. Update commission fee
        comm_resp = self.client.put(
            "/api/v1/admin/pricing/commission",
            json={"fixed_fee_per_seat": 25.0, "description": "Updated corridor maintenance commission"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(comm_resp.status_code, 200)
        self.assertEqual(comm_resp.json()["data"]["fixed_fee_per_seat"], 25.0)

        # Reset back to 20.0
        self.client.put(
            "/api/v1/admin/pricing/commission",
            json={"fixed_fee_per_seat": 20.0},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    def test_admin_audit_logs(self):
        """Verifies that admin actions generate immutable audit logs."""
        from apps.backend.app.api.v1.admin import log_admin_action
        log_admin_action("CORRIDOR_INITIALIZED", "System Administrator", "Route", "route_b2h_direct", "Corridor fixed pricing.")
        log_admin_action("COMMISSION_POLICY_SET", "System Administrator", "CommissionRule", "comm_fixed_v1", "Platform commission fixed.")
        _, admin_token = self._create_user("Audit Log Admin", is_admin=True)

        log_resp = self.client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(log_resp.status_code, 200)
        logs = log_resp.json()["data"]
        self.assertGreaterEqual(len(logs), 2)
        self.assertIn("action", logs[0])
        self.assertIn("actor_name", logs[0])

    def test_non_admin_forbidden_rbac(self):
        """Verifies that passengers and drivers are strictly rejected with 403 Forbidden from admin endpoints."""
        _, passenger_token = self._create_user("Normal Passenger")
        _, driver_token = self._create_user("Normal Driver", is_driver=True)

        # Passenger rejected
        p_resp = self.client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {passenger_token}"})
        self.assertEqual(p_resp.status_code, 403)

        # Driver rejected
        d_resp = self.client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {driver_token}"})
        self.assertEqual(d_resp.status_code, 403)


if __name__ == "__main__":
    unittest.main()
