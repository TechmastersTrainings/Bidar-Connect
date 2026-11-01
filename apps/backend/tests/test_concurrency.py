import unittest
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from apps.backend.app.models import (
    Base,
    User,
    Vehicle,
    City,
    Route,
    Ride,
    RideSeatInventory,
    Booking,
)
from apps.backend.app.repositories.booking_repository import (
    BookingRepository,
    SeatInsufficientException,
)


class TestConcurrencyAndSeatLocking(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            echo=False,
            future=True
        )
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

        # Seed initial ride with exactly 1 available seat
        async with self.session_factory() as session:
            driver = User(phone="+919999900001", full_name="Driver Test", is_driver=True)
            pas1 = User(phone="+919999900002", full_name="Passenger One")
            pas2 = User(phone="+919999900003", full_name="Passenger Two")
            session.add_all([driver, pas1, pas2])
            await session.flush()

            self.driver_id = driver.id
            self.pas1_id = pas1.id
            self.pas2_id = pas2.id

            vehicle = Vehicle(
                driver_id=driver.id,
                make="Maruti",
                model="Dzire",
                registration_number="KA 38 XX 9999",
                color="White",
                year=2022,
                fuel_type="CNG"
            )
            city_b = City(name="Bidar_Test", state="KA")
            city_h = City(name="Hyd_Test", state="TS")
            session.add_all([vehicle, city_b, city_h])
            await session.flush()

            route = Route(origin_city_id=city_b.id, destination_city_id=city_h.id, distance_km=140)
            session.add(route)
            await session.flush()

            ride = Ride(
                driver_id=driver.id,
                vehicle_id=vehicle.id,
                route_id=route.id,
                departure_time=datetime.now(timezone.utc) + timedelta(hours=4),
                total_offered_seats=1,
                fare_per_seat_snapshot=310.00
            )
            session.add(ride)
            await session.flush()
            self.ride_id = ride.id

            # Seat inventory with EXACTLY 1 available seat
            inventory = RideSeatInventory(
                ride_id=ride.id,
                total_capacity=1,
                available_seats=1,
                reserved_seats=0
            )
            session.add(inventory)
            await session.commit()

        self.booking_repo = BookingRepository()

    async def asyncTearDown(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_01_single_seat_reservation_success(self):
        async with self.session_factory() as session:
            booking = await self.booking_repo.reserve_seats_atomic(
                session=session,
                ride_id=self.ride_id,
                passenger_id=self.pas1_id,
                requested_seats=1,
                pickup_landmark="New Bus Stand",
                drop_landmark="Miyapur",
                fare_per_seat=310.00,
                commission_per_seat=10.00
            )
            await session.commit()

            self.assertIsNotNone(booking.reference_code)
            self.assertEqual(booking.seats_booked, 1)
            self.assertEqual(float(booking.total_fare), 310.00)
            self.assertEqual(float(booking.driver_payable), 300.00)
            self.assertEqual(float(booking.commission_amount), 10.00)

            # Assert inventory decremented to 0
            stmt = select(RideSeatInventory).where(RideSeatInventory.ride_id == self.ride_id)
            inv = (await session.execute(stmt)).scalars().first()
            self.assertEqual(inv.available_seats, 0)
            self.assertEqual(inv.reserved_seats, 1)

    async def test_02_rejection_when_seats_exhausted(self):
        # First booking takes the only available seat
        async with self.session_factory() as session:
            await self.booking_repo.reserve_seats_atomic(
                session=session,
                ride_id=self.ride_id,
                passenger_id=self.pas1_id,
                requested_seats=1,
                pickup_landmark="New Bus Stand",
                drop_landmark="Miyapur",
                fare_per_seat=310.00,
                commission_per_seat=10.00
            )
            await session.commit()

        # Second booking attempts to reserve the exhausted seat
        async with self.session_factory() as session:
            with self.assertRaises(SeatInsufficientException) as ctx:
                await self.booking_repo.reserve_seats_atomic(
                    session=session,
                    ride_id=self.ride_id,
                    passenger_id=self.pas2_id,
                    requested_seats=1,
                    pickup_landmark="New Bus Stand",
                    drop_landmark="Miyapur",
                    fare_per_seat=310.00,
                    commission_per_seat=10.00
                )
            self.assertEqual(ctx.exception.available, 0)
            self.assertEqual(ctx.exception.requested, 1)

    async def test_03_idempotency_key_deduplication(self):
        async with self.session_factory() as session:
            key = "idemp_test_key_12345"

            # Initial call
            b1 = await self.booking_repo.reserve_seats_atomic(
                session=session,
                ride_id=self.ride_id,
                passenger_id=self.pas1_id,
                requested_seats=1,
                pickup_landmark="New Bus Stand",
                drop_landmark="Miyapur",
                fare_per_seat=310.00,
                commission_per_seat=10.00,
                idempotency_key=key
            )
            await session.commit()

            # Retry call with exact same idempotency key
            b2 = await self.booking_repo.reserve_seats_atomic(
                session=session,
                ride_id=self.ride_id,
                passenger_id=self.pas1_id,
                requested_seats=1,
                pickup_landmark="New Bus Stand",
                drop_landmark="Miyapur",
                fare_per_seat=310.00,
                commission_per_seat=10.00,
                idempotency_key=key
            )

            # Must return the same booking record without raising SeatInsufficientException
            self.assertEqual(b1.id, b2.id)
            self.assertEqual(b1.reference_code, b2.reference_code)


if __name__ == "__main__":
    unittest.main()

