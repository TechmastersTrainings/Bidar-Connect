import unittest
from fastapi.testclient import TestClient
from apps.backend.app.main import app


class TestBidarConnectAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import asyncio
        from apps.backend.app.database.session import engine
        from apps.backend.app.database.base import Base

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        asyncio.run(init_db())
        cls.client = TestClient(app)

    def setUp(self):
        from apps.backend.tests.fixtures import seed_test_fixtures
        seed_test_fixtures()

    @classmethod
    def tearDownClass(cls):
        from apps.backend.tests.fixtures import clear_test_fixtures
        clear_test_fixtures()

    def test_01_root_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["status"], "healthy")
        self.assertEqual(json_data["data"]["version"], "1.0.0")

    def test_02_api_v1_health(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("Bidar ⇄ Hyderabad", json_data["data"]["corridor"])

    def test_03_route_pricing(self):
        response = self.client.get("/api/v1/pricing/routes")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        routes = json_data["data"]
        bidar_hyd = next(r for r in routes if r["origin_city"] == "Bidar" and r["destination_city"] == "Hyderabad")
        self.assertEqual(bidar_hyd["fare_per_seat"], 310.00)
        self.assertIn("New Bus Stand", bidar_hyd["pickup_points"])

    def test_04_ride_search(self):
        response = self.client.get("/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=2")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertGreaterEqual(len(json_data["data"]), 1)
        ride = json_data["data"][0]
        self.assertEqual(ride["origin_city"], "Bidar")
        self.assertEqual(ride["destination_city"], "Hyderabad")
        self.assertEqual(ride["fare_per_seat"], 310.00)
        self.assertGreaterEqual(ride["available_seats"], 2)

    def test_05_booking_initiation_and_fare_snapshot(self):
        # Search ride first
        search_resp = self.client.get("/api/v1/rides/search?origin_city=Bidar&destination_city=Hyderabad&seats=2")
        ride_id = search_resp.json()["data"][0]["ride_id"]

        # Initiate booking
        payload = {
            "ride_id": ride_id,
            "passenger_id": "pas_user_991",
            "passenger_name": "Test Passenger",
            "passenger_phone": "+919876543210",
            "requested_seats": 2,
            "pickup_point": "New Bus Stand, Bidar",
            "drop_point": "Gachibowli DLF, Hyderabad"
        }
        booking_resp = self.client.post("/api/v1/bookings/initiate", json=payload)
        self.assertEqual(booking_resp.status_code, 201)
        bkg_data = booking_resp.json()["data"]
        self.assertEqual(bkg_data["seats_booked"], 2)
        self.assertEqual(bkg_data["fare_snapshot"]["fare_per_seat"], 310.00)
        self.assertEqual(bkg_data["fare_snapshot"]["total_fare"], 620.00)
        self.assertEqual(bkg_data["fare_snapshot"]["company_commission"], 20.00)
        self.assertEqual(bkg_data["fare_snapshot"]["driver_payable"], 600.00)
        self.assertEqual(bkg_data["booking_status"], "CONFIRMED")


if __name__ == "__main__":
    unittest.main()
