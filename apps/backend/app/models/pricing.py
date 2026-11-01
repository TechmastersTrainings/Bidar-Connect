from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CommissionRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "commission_rules"

    rule_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    rule_type: Mapped[str] = mapped_column(String(30), nullable=False)  # FIXED_PER_SEAT, PERCENTAGE, TIERED
    fixed_amount_per_seat: Mapped[float] = mapped_column(Numeric(10, 2), default=10.00, nullable=False)
    percentage_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    effective_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
