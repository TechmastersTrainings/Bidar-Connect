from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from apps.backend.app.models.user import User, DriverProfile, PassengerProfile
from apps.backend.app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_phone(self, db: AsyncSession, phone: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.phone == phone)
            .options(
                selectinload(User.driver_profile),
                selectinload(User.passenger_profile),
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_id_with_profiles(self, db: AsyncSession, user_id: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.driver_profile),
                selectinload(User.passenger_profile),
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_user_with_profiles(
        self,
        db: AsyncSession,
        phone: str,
        full_name: str,
        email: Optional[str] = None,
        is_passenger: bool = True,
        is_driver: bool = False,
        is_admin: bool = False,
    ) -> User:
        user = User(
            phone=phone,
            full_name=full_name,
            email=email,
            is_passenger=is_passenger,
            is_driver=is_driver,
            is_admin=is_admin,
            is_active=True,
            is_suspended=False,
        )
        db.add(user)
        await db.flush()

        if is_passenger:
            passenger_profile = PassengerProfile(user_id=user.id)
            db.add(passenger_profile)

        await db.flush()
        return user


user_repository = UserRepository()
