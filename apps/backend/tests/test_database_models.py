import unittest
import asyncio
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from apps.backend.app.models import (
    Base,
    User,
    DriverProfile,
    Vehicle,
    VehicleDocument,
    City,
    Route,
    RoutePrice,
    CommissionRule,
    Ride,
    RideSeatInventory,
    Booking,
    Payment,
    LedgerEntry,
)


class TestDatabaseModels(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an isolated in-memory SQLite database for testing
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

    async def asyncTearDown(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_01_user_and_dual_role_creation(self):
        async with self.session_factory() as session:
            user = User(
                phone="+919876543210",
                email="shiva@example.com",
                full_name="Shiva Bhalke",
                is_passenger=True,
                is_driver=True
            )
            session.add(user)
            await session.commit()

            # Verify retrieval
            stmt = select(User).where(User.phone == "+919876543210")
            fetched = (await session.execute(stmt)).scalars().first()
            self.assertIsNotNone(fetched)
            self.assertEqual(fetched.full_name, "Shiva Bhalke")
            self.assertTrue(fetched.is_passenger)
            self.assertTrue(fetched.is_driver)

    async def test_02_unique_phone_constraint(self):
        async with self.session_factory() as session:
            user1 = User(phone="+919876543210", full_name="User One")
            session.add(user1)
            await session.commit()

            # Attempt duplicate phone insertion
            user2 = User(phone="+919876543210", full_name="User Two")
            session.add(user2)
            with self.assertRaises(IntegrityError):
                await session.commit()

    async def test_03_driver_and_vehicle_relationship(self):
        async with self.session_factory() as session:
            driver = User(phone="+919876543211", full_name="Ramesh Driver", is_driver=True)
            session.add(driver)
            await session.flush()

            vehicle = Vehicle(
                driver_id=driver.id,
                make="Hyundai",
                model="Creta",
                registration_number="KA 38 M 5678",
                color="Silver",
                year=2023,
                fuel_type="DIESEL",
                passenger_capacity=4
            )
            session.add(vehicle)
            await session.commit()

            # Verify vehicle link
            stmt = select(Vehicle).where(Vehicle.registration_number == "KA 38 M 5678")
            fetched_veh = (await session.execute(stmt)).scalars().first()
            self.assertIsNotNone(fetched_veh)
            self.assertEqual(fetched_veh.driver_id, driver.id)

    async def test_04_route_pricing_and_commission_rules(self):
        async with self.session_factory() as session:
            city_b = City(name="Bidar", state="Karnataka")
            city_h = City(name="Hyderabad", state="Telangana")
            session.add_all([city_b, city_h])
            await session.flush()

            route = Route(
                origin_city_id=city_b.id,
                destination_city_id=city_h.id,
                distance_km=140
            )
            session.add(route)
            await session.flush()

            price = RoutePrice(
                route_id=route.id,
                origin_stop_name="New Bus Stand",
                destination_stop_name="Gachibowli DLF",
                fare_per_seat=310.00,
                currency="INR"
            )
            comm_rule = CommissionRule(
                rule_code="comm_v1_fixed",
                rule_type="FIXED_PER_SEAT",
                fixed_amount_per_seat=10.00
            )
            session.add_all([price, comm_rule])
            await session.commit()

            # Assert route pricing
            stmt = select(RoutePrice).where(RoutePrice.route_id == route.id)
            res = (await session.execute(stmt)).scalars().first()
            self.assertEqual(float(res.fare_per_seat), 310.00)

    async def test_05_immutable_double_entry_ledger(self):
        async with self.session_factory() as session:
            ledger_credit = LedgerEntry(
                transaction_code="TXN-202611-001",
                debit_account="PASSENGER_PAYABLE",
                credit_account="DRIVER_ESCROW",
                amount=600.00,
                currency="INR"
            )
            ledger_comm = LedgerEntry(
                transaction_code="TXN-202611-002",
                debit_account="PASSENGER_PAYABLE",
                credit_account="COMPANY_COMMISSION_REVENUE",
                amount=20.00,
                currency="INR"
            )
            session.add_all([ledger_credit, ledger_comm])
            await session.commit()

            stmt = select(LedgerEntry)
            entries = (await session.execute(stmt)).scalars().all()
            self.assertEqual(len(entries), 2)
            self.assertEqual(float(entries[0].amount), 600.00)
            self.assertEqual(float(entries[1].amount), 20.00)


if __name__ == "__main__":
    unittest.main()

