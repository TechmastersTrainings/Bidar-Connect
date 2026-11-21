import unittest
import asyncio
import random
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, PassengerProfile, DriverProfile
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_HOLDS, ACTIVE_BOOKINGS


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestSearchBookingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def setUp(self):
        from apps.backend.tests.fixtures import seed_test_fixtures
        seed_test_fixtures()

    @classmethod
    def tearDownClass(cls):
        from apps.backend.tests.fixtures import clear_test_fixtures
        clear_test_fixtures()

    def _create_user(self, name: str, is_driver: bool = False) -> tuple[str, str]:
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
                prof = PassengerProfile(user_id=user.id)
                session.add(prof)

                if is_driver:
                    dp = DriverProfile(
                        user_id=user.id,
                        licence_number=f"KA38{random.randint(10000000, 99999999)}",
                        licence_expiry=datetime.now(timezone.utc).date() + timedelta(days=365),
                        licence_document_id="doc_lic",
                        is_verified=True,
                        total_completed_trips=10,
                        average_rating=4.9,
                    )
                    session.add(dp)

                await session.commit()
                return user.id

        user_id = self.loop.run_until_complete(do_create())
        roles = ["PASSENGER"]
        if is_driver:
            roles.append("DRIVER")

        token = create_access_token(
            subject=user_id,
            claims={"phone": phone, "roles": roles, "is_passenger": True, "is_driver": is_driver},
        )
        return user_id, token

    def test_multi_criteria_search_filtering(self):
        """Verifies multi-criteria search by time window, fuel type, waypoint, and sorting."""
        # 1. Base corridor search
        resp = self.client.get("/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertGreaterEqual(len(data), 2)

        # 2. Time window: MORNING (05:00 - 11:59)
        morn_resp = self.client.get(
            "/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=1&time_window=MORNING"
        )
        self.assertEqual(morn_resp.status_code, 200)
        morn_rides = morn_resp.json()["data"]
        for r in morn_rides:
            hour = int(r["departure_time"].split("T")[1][:2])
            self.assertTrue(5 <= hour < 12)

        # 3. Fuel type filter: EV
        ev_resp = self.client.get(
            "/api/v1/rides/search?origin_city=Hyderabad&destination_city=Bidar&seats=1&fuel_type=EV"
        )
        self.assertEqual(ev_resp.status_code, 200)
        ev_rides = ev_resp.json()["data"]
        self.assertEqual(len(ev_rides), 1)
        self.assertEqual(ev_rides[0]["vehicle"]["fuel_type"], "EV")

        # 4. Waypoint search: Humnabad
        way_resp = self.client.get(
            "/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=1&pickup_point=Humnabad"
        )
        self.assertEqual(way_resp.status_code, 200)
        way_rides = way_resp.json()["data"]
        self.assertGreaterEqual(len(way_rides), 1)

        # 5. Sorting by rating_desc
        sort_resp = self.client.get(
            "/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=1&sort_by=rating_desc"
        )
        self.assertEqual(sort_resp.status_code, 200)
        sorted_rides = sort_resp.json()["data"]
        ratings = [r["driver"]["rating"] for r in sorted_rides]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_seat_hold_reservation_and_countdown(self):
        """Verifies temporary 10-minute hold reservation with seat decrement and countdown."""
        ride = next(r for r in SAMPLE_RIDES if r.get("status") == "SCHEDULED" and r["available_seats"] >= 2)
        initial_seats = ride["available_seats"]
        self.assertGreaterEqual(initial_seats, 2)

        # 1. Acquire 10-minute seat hold
        idempotency_key = f"idem_hold_{random.randint(100000, 999999)}"
        hold_resp = self.client.post(
            "/api/v1/bookings/hold",
            json={
                "ride_id": ride["ride_id"],
                "requested_seats": 2,
                "pickup_point": "New Bus Stand, Bidar",
                "drop_point": "Gachibowli DLF, Hyderabad",
                "passenger_name": "Kavita Patil",
                "passenger_phone": "+919876543210",
            },
            headers={"Idempotency-Key": idempotency_key},
        )
        self.assertEqual(hold_resp.status_code, 201)
        hold_data = hold_resp.json()["data"]
        hold_id = hold_data["hold_id"]
        self.assertEqual(hold_data["seats_held"], 2)
        self.assertEqual(hold_data["fare_per_seat"], 310.0)
        self.assertEqual(hold_data["total_fare"], 620.0)
        self.assertGreater(hold_data["seconds_remaining"], 550)

        # Verify seat inventory was decremented
        self.assertEqual(ride["available_seats"], initial_seats - 2)

        # 2. Idempotency check: same key returns existing hold
        retry_resp = self.client.post(
            "/api/v1/bookings/hold",
            json={
                "ride_id": ride["ride_id"],
                "requested_seats": 2,
                "pickup_point": "New Bus Stand, Bidar",
                "drop_point": "Gachibowli DLF, Hyderabad",
            },
            headers={"Idempotency-Key": idempotency_key},
        )
        self.assertIn(retry_resp.status_code, [200, 201])
        self.assertEqual(retry_resp.json()["data"]["hold_id"], hold_id)

        # 3. Check hold countdown status endpoint
        status_resp = self.client.get(f"/api/v1/bookings/hold/{hold_id}")
        self.assertEqual(status_resp.status_code, 200)
        self.assertGreater(status_resp.json()["data"]["seconds_remaining"], 0)

        # 4. Confirm held booking
        confirm_resp = self.client.post(f"/api/v1/bookings/hold/{hold_id}/confirm")
        self.assertEqual(confirm_resp.status_code, 201)
        bkg = confirm_resp.json()["data"]
        self.assertEqual(bkg["seats_booked"], 2)
        self.assertEqual(bkg["booking_status"], "CONFIRMED")
        self.assertIn("BC-", bkg["reference_code"])

        # Verify hold removed from active holds
        self.assertNotIn(hold_id, ACTIVE_HOLDS)

    def test_hold_auto_expiry_and_cleanup(self):
        """Verifies that expired holds are detected and seats are automatically released back."""
        ride = next(r for r in SAMPLE_RIDES if r.get("status") == "SCHEDULED" and r["available_seats"] >= 1)
        initial_seats = ride["available_seats"]

        # 1. Acquire hold
        hold_resp = self.client.post(
            "/api/v1/bookings/hold",
            json={
                "ride_id": ride["ride_id"],
                "requested_seats": 1,
                "pickup_point": "Mailoor Cross",
                "drop_point": "Miyapur X Roads",
            },
        )
        self.assertEqual(hold_resp.status_code, 201)
        hold_id = hold_resp.json()["data"]["hold_id"]
        self.assertEqual(ride["available_seats"], initial_seats - 1)

        # 2. Artificially simulate hold expiry (set reserved_until in the past)
        ACTIVE_HOLDS[hold_id]["reserved_until"] = (
            datetime.now(timezone.utc) - timedelta(minutes=5)
        ).isoformat()

        # 3. Trigger cleanup reaper
        clean_resp = self.client.post("/api/v1/bookings/cleanup-expired")
        self.assertEqual(clean_resp.status_code, 200)
        self.assertIn(hold_id, clean_resp.json()["data"]["reclaimed_ids"])

        # 4. Seats must be fully restored!
        self.assertEqual(ride["available_seats"], initial_seats)

    def test_tiered_cancellation_quotes_and_execution(self):
        """
        Verifies Tiered Cancellation Engine (Rule BR-REF-01):
        - > 2 hours: 100% full refund
        - <= 2 hours: 50% partial refund
        - Post-departure: 0% refund
        """
        user_id, token = self._create_user("Cancellation Tester")

        # 1. Create a booking > 2 hours in the future
        future_dep = (datetime.now(timezone.utc) + timedelta(hours=5)).isoformat()
        bkg_id = f"bkg_test_fut_{random.randint(1000, 9999)}"
        ACTIVE_BOOKINGS[bkg_id] = {
            "booking_id": bkg_id,
            "reference_code": "BC-TEST-001",
            "ride_id": SAMPLE_RIDES[0]["ride_id"],
            "passenger": {"passenger_id": user_id, "name": "Tester", "phone": "+919876543210"},
            "route": {
                "origin_city": "Bidar",
                "destination_city": "Hyderabad",
                "departure_time": future_dep,
                "pickup_point": "New Bus Stand",
                "drop_point": "Gachibowli DLF",
            },
            "seats_booked": 2,
            "fare_snapshot": {"total_fare": 620.0, "fare_per_seat": 310.0},
            "booking_status": "CONFIRMED",
            "payment_status": "CAPTURED",
        }

        # Quote for > 2 hours departure -> 100% refund
        q1_resp = self.client.get(
            f"/api/v1/bookings/{bkg_id}/cancellation-quote",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(q1_resp.status_code, 200)
        q1 = q1_resp.json()["data"]
        self.assertEqual(q1["cancellation_tier"], "FULL_REFUND")
        self.assertEqual(q1["refund_percentage"], 100)
        self.assertEqual(q1["refund_amount"], 620.0)
        self.assertEqual(q1["deduction_amount"], 0.0)

        # 2. Modify departure to 1 hour away (<= 2 hours) -> 50% refund
        ACTIVE_BOOKINGS[bkg_id]["route"]["departure_time"] = (
            datetime.now(timezone.utc) + timedelta(hours=1)
        ).isoformat()

        q2_resp = self.client.get(
            f"/api/v1/bookings/{bkg_id}/cancellation-quote",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(q2_resp.status_code, 200)
        q2 = q2_resp.json()["data"]
        self.assertEqual(q2["cancellation_tier"], "PARTIAL_REFUND")
        self.assertEqual(q2["refund_percentage"], 50)
        self.assertEqual(q2["refund_amount"], 310.0)
        self.assertEqual(q2["deduction_amount"], 310.0)

        # 3. Modify departure to 1 hour in the past (post-departure) -> 0% refund
        ACTIVE_BOOKINGS[bkg_id]["route"]["departure_time"] = (
            datetime.now(timezone.utc) - timedelta(hours=1)
        ).isoformat()

        q3_resp = self.client.get(
            f"/api/v1/bookings/{bkg_id}/cancellation-quote",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(q3_resp.status_code, 200)
        q3 = q3_resp.json()["data"]
        self.assertEqual(q3["cancellation_tier"], "NO_REFUND")
        self.assertEqual(q3["refund_percentage"], 0)
        self.assertEqual(q3["refund_amount"], 0.0)
        self.assertEqual(q3["deduction_amount"], 620.0)

        # 4. Execute cancellation and verify seat release
        initial_avail = SAMPLE_RIDES[0]["available_seats"]
        cancel_resp = self.client.post(
            f"/api/v1/bookings/{bkg_id}/cancel",
            json={"cancellation_reason": "Testing cancellation execution"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(cancel_resp.status_code, 200)
        cancelled = cancel_resp.json()["data"]
        self.assertEqual(cancelled["booking_status"], "CANCELLED")
        self.assertEqual(SAMPLE_RIDES[0]["available_seats"], initial_avail + 2)

    def test_driver_ride_cancellation_full_refund(self):
        """Verifies Rule BR-REF-02: Driver cancellation triggers 100% full refund to all passengers."""
        driver_id, driver_token = self._create_user("Cancelling Driver", is_driver=True)

        # 1. Driver publishes ride
        pub_resp = self.client.post(
            "/api/v1/driver/rides",
            json={
                "origin_city": "Bidar",
                "destination_city": "Hyderabad",
                "departure_time": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
                "pickup_point": "New Bus Stand",
                "drop_point": "Gachibowli DLF",
                "available_seats": 4,
                "vehicle_id": "veh_test_canc",
            },
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        self.assertEqual(pub_resp.status_code, 201)
        ride_id = pub_resp.json()["data"]["ride_id"]

        # 2. Two passengers book seats
        b1_resp = self.client.post(
            "/api/v1/bookings/initiate",
            json={
                "ride_id": ride_id,
                "passenger_name": "Passenger Alpha",
                "passenger_phone": "+919876500001",
                "requested_seats": 1,
                "pickup_point": "New Bus Stand",
                "drop_point": "Gachibowli DLF",
            },
        )
        self.assertEqual(b1_resp.status_code, 201)
        b1_id = b1_resp.json()["data"]["booking_id"]

        # 3. Driver cancels ride -> triggers automatic 100% refund
        canc_resp = self.client.post(
            f"/api/v1/driver/rides/{ride_id}/cancel",
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        self.assertEqual(canc_resp.status_code, 200)
        canc_data = canc_resp.json()["data"]
        self.assertEqual(canc_data["status"], "CANCELLED")
        self.assertGreaterEqual(canc_data["refunded_passengers_count"], 1)
        self.assertEqual(canc_data["total_refunded_amount"], 310.0)

        # 4. Verify passenger booking record status
        self.assertEqual(ACTIVE_BOOKINGS[b1_id]["booking_status"], "CANCELLED")
        self.assertEqual(ACTIVE_BOOKINGS[b1_id]["refund_amount"], 310.0)

    def test_public_corridor_summary_telemetry(self):
        """Phase 12: Verify public unauthenticated corridor telemetry and fare transparency."""
        res = self.client.get("/api/v1/rides/corridor/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["corridor_name"], "Bidar ⇄ Hyderabad Corridor")
        self.assertEqual(data["highway"], "NH 65")
        self.assertEqual(data["standard_fare_inr"], 310)
        self.assertEqual(data["driver_cost_share_inr"], 290)
        self.assertEqual(data["platform_fee_inr"], 20)
        self.assertEqual(data["surge_multiplier"], 1.0)
        self.assertGreaterEqual(len(data["waypoints"]), 6)
        self.assertIn("emergency_helpline", data)


if __name__ == "__main__":
    unittest.main()
