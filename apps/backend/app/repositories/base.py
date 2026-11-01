from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from apps.backend.app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async repository implementing standard CRUD and pagination."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get_by_id(self, session: AsyncSession, id: str) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def list_paginated(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        **filters: Any
    ) -> List[ModelType]:
        stmt = select(self.model)
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                stmt = stmt.where(getattr(self.model, field) == value)
        stmt = stmt.offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, session: AsyncSession, **filters: Any) -> int:
        stmt = select(func.count()).select_from(self.model)
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                stmt = stmt.where(getattr(self.model, field) == value)
        result = await session.execute(stmt)
        return result.scalar() or 0

    async def create(self, session: AsyncSession, entity: ModelType) -> ModelType:
        session.add(entity)
        await session.flush()
        return entity

    async def update(self, session: AsyncSession, entity: ModelType) -> ModelType:
        await session.flush()
        return entity

    async def delete(self, session: AsyncSession, entity: ModelType) -> None:
        await session.delete(entity)
        await session.flush()
