"""initial_schema

Revision ID: 5b3f8364c569
Revises: 
Create Date: 2026-11-01 22:18:42

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5b3f8364c569"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users & Profiles
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("phone", sa.String(20), unique=True, index=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=True),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("is_driver", sa.Boolean(), default=False, nullable=False),
        sa.Column("is_passenger", sa.Boolean(), default=True, nullable=False),
        sa.Column("is_admin", sa.Boolean(), default=False, nullable=False),
        sa.Column("is_suspended", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "driver_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("licence_number", sa.String(50), unique=True, nullable=False),
        sa.Column("licence_expiry", sa.Date(), index=True, nullable=False),
        sa.Column("licence_document_id", sa.String(255), nullable=False),
        sa.Column("is_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("total_completed_trips", sa.Integer(), default=0, nullable=False),
        sa.Column("average_rating", sa.Numeric(3, 2), default=5.00, nullable=False),
        sa.Column("payout_bank_account", sa.String(50), nullable=True),
        sa.Column("payout_ifsc", sa.String(20), nullable=True),
        sa.Column("payout_upi_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "passenger_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("preferred_pickup_landmark", sa.String(200), nullable=True),
        sa.Column("medical_emergency_notes", sa.String(500), nullable=True),
        sa.Column("total_rides_taken", sa.Integer(), default=0, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "emergency_contacts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("relationship_type", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 2. Vehicles
    op.create_table(
        "vehicles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("driver_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False),
        sa.Column("make", sa.String(50), nullable=False),
        sa.Column("model", sa.String(50), nullable=False),
        sa.Column("registration_number", sa.String(20), unique=True, index=True, nullable=False),
        sa.Column("color", sa.String(30), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("fuel_type", sa.String(20), nullable=False),
        sa.Column("passenger_capacity", sa.Integer(), default=4, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("is_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "vehicle_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vehicle_id", sa.String(36), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(30), nullable=False),
        sa.Column("document_number", sa.String(100), nullable=True),
        sa.Column("cloudinary_public_id", sa.String(255), nullable=False),
        sa.Column("expiry_date", sa.Date(), index=True, nullable=False),
        sa.Column("is_valid", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Locations & Routes
    op.create_table(
        "cities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("state", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "routes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("origin_city_id", sa.String(36), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("destination_city_id", sa.String(36), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("distance_km", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "route_prices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("route_id", sa.String(36), sa.ForeignKey("routes.id"), nullable=False),
        sa.Column("origin_stop_name", sa.String(100), nullable=False),
        sa.Column("destination_stop_name", sa.String(100), nullable=False),
        sa.Column("fare_per_seat", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), default="INR", nullable=False),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "commission_rules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("rule_code", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("rule_type", sa.String(30), nullable=False),
        sa.Column("fixed_amount_per_seat", sa.Numeric(10, 2), default=10.00, nullable=False),
        sa.Column("percentage_rate", sa.Numeric(5, 2), default=0.00, nullable=False),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Rides & Seat Inventory
    op.create_table(
        "rides",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("driver_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False),
        sa.Column("vehicle_id", sa.String(36), sa.ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("route_id", sa.String(36), sa.ForeignKey("routes.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("departure_time", sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column("estimated_arrival", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(30), default="SCHEDULED", nullable=False),
        sa.Column("total_offered_seats", sa.Integer(), nullable=False),
        sa.Column("fare_per_seat_snapshot", sa.Numeric(10, 2), nullable=False),
        sa.Column("driver_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "ride_seat_inventory",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id", ondelete="CASCADE"), unique=True, index=True, nullable=False),
        sa.Column("total_capacity", sa.Integer(), nullable=False),
        sa.Column("available_seats", sa.Integer(), nullable=False),
        sa.Column("reserved_seats", sa.Integer(), default=0, nullable=False),
        sa.Column("version_lock", sa.Integer(), default=1, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("available_seats >= 0", name="ck_ride_seat_inventory_available_non_negative"),
    )

    # 5. Bookings
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("reference_code", sa.String(30), unique=True, index=True, nullable=False),
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id", ondelete="RESTRICT"), index=True, nullable=False),
        sa.Column("passenger_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False),
        sa.Column("pickup_landmark", sa.String(200), nullable=False),
        sa.Column("drop_landmark", sa.String(200), nullable=False),
        sa.Column("seats_booked", sa.Integer(), nullable=False),
        sa.Column("fare_per_seat", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_fare", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("driver_payable", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_rule_id", sa.String(36), sa.ForeignKey("commission_rules.id"), nullable=True),
        sa.Column("booking_status", sa.String(30), default="PENDING_PAYMENT", index=True, nullable=False),
        sa.Column("reserved_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("idempotency_key", sa.String(100), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("seats_booked >= 1 AND seats_booked <= 6", name="ck_bookings_seats_range"),
    )

    # 6. Finance & Ledger
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False),
        sa.Column("gateway_order_id", sa.String(100), index=True, nullable=False),
        sa.Column("gateway_payment_id", sa.String(100), unique=True, index=True, nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), default="INR", nullable=False),
        sa.Column("status", sa.String(30), default="INITIATED", index=True, nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "driver_payouts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id", ondelete="RESTRICT"), unique=True, nullable=False),
        sa.Column("driver_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("gross_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_deducted", sa.Numeric(10, 2), nullable=False),
        sa.Column("net_payable", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(30), default="PENDING_ELIGIBILITY", index=True, nullable=False),
        sa.Column("payout_reference_utr", sa.String(100), nullable=True),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "ledger_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("transaction_code", sa.String(50), index=True, nullable=False),
        sa.Column("debit_account", sa.String(50), nullable=False),
        sa.Column("credit_account", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), default="INR", nullable=False),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id"), nullable=True),
        sa.Column("payout_id", sa.String(36), sa.ForeignKey("driver_payouts.id"), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.CheckConstraint("amount > 0", name="ck_ledger_entries_positive_amount"),
    )


def downgrade() -> None:
    op.drop_table("ledger_entries")
    op.drop_table("driver_payouts")
    op.drop_table("payments")
    op.drop_table("bookings")
    op.drop_table("ride_seat_inventory")
    op.drop_table("rides")
    op.drop_table("commission_rules")
    op.drop_table("route_prices")
    op.drop_table("routes")
    op.drop_table("cities")
    op.drop_table("vehicle_documents")
    op.drop_table("vehicles")
    op.drop_table("emergency_contacts")
    op.drop_table("passenger_profiles")
    op.drop_table("driver_profiles")
    op.drop_table("users")
