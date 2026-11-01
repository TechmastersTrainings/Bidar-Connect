from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from apps.backend.app.repositories.pricing_repository import PricingRepository


class PricingService:
    def __init__(self):
        self.pricing_repo = PricingRepository()

    async def get_applicable_fare(
        self,
        session: AsyncSession,
        origin_city: str,
        destination_city: str
    ) -> Dict[str, Any]:
        """
        Determines applicable seat fare and active commission rule.
        Falls back to baseline standard (₹310 route fare, ₹10 commission) if database route is unseeded.
        """
        price_record = await self.pricing_repo.get_route_price(session, origin_city, destination_city)
        comm_record = await self.pricing_repo.get_active_commission_rule(session)

        fare_per_seat = float(price_record.fare_per_seat) if price_record else 310.00
        commission_per_seat = float(comm_record.fixed_amount_per_seat) if comm_record else 10.00
        commission_rule_id = comm_record.id if comm_record else None

        return {
            "fare_per_seat": fare_per_seat,
            "commission_per_seat": commission_per_seat,
            "commission_rule_id": commission_rule_id
        }

