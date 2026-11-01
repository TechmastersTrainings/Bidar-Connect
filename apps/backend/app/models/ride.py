from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Numeric, DateTime, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Ride(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "rides"

    driver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False)
    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("routes.id", ondelete="RESTRICT"), nullable=False)
    departure_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    estimated_arrival: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SCHEDULED", nullable=False)  # SCHEDULED, EN_ROUTE, TRIP_STARTED, ARRIVED, COMPLETED, CANCELLED
    total_offered_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    fare_per_seat_snapshot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    driver_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    driver: Mapped["User"] = relationship("User", back_populates="published_rides")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="rides")
    route: Mapped["Route"] = relationship("Route")
    seat_inventory: Mapped["RideSeatInventory"] = relationship("RideSeatInventory", back_populates="ride", uselist=False, cascade="all, delete-orphan")
    stops: Mapped[List["RideStop"]] = relationship("RideStop", back_populates="ride", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="ride")
    payout: Mapped[Optional["DriverPayout"]] = relationship("DriverPayout", back_populates="ride", uselist=False)


class RideStop(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ride_stops"

    ride_id: Mapped[str] = mapped_column(String(36), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False)
    stop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_pickup: Mapped[bool] = mapped_column(default=True)
    is_drop: Mapped[bool] = mapped_column(default=True)

    ride: Mapped["Ride"] = relationship("Ride", back_populates="stops")


class RideSeatInventory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Critical concurrency table.
    Enforces available_seats >= 0 constraint at the database layer.
    """
    __tablename__ = "ride_seat_inventory"
    __table_args__ = (
        CheckConstraint("available_seats >= 0", name="ck_ride_seat_inventory_available_non_negative"),
    )

    ride_id: Mapped[str] = mapped_column(String(36), ForeignKey("rides.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    total_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    reserved_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    version_lock: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    ride: Mapped["Ride"] = relationship("Ride", back_populates="seat_inventory")

