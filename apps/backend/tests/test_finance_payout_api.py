import unittest
import asyncio
import random
import time
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, PassengerProfile, DriverProfile
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
from apps.backend.app.services.payment_gateway_adapter import get_payment_gateway
from apps.backend.app.services.ledger_service import LedgerService


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestFinanceAndPayoutApi(unittest.TestCase):
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
        return user_id, token

    def test_payment_order_creation_and_receipt(self):
        user_id, token = self._create_user("Passenger FinTester")
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test booking
        booking_id = f"bk_fin_{random.randint(1000, 9999)}"
        ACTIVE_BOOKINGS[booking_id] = {
            "booking_id": booking_id,
            "ride_id": "ride_b2h_001",
            "passenger_id": user_id,
            "passenger": {"passenger_id": user_id, "name": "Passenger FinTester"},
            "passenger_name": "Passenger FinTester",
            "passenger_phone": "+919999999999",
            "seats_booked": 2,
            "fare_per_seat": 310.0,
            "total_fare": 620.0,
            "company_commission": 40.0,
            "driver_payable": 580.0,
            "status": "INITIATED",
            "pickup_point": "Bidar Central Bus Stand",
            "drop_point": "Miyapur Metro Station",
            "reference_code": f"BC-{booking_id[:6].upper()}",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # 1. Create Payment Order
        res_order = self.client.post(
            "/api/v1/payments/create-order",
            headers=headers,
            json={"booking_id": booking_id, "payment_method": "UPI"},
        )
        self.assertEqual(res_order.status_code, 200, res_order.text)
        data = res_order.json()["data"]
        self.assertTrue(data["order_id"].startswith("order_mock_"))
        self.assertEqual(data["amount"], 620.0)
        self.assertEqual(data["currency"], "INR")
        self.assertIn("key_id", data)

    def test_payment_verification_and_double_entry_ledger(self):
        user_id, token = self._create_user("Verify FinTester")
        headers = {"Authorization": f"Bearer {token}"}

        booking_id = f"bk_vfy_{random.randint(1000, 9999)}"
        ACTIVE_BOOKINGS[booking_id] = {
            "booking_id": booking_id,
            "ride_id": "ride_b2h_001",
            "passenger_id": user_id,
            "passenger": {"passenger_id": user_id, "name": "Verify FinTester"},
            "passenger_name": "Verify FinTester",
            "seats_booked": 1,
            "fare_per_seat": 310.0,
            "total_fare": 310.0,
            "company_commission": 20.0,
            "driver_payable": 290.0,
            "status": "INITIATED",
            "pickup_point": "Bidar Central Bus Stand",
            "drop_point": "MGBS Hyderabad",
            "reference_code": f"BC-{booking_id[:6].upper()}",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Create Order
        res_order = self.client.post(
            "/api/v1/payments/create-order",
            headers=headers,
            json={"booking_id": booking_id},
        )
        order_data = res_order.json()["data"]
        order_id = order_data["order_id"]
        mock_payment_id = order_data["mock_payment_id"]
        mock_signature = order_data["mock_signature"]

        # Verify Payment with valid signature
        res_verify = self.client.post(
            "/api/v1/payments/verify",
            headers=headers,
            json={
                "booking_id": booking_id,
                "gateway_order_id": order_id,
                "gateway_payment_id": mock_payment_id,
                "gateway_signature": mock_signature,
            },
        )
        self.assertEqual(res_verify.status_code, 200, res_verify.text)
        v_data = res_verify.json()["data"]
        self.assertEqual(v_data["status"], "CAPTURED")
        self.assertEqual(v_data["amount"], 310.0)
        self.assertEqual(v_data["breakdown"]["company_commission"], 20.0)
        self.assertEqual(v_data["breakdown"]["driver_payable"], 290.0)

        # Confirm booking state transition
        self.assertEqual(ACTIVE_BOOKINGS[booking_id]["status"], "CONFIRMED")
        self.assertEqual(ACTIVE_BOOKINGS[booking_id]["payment_status"], "CAPTURED")

        # Fetch verified receipt
        res_rcpt = self.client.get(f"/api/v1/payments/receipt/{booking_id}", headers=headers)
        self.assertEqual(res_rcpt.status_code, 200)
        self.assertEqual(res_rcpt.json()["data"]["status"], "CAPTURED")

    def test_tampered_signature_rejection(self):
        user_id, token = self._create_user("Fraud FinTester")
        headers = {"Authorization": f"Bearer {token}"}

        booking_id = f"bk_fraud_{random.randint(1000, 9999)}"
        ACTIVE_BOOKINGS[booking_id] = {
            "booking_id": booking_id,
            "ride_id": "ride_b2h_001",
            "passenger_id": user_id,
            "passenger": {"passenger_id": user_id, "name": "Fraud FinTester"},
            "seats_booked": 1,
            "total_fare": 310.0,
            "status": "INITIATED",
        }

        # Attempt verification with fraudulent signature
        res_verify = self.client.post(
            "/api/v1/payments/verify",
            headers=headers,
            json={
                "booking_id": booking_id,
                "gateway_order_id": "order_mock_fake",
                "gateway_payment_id": "pay_mock_fake",
                "gateway_signature": "tampered_signature_hash_000000000000",
            },
        )
        self.assertEqual(res_verify.status_code, 400)
        err_msg = res_verify.json().get("error", {}).get("message") or res_verify.json().get("detail", "")
        self.assertIn("Invalid payment signature", err_msg)

    def test_payment_webhook_processing(self):
        gateway = get_payment_gateway()

        booking_id = f"bk_whk_{random.randint(1000, 9999)}"
        ACTIVE_BOOKINGS[booking_id] = {
            "booking_id": booking_id,
            "ride_id": "ride_b2h_001",
            "passenger_id": "usr_whk",
            "passenger": {"passenger_id": "usr_whk", "name": "Webhook Passenger"},
            "seats_booked": 1,
            "fare_per_seat": 310.0,
            "total_fare": 310.0,
            "company_commission": 20.0,
            "driver_payable": 290.0,
            "status": "INITIATED",
        }

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_mock_webhook_123",
                        "amount": 31000,
                        "currency": "INR",
                        "status": "captured",
                        "notes": {"booking_id": booking_id},
                    }
                }
            }
        }
        import json
        raw_body = json.dumps(payload).encode("utf-8")
        signature = gateway.generate_webhook_signature(raw_body)

        res = self.client.post(
            "/api/v1/payments/webhook",
            data=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": signature,
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        self.assertEqual(ACTIVE_BOOKINGS[booking_id]["status"], "CONFIRMED")

    def test_driver_payout_eligibility_and_safety_buffer(self):
        driver_id, d_token = self._create_user("Eligible Driver", is_driver=True)
        d_headers = {"Authorization": f"Bearer {d_token}"}

        ride_id = f"ride_pout_{random.randint(1000, 9999)}"
        ride_obj = {
            "ride_id": ride_id,
            "driver_id": driver_id,
            "origin_city": "Bidar",
            "destination_city": "Hyderabad",
            "pickup_point": "Bidar Central Bus Stand",
            "drop_point": "MGBS Hyderabad",
            "fare_per_seat": 310.0,
            "total_seats": 4,
            "available_seats": 2,
            "status": "EN_ROUTE",  # Not completed yet
            "completed_at": None,
        }
        SAMPLE_RIDES.append(ride_obj)

        # 1. Not completed -> Not eligible
        res_elig = self.client.get(f"/api/v1/payouts/rides/{ride_id}/eligibility", headers=d_headers)
        self.assertEqual(res_elig.status_code, 200)
        self.assertFalse(res_elig.json()["data"]["is_eligible"])

        # 2. Mark completed recently (within 5-minute buffer)
        ride_obj["status"] = "COMPLETED"
        ride_obj["completed_at"] = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()

        res_elig2 = self.client.get(f"/api/v1/payouts/rides/{ride_id}/eligibility", headers=d_headers)
        self.assertFalse(res_elig2.json()["data"]["buffer_satisfied"])
        self.assertGreater(res_elig2.json()["data"]["buffer_remaining_seconds"], 0)

        # 3. Attempt disbursement without override -> 422 Unprocessable Entity
        res_disb_blocked = self.client.post(
            f"/api/v1/payouts/rides/{ride_id}/disburse",
            headers=d_headers,
            json={"force_override_buffer": False},
        )
        self.assertEqual(res_disb_blocked.status_code, 422)
        err_msg = res_disb_blocked.json().get("error", {}).get("message") or res_disb_blocked.json().get("detail", "")
        self.assertIn("Safety hold buffer active", err_msg)

    def test_driver_payout_disbursement_and_bank_utr_settlement(self):
        driver_id, d_token = self._create_user("Settled Driver", is_driver=True)
        d_headers = {"Authorization": f"Bearer {d_token}"}

        ride_id = f"ride_settle_{random.randint(1000, 9999)}"
        ride_obj = {
            "ride_id": ride_id,
            "driver_id": driver_id,
            "origin_city": "Bidar",
            "destination_city": "Hyderabad",
            "pickup_point": "Bidar Central Bus Stand",
            "drop_point": "Miyapur Metro Station",
            "fare_per_seat": 310.0,
            "total_seats": 4,
            "available_seats": 1,
            "status": "COMPLETED",
            "completed_at": (datetime.now(timezone.utc) - timedelta(seconds=600)).isoformat(),  # > 5 mins
        }
        SAMPLE_RIDES.append(ride_obj)

        # Disburse with buffer satisfied
        res_disb = self.client.post(
            f"/api/v1/payouts/rides/{ride_id}/disburse",
            headers=d_headers,
            json={"force_override_buffer": False},
        )
        self.assertEqual(res_disb.status_code, 200, res_disb.text)
        p_data = res_disb.json()["data"]
        self.assertEqual(p_data["status"], "SETTLED")
        self.assertTrue(p_data["payout_reference_utr"].startswith("UTR_"))
        self.assertGreater(p_data["net_payable"], 0)

        # Check driver payouts query
        res_my = self.client.get("/api/v1/payouts/my-payouts", headers=d_headers)
        self.assertEqual(res_my.status_code, 200)
        self.assertTrue(any(p["ride_id"] == ride_id for p in res_my.json()["data"]))

    def test_admin_financial_summary_and_ledger_endpoints(self):
        admin_id, admin_token = self._create_user("Platform Finance Admin", is_admin=True)
        a_headers = {"Authorization": f"Bearer {admin_token}"}

        user_id, user_token = self._create_user("Regular Passenger")
        u_headers = {"Authorization": f"Bearer {user_token}"}

        # 1. Admin reads financial summary
        res_sum = self.client.get("/api/v1/payments/summary", headers=a_headers)
        self.assertEqual(res_sum.status_code, 200)
        s_data = res_sum.json()["data"]
        self.assertIn("total_collected_escrow", s_data)
        self.assertIn("total_disbursed_drivers", s_data)
        self.assertIn("total_company_revenue", s_data)
        self.assertIn("pending_driver_escrow", s_data)

        # 2. Admin reads double-entry immutable ledger
        res_led = self.client.get("/api/v1/payments/ledger", headers=a_headers)
        self.assertEqual(res_led.status_code, 200)
        self.assertIsInstance(res_led.json()["data"], list)

        # 3. Non-admin blocked from ledger endpoint -> 403 Forbidden
        res_blocked = self.client.get("/api/v1/payments/ledger", headers=u_headers)
        self.assertEqual(res_blocked.status_code, 403)

    def test_payout_request_and_admin_approval_lifecycle(self):
        driver_id, d_token = self._create_user("Lifecycle Driver", is_driver=True)
        d_headers = {"Authorization": f"Bearer {d_token}"}
        admin_id, a_token = self._create_user("Payout Admin", is_admin=True)
        a_headers = {"Authorization": f"Bearer {a_token}"}

        ride_id = f"ride_req_{random.randint(1000, 9999)}"
        ride_obj = {
            "ride_id": ride_id,
            "driver_id": driver_id,
            "driver": {"driver_id": driver_id, "name": "Lifecycle Driver", "phone": "+91 98450 12345"},
            "origin_city": "Bidar",
            "destination_city": "Hyderabad",
            "pickup_point": "Bidar Central Bus Stand",
            "drop_point": "Miyapur Metro Station",
            "fare_per_seat": 310.0,
            "total_seats": 4,
            "available_seats": 1,
            "status": "COMPLETED",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        SAMPLE_RIDES.append(ride_obj)

        # 1. Driver requests payout
        res_req = self.client.post(f"/api/v1/payouts/rides/{ride_id}/request", headers=d_headers)
        self.assertEqual(res_req.status_code, 200, res_req.text)
        req_data = res_req.json()["data"]
        self.assertEqual(req_data["status"], "PENDING_AUDIT")
        self.assertEqual(req_data["ride_id"], ride_id)
        self.assertGreater(req_data["net_payable"], 0)

        # 2. Admin retrieves requests
        res_admin_list = self.client.get("/api/v1/payouts/requests", headers=a_headers)
        self.assertEqual(res_admin_list.status_code, 200)
        found = any(r["ride_id"] == ride_id for r in res_admin_list.json()["data"])
        self.assertTrue(found)

        # 3. Admin approves immediately
        res_approve = self.client.post(f"/api/v1/payouts/requests/{ride_id}/approve", headers=a_headers)
        self.assertEqual(res_approve.status_code, 200, res_approve.text)
        app_data = res_approve.json()["data"]
        self.assertEqual(app_data["status"], "SETTLED")
        self.assertTrue(app_data["payout_reference_utr"].startswith("UTR_"))


if __name__ == "__main__":
    unittest.main()
