from typing import Optional
from sqlalchemy import String, ForeignKey, Integer, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
    )

    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False)
    passenger_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    driver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Punctual, Clean Car, Safe Driving

    booking: Mapped["Booking"] = relationship("Booking", back_populates="review")


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reports"

    booking_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bookings.id"), nullable=True)
    reported_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    issue_category: Mapped[str] = mapped_column(String(50), nullable=False)  # SAFETY, MISCONDUCT, NO_SHOW, PRICING
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="OPEN", index=True, nullable=False)  # OPEN, INVESTIGATING, RESOLVED, DISMISSED
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)  # UPDATE_PRICE, SUSPEND_USER, APPROVE_PAYOUT
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    changes_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
