from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Numeric, DateTime, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False)
    gateway_order_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="INITIATED", index=True, nullable=False)  # INITIATED, CAPTURED, FAILED, REFUNDED
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payment")
    attempts: Mapped[List["PaymentAttempt"]] = relationship("PaymentAttempt", back_populates="payment", cascade="all, delete-orphan")


class PaymentAttempt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payment_attempts"

    payment_id: Mapped[str] = mapped_column(String(36), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False)
    gateway_attempt_id: Mapped[str] = mapped_column(String(100), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="UPI", nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    payment: Mapped["Payment"] = relationship("Payment", back_populates="attempts")


class DriverPayout(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "driver_payouts"

    ride_id: Mapped[str] = mapped_column(String(36), ForeignKey("rides.id", ondelete="RESTRICT"), unique=True, nullable=False)
    driver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    gross_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    commission_deducted: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    net_payable: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING_ELIGIBILITY", index=True, nullable=False)  # PENDING_ELIGIBILITY, QUEUED, PROCESSING, SETTLED, FAILED
    payout_reference_utr: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ride: Mapped["Ride"] = relationship("Ride", back_populates="payout")
    driver: Mapped["User"] = relationship("User")


class LedgerEntry(Base, UUIDPrimaryKeyMixin):
    """
    Append-only double-entry financial ledger.
    Zero silent overwriting or deletions.
    """
    __tablename__ = "ledger_entries"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_ledger_entries_positive_amount"),
    )

    transaction_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    debit_account: Mapped[str] = mapped_column(String(50), nullable=False)
    credit_account: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    booking_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bookings.id"), nullable=True)
    payout_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("driver_payouts.id"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
