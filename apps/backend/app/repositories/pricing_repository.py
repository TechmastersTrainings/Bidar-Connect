from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from apps.backend.app.repositories.base import BaseRepository
from apps.backend.app.models.route import RoutePrice, Route, City
from apps.backend.app.models.pricing import CommissionRule


class PricingRepository(BaseRepository[RoutePrice]):
    def __init__(self):
        super().__init__(RoutePrice)

    async def get_route_price(
        self,
        session: AsyncSession,
        origin_city_name: str,
        destination_city_name: str
    ) -> Optional[RoutePrice]:
        stmt = (
            select(RoutePrice)
            .join(Route, RoutePrice.route_id == Route.id)
            .join(City, Route.origin_city_id == City.id)
            .where(
                City.name.ilike(origin_city_name),
                RoutePrice.is_active == True
            )
        )
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_active_commission_rule(self, session: AsyncSession) -> Optional[CommissionRule]:
        stmt = select(CommissionRule).where(CommissionRule.is_active == True).limit(1)
        result = await session.execute(stmt)
        return result.scalars().first()

