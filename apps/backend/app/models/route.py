from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Integer, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class City(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "cities"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)


class Route(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "routes"

    origin_city_id: Mapped[str] = mapped_column(String(36), ForeignKey("cities.id"), nullable=False)
    destination_city_id: Mapped[str] = mapped_column(String(36), ForeignKey("cities.id"), nullable=False)
    distance_km: Mapped[int] = mapped_column(Integer, nullable=False)

    origin_city: Mapped["City"] = relationship("City", foreign_keys=[origin_city_id])
    destination_city: Mapped["City"] = relationship("City", foreign_keys=[destination_city_id])
    stops: Mapped[List["RouteStop"]] = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")
    prices: Mapped[List["RoutePrice"]] = relationship("RoutePrice", back_populates="route")


class RouteStop(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "route_stops"

    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    stop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)
    landmark_description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    route: Mapped["Route"] = relationship("Route", back_populates="stops")


class RoutePrice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "route_prices"

    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("routes.id"), nullable=False)
    origin_stop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_stop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    fare_per_seat: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    effective_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    route: Mapped["Route"] = relationship("Route", back_populates="prices")

