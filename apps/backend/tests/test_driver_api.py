import unittest
import asyncio
import random
from datetime import date, timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, DriverProfile
from apps.backend.app.models.vehicle import Vehicle


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestDriverApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def _create_user(self, name: str, is_driver: bool = True, is_verified: bool = True) -> tuple[str, str]:
        phone = f"+91{random_phone()}"
        async def do_create():
            async with async_session_factory() as session:
                user = User(
                    phone=phone,
                    full_name=name,
                    is_passenger=True,
                    is_driver=is_driver,
                    is_active=True,
                    is_suspended=False,
                )
                session.add(user)
                await session.flush()

                if is_driver:
                    prof = DriverProfile(
                        user_id=user.id,
                        licence_number=f"KA38{random.randint(100000, 999999)}",
                        licence_expiry=date.today() + timedelta(days=365),
                        licence_document_id="doc_lic_init",
                        is_verified=is_verified,
                        total_completed_trips=5,
                        average_rating=4.9,
                    )
                    session.add(prof)

                await session.commit()
                return user.id

        user_id = self.loop.run_until_complete(do_create())
        roles = ["PASSENGER"]
        if is_driver:
            roles.append("DRIVER")

        token = create_access_token(
            subject=user_id,
            claims={"phone": phone, "roles": roles, "is_driver": is_driver},
        )
        return user_id, token

    def test_driver_profile_and_onboarding(self):
        """Verifies driver profile retrieval and onboarding flow."""
        user_id, token = self._create_user("Anand Kulkarni", is_driver=False)

        # 1. Profile before onboarding
        resp = self.client.get("/api/v1/driver/profile", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertEqual(data["full_name"], "Anand Kulkarni")
        self.assertFalse(data["is_driver"])

        # 2. Submit onboarding with valid licence
        future_date = (date.today() + timedelta(days=730)).isoformat()
        lic_num = f"KA38{random.randint(10000000, 99999999)}"
        onboard_resp = self.client.post(
            "/api/v1/driver/onboard",
            json={
                "licence_number": lic_num,
                "licence_expiry": future_date,
                "licence_document_id": "doc_lic_anand",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(onboard_resp.status_code, 200)
        onboard_data = onboard_resp.json()["data"]
        self.assertTrue(onboard_data["is_driver"])
        self.assertTrue(onboard_data["is_verified"])
        self.assertEqual(onboard_data["licence_number"], lic_num)

    def test_driver_onboard_expired_licence_fails(self):
        """Verifies that onboarding with an expired driving licence is rejected with 400 Bad Request."""
        _, token = self._create_user("Expired Licence Driver", is_driver=False)
        past_date = (date.today() - timedelta(days=10)).isoformat()

        resp = self.client.post(
            "/api/v1/driver/onboard",
            json={
                "licence_number": "KA3820100000001",
                "licence_expiry": past_date,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 400)
        err_msg = resp.json().get("error", {}).get("message", "") or resp.json().get("detail", "")
        self.assertIn("expired", err_msg.lower())

    def test_payout_settings_update(self):
        """Verifies driver UPI ID and bank IFSC configuration."""
        _, token = self._create_user("Ramesh Payout Driver")

        resp = self.client.put(
            "/api/v1/driver/payout-settings",
            json={
                "payout_upi_id": "ramesh.patil@okhdfcbank",
                "payout_bank_account": "123456789012",
                "payout_ifsc": "hdfc0001234",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 200)

        # Verify profile reflection
        prof_resp = self.client.get("/api/v1/driver/profile", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(prof_resp.status_code, 200)
        prof = prof_resp.json()["data"]
        self.assertEqual(prof["payout_upi_id"], "ramesh.patil@okhdfcbank")
        self.assertEqual(prof["payout_ifsc"], "HDFC0001234")

    def test_driver_vehicles_registration_and_list(self):
        """Verifies vehicle registration, listing, and duplicate prevention."""
        _, token = self._create_user("Fleet Owner Driver")

        # 1. Register new vehicle
        reg_num = f"KA 38 X {random.randint(1000, 9999)}"
        reg_resp = self.client.post(
            "/api/v1/driver/vehicles",
            json={
                "make": "Toyota",
                "model": "Innova Crysta",
                "registration_number": reg_num,
                "color": "Garnet Red",
                "year": 2023,
                "fuel_type": "DIESEL",
                "passenger_capacity": 6,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(reg_resp.status_code, 201)
        veh_data = reg_resp.json()["data"]
        self.assertEqual(veh_data["make"], "Toyota")
        self.assertEqual(veh_data["registration_number"], reg_num)

        # 2. List vehicles
        list_resp = self.client.get("/api/v1/driver/vehicles", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(list_resp.status_code, 200)
        vehicles = list_resp.json()["data"]
        self.assertTrue(any(v["registration_number"] == reg_num for v in vehicles))

        # 3. Duplicate registration rejected with 409 Conflict
        dup_resp = self.client.post(
            "/api/v1/driver/vehicles",
            json={
                "make": "Toyota",
                "model": "Innova",
                "registration_number": reg_num,
                "color": "White",
                "year": 2021,
                "fuel_type": "DIESEL",
                "passenger_capacity": 6,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(dup_resp.status_code, 409)

    def test_driver_publish_ride_fixed_fare(self):
        """
        Verifies that driver can publish a ride and the fare is strictly auto-filled
        with the admin fixed price (₹310) for Bidar ⇄ Hyderabad.
        """
        user_id, token = self._create_user("Publisher Driver")

        pub_resp = self.client.post(
            "/api/v1/driver/rides",
            json={
                "origin_city": "Bidar",
                "destination_city": "Hyderabad",
                "departure_time": "2026-11-10T08:00:00+05:30",
                "pickup_point": "Shivaji Chowk, Bidar",
                "drop_point": "Miyapur Cross Roads, Hyderabad",
                "available_seats": 3,
                "vehicle_id": "veh_dummy_id",
                "driver_notes": "Comfortable AC travel.",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(pub_resp.status_code, 201)
        ride = pub_resp.json()["data"]
        self.assertEqual(ride["fare_per_seat"], 310.0)  # Invariant: Admin price locked
        self.assertEqual(ride["available_seats"], 3)
        self.assertEqual(ride["driver"]["driver_id"], user_id)

    def test_driver_manifest_and_anti_idor(self):
        """Verifies that driver can view passenger manifest and other drivers are rejected (Anti-IDOR)."""
        driver1_id, driver1_token = self._create_user("Driver 1")
        _, driver2_token = self._create_user("Driver 2")

        # 1. Driver 1 publishes a ride
        pub_resp = self.client.post(
            "/api/v1/driver/rides",
            json={
                "origin_city": "Bidar",
                "destination_city": "Hyderabad",
                "departure_time": "2026-11-12T10:00:00+05:30",
                "pickup_point": "Gandhi Gunj, Bidar",
                "drop_point": "Gachibowli DLF, Hyderabad",
                "available_seats": 4,
                "vehicle_id": "veh_test_1",
            },
            headers={"Authorization": f"Bearer {driver1_token}"},
        )
        self.assertEqual(pub_resp.status_code, 201)
        ride_id = pub_resp.json()["data"]["ride_id"]

        # 2. A passenger books a seat on this ride
        book_resp = self.client.post(
            "/api/v1/bookings/initiate",
            json={
                "ride_id": ride_id,
                "passenger_name": "Sunil Passenger",
                "passenger_phone": "+919876500001",
                "requested_seats": 2,
                "pickup_point": "Gandhi Gunj",
                "drop_point": "Gachibowli DLF",
            },
        )
        self.assertEqual(book_resp.status_code, 201)

        # 3. Driver 1 views passenger manifest -> Expect 200 with Sunil in manifest
        man_resp = self.client.get(
            f"/api/v1/driver/rides/{ride_id}/manifest",
            headers={"Authorization": f"Bearer {driver1_token}"},
        )
        self.assertEqual(man_resp.status_code, 200)
        manifest_data = man_resp.json()["data"]
        self.assertEqual(manifest_data["booked_seats"], 2)
        self.assertEqual(len(manifest_data["manifest"]), 1)
        self.assertEqual(manifest_data["manifest"][0]["passenger_name"], "Sunil Passenger")

        # 4. Driver 2 attempts to view Driver 1's manifest -> Expect 403 Forbidden (Anti-IDOR)
        unauth_resp = self.client.get(
            f"/api/v1/driver/rides/{ride_id}/manifest",
            headers={"Authorization": f"Bearer {driver2_token}"},
        )
        self.assertEqual(unauth_resp.status_code, 403)
        err_msg = unauth_resp.json().get("error", {}).get("message", "") or unauth_resp.json().get("detail", "")
        self.assertIn("unauthorized", err_msg.lower())

    def test_driver_ride_status_lifecycle_and_earnings(self):
        """Verifies journey status transitions and earnings summary retrieval."""
        driver_id, token = self._create_user("Journey Master Driver")

        # 1. Publish ride
        pub_resp = self.client.post(
            "/api/v1/driver/rides",
            json={
                "origin_city": "Hyderabad",
                "destination_city": "Bidar",
                "departure_time": "2026-11-15T15:00:00+05:30",
                "pickup_point": "Secunderabad Station",
                "drop_point": "Mailoor Cross, Bidar",
                "available_seats": 3,
                "vehicle_id": "veh_journey",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(pub_resp.status_code, 201)
        ride_id = pub_resp.json()["data"]["ride_id"]

        # 2. Advance status through lifecycle
        for next_status in ["EN_ROUTE", "TRIP_STARTED", "ARRIVED", "COMPLETED"]:
            stat_resp = self.client.post(
                f"/api/v1/driver/rides/{ride_id}/status",
                json={"status": next_status},
                headers={"Authorization": f"Bearer {token}"},
            )
            self.assertEqual(stat_resp.status_code, 200)
            self.assertEqual(stat_resp.json()["data"]["status"], next_status)

        # 3. Check earnings endpoint
        earn_resp = self.client.get("/api/v1/driver/earnings", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(earn_resp.status_code, 200)
        earn_data = earn_resp.json()["data"]
        self.assertGreater(earn_data["total_gross_earnings"], 0)
        self.assertGreater(earn_data["total_platform_commission"], 0)
        self.assertGreater(earn_data["total_net_payout"], 0)
        self.assertIn("recent_payouts", earn_data)


if __name__ == "__main__":
    unittest.main()
