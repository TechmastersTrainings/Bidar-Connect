from typing import AsyncGenerator
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)
from apps.backend.app.core.config import settings

# Engine instantiation
def get_engine() -> AsyncEngine:
    db_url = settings.DATABASE_URL
    # Normalize sqlite async URL if testing locally
    if db_url.startswith("sqlite") and not db_url.startswith("sqlite+aiosqlite"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://")

    connect_args = {}
    if "sqlite" in db_url:
        connect_args["check_same_thread"] = False

    return create_async_engine(
        db_url,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args
    )


engine = get_engine()

# Session Factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session management."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_transactional_db() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for explicit transaction boundaries with automatic commit/rollback."""
    async with async_session_factory() as session:
        async with session.begin():
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

