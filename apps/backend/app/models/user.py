from datetime import date
from typing import Optional, List
from sqlalchemy import String, Boolean, Date, ForeignKey, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Roles and Capabilities
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_driver: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_passenger: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    driver_profile: Mapped[Optional["DriverProfile"]] = orm_relationship("DriverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    passenger_profile: Mapped[Optional["PassengerProfile"]] = orm_relationship("PassengerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    emergency_contacts: Mapped[List["EmergencyContact"]] = orm_relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    vehicles: Mapped[List["Vehicle"]] = orm_relationship("Vehicle", back_populates="driver")
    published_rides: Mapped[List["Ride"]] = orm_relationship("Ride", back_populates="driver")
    bookings: Mapped[List["Booking"]] = orm_relationship("Booking", back_populates="passenger")


class DriverProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "driver_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    licence_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    licence_expiry: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    licence_document_id: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    total_completed_trips: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=5.00, nullable=False)
    payout_bank_account: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payout_ifsc: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    payout_upi_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = orm_relationship("User", back_populates="driver_profile")


class PassengerProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "passenger_profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_pickup_landmark: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    medical_emergency_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_rides_taken: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = orm_relationship("User", back_populates="passenger_profile")


class EmergencyContact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "emergency_contacts"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped["User"] = orm_relationship("User", back_populates="emergency_contacts")
