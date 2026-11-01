from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from apps.backend.app.repositories.booking_repository import BookingRepository, SeatInsufficientException
from apps.backend.app.services.pricing_service import PricingService
from apps.backend.app.models.booking import Booking


class BookingService:
    def __init__(self):
        self.booking_repo = BookingRepository()
        self.pricing_service = PricingService()

    async def create_booking_reservation(
        self,
        session: AsyncSession,
        ride_id: str,
        passenger_id: str,
        requested_seats: int,
        pickup_landmark: str,
        drop_landmark: str,
        origin_city: str = "Bidar",
        destination_city: str = "Hyderabad",
        idempotency_key: Optional[str] = None
    ) -> Booking:
        """
        Coordinates pricing snapshotting and atomic seat reservation under a single transaction.
        """
        pricing = await self.pricing_service.get_applicable_fare(session, origin_city, destination_city)

        return await self.booking_repo.reserve_seats_atomic(
            session=session,
            ride_id=ride_id,
            passenger_id=passenger_id,
            requested_seats=requested_seats,
            pickup_landmark=pickup_landmark,
            drop_landmark=drop_landmark,
            fare_per_seat=pricing["fare_per_seat"],
            commission_per_seat=pricing["commission_per_seat"],
            commission_rule_id=pricing["commission_rule_id"],
            idempotency_key=idempotency_key
        )
