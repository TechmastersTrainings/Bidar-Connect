from typing import Optional
from datetime import datetime, timezone, timedelta
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from apps.backend.app.repositories.base import BaseRepository
from apps.backend.app.models.booking import Booking, BookingStatusHistory
from apps.backend.app.models.ride import Ride, RideSeatInventory


class SeatInsufficientException(Exception):
    def __init__(self, requested: int, available: int):
        super().__init__(f"Requested {requested} seats, but only {available} available.")
        self.requested = requested
        self.available = available


class BookingRepository(BaseRepository[Booking]):
    def __init__(self):
        super().__init__(Booking)

    async def get_by_reference_code(self, session: AsyncSession, reference_code: str) -> Optional[Booking]:
        stmt = select(Booking).where(Booking.reference_code == reference_code)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def reserve_seats_atomic(
        self,
        session: AsyncSession,
        ride_id: str,
        passenger_id: str,
        requested_seats: int,
        pickup_landmark: str,
        drop_landmark: str,
        fare_per_seat: float,
        commission_per_seat: float,
        commission_rule_id: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Booking:
        """
        ATOMIC SEAT RESERVATION WITH ROW-LEVEL LOCKING.
        Uses `with_for_update()` on RideSeatInventory to eliminate race conditions.
        """
        # 1. Idempotency Check
        if idempotency_key:
            stmt = select(Booking).where(Booking.idempotency_key == idempotency_key)
            existing = (await session.execute(stmt)).scalars().first()
            if existing:
                return existing

        # 2. Acquire exclusive pessimistic lock on the ride's seat inventory
        stmt_inventory = (
            select(RideSeatInventory)
            .where(RideSeatInventory.ride_id == ride_id)
            .with_for_update()
        )
        inventory = (await session.execute(stmt_inventory)).scalars().first()
        if not inventory:
            raise ValueError(f"Seat inventory record not found for ride {ride_id}")

        # 3. Check seat availability under lock
        if inventory.available_seats < requested_seats:
            raise SeatInsufficientException(requested=requested_seats, available=inventory.available_seats)

        # 4. Atomic decrement
        inventory.available_seats -= requested_seats
        inventory.reserved_seats += requested_seats
        inventory.version_lock += 1

        # 5. Snapshot financials
        total_fare = fare_per_seat * requested_seats
        total_commission = commission_per_seat * requested_seats
        driver_payable = total_fare - total_commission

        # 6. Generate human-readable reference code
        ref_code = f"BC-{datetime.now(timezone.utc).strftime('%Y%m')}-{random.randint(1000, 9999)}"
        hold_time = datetime.now(timezone.utc) + timedelta(minutes=10)

        booking = Booking(
            reference_code=ref_code,
            ride_id=ride_id,
            passenger_id=passenger_id,
            pickup_landmark=pickup_landmark,
            drop_landmark=drop_landmark,
            seats_booked=requested_seats,
            fare_per_seat=fare_per_seat,
            total_fare=total_fare,
            commission_amount=total_commission,
            driver_payable=driver_payable,
            commission_rule_id=commission_rule_id,
            booking_status="CONFIRMED",
            reserved_until=hold_time,
            idempotency_key=idempotency_key
        )
        session.add(booking)
        await session.flush()

        # Record history audit
        history = BookingStatusHistory(
            booking_id=booking.id,
            from_status="NONE",
            to_status="CONFIRMED",
            reason="Instant seat reservation confirmed"
        )
        session.add(history)
        await session.flush()

        return booking

