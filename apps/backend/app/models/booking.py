from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Numeric, DateTime, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Booking(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("seats_booked >= 1 AND seats_booked <= 6", name="ck_bookings_seats_range"),
    )

    reference_code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    ride_id: Mapped[str] = mapped_column(String(36), ForeignKey("rides.id", ondelete="RESTRICT"), index=True, nullable=False)
    passenger_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    
    pickup_landmark: Mapped[str] = mapped_column(String(200), nullable=False)
    drop_landmark: Mapped[str] = mapped_column(String(200), nullable=False)
    seats_booked: Mapped[int] = mapped_column(Integer, nullable=False)

    # Invariant Snapshotting: Never affected by future admin price edits
    fare_per_seat: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_fare: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    commission_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    driver_payable: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    commission_rule_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("commission_rules.id"), nullable=True)

    booking_status: Mapped[str] = mapped_column(String(30), default="PENDING_PAYMENT", index=True, nullable=False)  # PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, EXPIRED
    reserved_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)

    ride: Mapped["Ride"] = relationship("Ride", back_populates="bookings")
    passenger: Mapped["User"] = relationship("User", back_populates="bookings")
    passengers_detail: Mapped[List["BookingPassenger"]] = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    status_history: Mapped[List["BookingStatusHistory"]] = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="booking", uselist=False)
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="booking", uselist=False)


class BookingPassenger(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "booking_passengers"

    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    passenger_name: Mapped[str] = mapped_column(String(100), nullable=False)
    age_declaration: Mapped[bool] = mapped_column(default=True, nullable=False)
    luggage_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="passengers_detail")


class BookingStatusHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "booking_status_history"

    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    from_status: Mapped[str] = mapped_column(String(30), nullable=False)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    changed_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_history")

