from datetime import date
from typing import Optional, List
from sqlalchemy import String, Boolean, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from apps.backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Vehicle(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vehicles"

    driver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    make: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(30), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(20), nullable=False)  # PETROL, DIESEL, CNG, EV
    passenger_capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    driver: Mapped["User"] = relationship("User", back_populates="vehicles")
    documents: Mapped[List["VehicleDocument"]] = relationship("VehicleDocument", back_populates="vehicle", cascade="all, delete-orphan")
    images: Mapped[List["VehicleImage"]] = relationship("VehicleImage", back_populates="vehicle", cascade="all, delete-orphan")
    rides: Mapped[List["Ride"]] = relationship("Ride", back_populates="vehicle")


class VehicleDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vehicle_documents"

    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)  # RC, INSURANCE, PUC
    document_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="documents")


class VehicleImage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vehicle_images"

    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    view_type: Mapped[str] = mapped_column(String(30), nullable=False)  # FRONT, REAR, INTERIOR
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="images")

