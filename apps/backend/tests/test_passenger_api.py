import unittest
import asyncio
import random
from datetime import timedelta
from fastapi.testclient import TestClient

from apps.backend.app.main import app
from apps.backend.app.core.security import create_access_token
from apps.backend.app.database.session import engine, async_session_factory
from apps.backend.app.database.base import Base
from apps.backend.app.models.user import User, PassengerProfile, EmergencyContact


def random_phone() -> str:
    return f"9{random.randint(100000000, 999999999)}"


class TestPassengerApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

        async def init_db():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        cls.loop.run_until_complete(init_db())

    def _create_user(self, name: str) -> tuple[str, str]:
        phone = f"+91{random_phone()}"
        async def do_create():
            async with async_session_factory() as session:
                user = User(
                    phone=phone,
                    full_name=name,
                    is_passenger=True,
                    is_active=True,
                    is_suspended=False,
                )
                session.add(user)
                await session.flush()
                prof = PassengerProfile(user_id=user.id, preferred_pickup_landmark="New Bus Stand")
                session.add(prof)
                await session.commit()
                return user.id

        user_id = self.loop.run_until_complete(do_create())
        token = create_access_token(
            subject=user_id,
            claims={"phone": phone, "roles": ["PASSENGER"], "is_passenger": True},
        )
        return user_id, token

    def test_booking_initiation_and_my_bookings_flow(self):
        """Verifies booking initiation, identity attachment, and retrieval under /bookings/my."""
        user_id, token = self._create_user("Ganesh Bidar")

        # 1. Initiate booking with auth token
        init_resp = self.client.post(
            "/api/v1/bookings/initiate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "ride_id": "ride_b2h_001",
                "passenger_name": "Ganesh Bidar",
                "passenger_phone": "+919876543210",
                "requested_seats": 1,
                "pickup_point": "New Bus Stand, Bidar",
                "drop_point": "Gachibowli DLF, Hyderabad",
            },
        )
        self.assertEqual(init_resp.status_code, 201)
        booking = init_resp.json()["data"]
        booking_id = booking["booking_id"]
        self.assertEqual(booking["passenger"]["passenger_id"], user_id)
        self.assertEqual(booking["seats_booked"], 1)

        # 2. Check /bookings/my
        my_resp = self.client.get(
            "/api/v1/bookings/my",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(my_resp.status_code, 200)
        data = my_resp.json()["data"]
        self.assertTrue(len(data["upcoming"]) >= 1)
        self.assertEqual(data["upcoming"][0]["booking_id"], booking_id)

    def test_booking_anti_idor_protection(self):
        """User B cannot view or cancel User A's booking."""
        user_a_id, token_a = self._create_user("User A")
        user_b_id, token_b = self._create_user("User B")

        # User A creates a booking
        init_resp = self.client.post(
            "/api/v1/bookings/initiate",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "ride_id": "ride_b2h_002",
                "passenger_name": "User A",
                "passenger_phone": "+919876543210",
                "requested_seats": 1,
                "pickup_point": "Mailoor Cross",
                "drop_point": "Miyapur",
            },
        )
        booking_id = init_resp.json()["data"]["booking_id"]

        # User B attempts to access booking -> 403 Forbidden
        view_resp = self.client.get(
            f"/api/v1/bookings/{booking_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(view_resp.status_code, 403)
        self.assertIn("Access denied", view_resp.json()["error"]["message"])

        # User B attempts to cancel booking -> 403 Forbidden
        cancel_resp = self.client.post(
            f"/api/v1/bookings/{booking_id}/cancel",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"cancellation_reason": "Malicious attempt"},
        )
        self.assertEqual(cancel_resp.status_code, 403)

    def test_booking_cancellation_releases_seats(self):
        """Owner cancelling booking marks it CANCELLED and releases seats."""
        user_id, token = self._create_user("Cancellation Tester")

        # Book seat
        init_resp = self.client.post(
            "/api/v1/bookings/initiate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "ride_id": "ride_b2h_002",
                "passenger_name": "Tester",
                "passenger_phone": "+919876543210",
                "requested_seats": 1,
                "pickup_point": "Mailoor Cross",
                "drop_point": "Miyapur",
            },
        )
        booking_id = init_resp.json()["data"]["booking_id"]

        # Cancel
        cancel_resp = self.client.post(
            f"/api/v1/bookings/{booking_id}/cancel",
            headers={"Authorization": f"Bearer {token}"},
            json={"cancellation_reason": "Trip rescheduled"},
        )
        self.assertEqual(cancel_resp.status_code, 200)
        cancelled_data = cancel_resp.json()["data"]
        self.assertEqual(cancelled_data["booking_status"], "CANCELLED")
        self.assertIsNotNone(cancelled_data.get("cancelled_at"))

    def test_passenger_profile_and_emergency_contacts(self):
        """Test profile update and adding safety emergency contacts."""
        user_id, token = self._create_user("Safety Conscious")

        # 1. Update preferences
        update_resp = self.client.put(
            "/api/v1/passenger/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "preferred_pickup_landmark": "Near Bidar Fort Gate",
                "medical_emergency_notes": "Carries asthma inhaler",
            },
        )
        self.assertEqual(update_resp.status_code, 200)
        p_data = update_resp.json()["data"]
        self.assertEqual(p_data["preferred_pickup_landmark"], "Near Bidar Fort Gate")
        self.assertEqual(p_data["medical_emergency_notes"], "Carries asthma inhaler")

        # 2. Add emergency contact
        contact_resp = self.client.post(
            "/api/v1/passenger/emergency-contacts",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Basavaraj Patil",
                "phone": "+919448811223",
                "relationship_type": "Father",
            },
        )
        self.assertEqual(contact_resp.status_code, 200)
        c_data = contact_resp.json()["data"]
        self.assertEqual(c_data["name"], "Basavaraj Patil")
        self.assertEqual(c_data["relationship_type"], "Father")

        # 3. Verify in full profile
        prof_resp = self.client.get(
            "/api/v1/passenger/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(prof_resp.status_code, 200)
        contacts = prof_resp.json()["data"]["emergency_contacts"]
        self.assertTrue(len(contacts) >= 1)
        self.assertEqual(contacts[0]["name"], "Basavaraj Patil")


if __name__ == "__main__":
    unittest.main()

