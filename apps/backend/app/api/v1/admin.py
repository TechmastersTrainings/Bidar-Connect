from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User, DriverProfile, PassengerProfile
from apps.backend.app.models.vehicle import Vehicle
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import require_admin
from apps.backend.app.schemas.auth import UserRole
from apps.backend.app.api.v1.rides import SAMPLE_RIDES
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
from apps.backend.app.api.v1.pricing import ACTIVE_ROUTE_PRICES, ACTIVE_COMMISSION_RULE
from apps.backend.app.services.admin_qr_service import get_admin_qr_config, update_admin_qr_config

router = APIRouter(prefix="/admin", tags=["Admin Operations & Governance"])

# Synchronized Admin Audit Log Trail
ADMIN_AUDIT_LOGS: List[Dict[str, Any]] = []


def log_admin_action(action: str, actor_name: str, target_entity: str, target_id: str, details: str):
    log_id = f"log_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(100, 999)}"
    entry = {
        "log_id": log_id,
        "action": action,
        "actor_name": actor_name,
        "target_entity": target_entity,
        "target_id": target_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    ADMIN_AUDIT_LOGS.insert(0, entry)
    return entry


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class AdminMetricsResponse(BaseModel):
    gross_booking_value: float
    net_platform_commission: float
    active_published_rides: int
    confirmed_passenger_seats: int
    total_registered_users: int
    verified_drivers_count: int
    pending_kyc_approvals: int
    suspended_accounts_count: int


class AdminUserItemResponse(BaseModel):
    user_id: str
    phone: str
    email: Optional[str] = None
    full_name: str
    roles: List[str]
    is_driver: bool
    is_passenger: bool
    is_admin: bool
    is_active: bool
    is_suspended: bool
    created_at: str
    driver_kyc_status: Optional[str] = None
    total_completed_trips: int = 0
    average_rating: float = 5.0


class SuspendUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Administrative justification")


class ReviewKYCRequest(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    feedback_reason: Optional[str] = Field(None, max_length=500)


class UpdateRoutePriceRequest(BaseModel):
    fare_per_seat: float = Field(..., ge=10.0, le=2000.0)


class UpdateCommissionRequest(BaseModel):
    fixed_fee_per_seat: float = Field(..., ge=0.0, le=100.0)
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/metrics", response_model=ApiResponse[AdminMetricsResponse])
async def get_admin_metrics(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Executive platform health metrics:
    Gross Booking Value (GBV), Collected Commission, Active Rides, Seats Sold,
    Registered Users, Verified Drivers, and Open KYC Queues.
    """
    # 1. Financial aggregations from active bookings
    active_bks = [b for b in ACTIVE_BOOKINGS.values() if b["booking_status"] != "CANCELLED"]
    gbv = sum(float(b["fare_snapshot"]["total_fare"]) for b in active_bks)
    commission = sum(float(b["fare_snapshot"]["company_commission"]) for b in active_bks)
    seats_sold = sum(int(b["seats_booked"]) for b in active_bks)

    # 2. Active published rides
    active_rides = len([
        r for r in SAMPLE_RIDES
        if r.get("status") in ("SCHEDULED", "EN_ROUTE", "TRIP_STARTED")
    ])

    # 3. Database user counts
    user_count_res = await db.execute(select(func.count(User.id)))
    total_users = user_count_res.scalar() or 0

    suspended_res = await db.execute(select(func.count(User.id)).where(User.is_suspended == True))
    suspended_count = suspended_res.scalar() or 0

    driver_verified_res = await db.execute(
        select(func.count(DriverProfile.id)).where(DriverProfile.is_verified == True)
    )
    verified_drivers = driver_verified_res.scalar() or 0

    driver_pending_res = await db.execute(
        select(func.count(DriverProfile.id)).where(DriverProfile.is_verified == False)
    )
    pending_kyc = driver_pending_res.scalar() or 0

    return ApiResponse.ok(
        data=AdminMetricsResponse(
            gross_booking_value=gbv,
            net_platform_commission=commission,
            active_published_rides=active_rides,
            confirmed_passenger_seats=seats_sold,
            total_registered_users=total_users,
            verified_drivers_count=verified_drivers,
            pending_kyc_approvals=pending_kyc,
            suspended_accounts_count=suspended_count,
        )
    )


@router.get("/users", response_model=ApiResponse[List[AdminUserItemResponse]])
async def list_users(
    role: Optional[str] = Query(None, description="PASSENGER, DRIVER, ADMIN"),
    query: Optional[str] = Query(None, description="Search by name or phone number"),
    is_suspended: Optional[bool] = Query(None, description="Filter by suspension status"),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Admin User Directory with search, role filters, and KYC inspection."""
    stmt = (
        select(User)
        .options(selectinload(User.driver_profile), selectinload(User.passenger_profile))
        .order_by(User.created_at.desc())
    )

    if is_suspended is not None:
        stmt = stmt.where(User.is_suspended == is_suspended)

    res = await db.execute(stmt)
    users = res.scalars().all()

    items = []
    for u in users:
        # Query filter
        if query:
            q = query.lower()
            if q not in u.full_name.lower() and q not in u.phone:
                continue

        # Role filter
        roles = []
        if u.is_passenger:
            roles.append("PASSENGER")
        if u.is_driver:
            roles.append("DRIVER")
        if u.is_admin:
            roles.append("ADMIN")

        if role and role.upper() not in roles:
            continue

        kyc_status = None
        trips = 0
        rating = 5.0
        if u.driver_profile:
            kyc_status = "VERIFIED" if u.driver_profile.is_verified else "PENDING"
            trips = u.driver_profile.total_completed_trips
            rating = float(u.driver_profile.average_rating)

        items.append(
            AdminUserItemResponse(
                user_id=u.id,
                phone=u.phone,
                email=u.email,
                full_name=u.full_name,
                roles=roles,
                is_driver=u.is_driver,
                is_passenger=u.is_passenger,
                is_admin=u.is_admin,
                is_active=u.is_active,
                is_suspended=u.is_suspended,
                created_at=u.created_at.isoformat() if u.created_at else datetime.now(timezone.utc).isoformat(),
                driver_kyc_status=kyc_status,
                total_completed_trips=trips,
                average_rating=rating,
            )
        )

    return ApiResponse.ok(data=items)


@router.post("/users/{user_id}/suspend", response_model=ApiResponse[Dict[str, Any]])
async def suspend_user_account(
    user_id: str,
    payload: SuspendUserRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Suspend a user account for policy or safety violations.
    Immediately invalidates access tokens at the dependency gate and logs audit reason.
    """
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot suspend administrator accounts.")

    user.is_suspended = True
    await db.commit()

    log_entry = log_admin_action(
        action="USER_SUSPENDED",
        actor_name=current_admin.full_name,
        target_entity="User",
        target_id=user.id,
        details=f"Suspended account: {user.full_name} ({user.phone}). Reason: {payload.reason}",
    )

    return ApiResponse.ok(
        data={
            "user_id": user.id,
            "full_name": user.full_name,
            "is_suspended": True,
            "reason": payload.reason,
            "audit_log": log_entry,
        }
    )


@router.post("/users/{user_id}/unsuspend", response_model=ApiResponse[Dict[str, Any]])
async def unsuspend_user_account(
    user_id: str,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Restore suspended user account."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_suspended = False
    await db.commit()

    log_entry = log_admin_action(
        action="USER_UNSUSPENDED",
        actor_name=current_admin.full_name,
        target_entity="User",
        target_id=user.id,
        details=f"Restored account: {user.full_name} ({user.phone}) to active state.",
    )

    return ApiResponse.ok(
        data={
            "user_id": user.id,
            "full_name": user.full_name,
            "is_suspended": False,
            "audit_log": log_entry,
        }
    )


@router.get("/kyc-queue", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_driver_kyc_queue(
    status_filter: Optional[str] = Query("ALL", description="PENDING, VERIFIED, or ALL"),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Driver Document Inspection Queue for driving licence and partner verifications."""
    stmt = (
        select(DriverProfile)
        .options(selectinload(DriverProfile.user))
        .order_by(DriverProfile.created_at.desc())
    )

    if status_filter and status_filter.upper() == "PENDING":
        stmt = stmt.where(DriverProfile.is_verified == False)
    elif status_filter and status_filter.upper() == "VERIFIED":
        stmt = stmt.where(DriverProfile.is_verified == True)

    res = await db.execute(stmt)
    profiles = res.scalars().all()

    queue_items = []
    for dp in profiles:
        user = dp.user
        veh_stmt = select(func.count(Vehicle.id)).where(Vehicle.driver_id == dp.user_id)
        v_count = (await db.execute(veh_stmt)).scalar() or 0

        queue_items.append({
            "driver_id": dp.id,
            "user_id": dp.user_id,
            "driver_name": user.full_name if user else "Driver Partner",
            "phone": user.phone if user else "",
            "licence_number": dp.licence_number,
            "licence_expiry": dp.licence_expiry.isoformat() if dp.licence_expiry else "2028-12-31",
            "licence_document_id": dp.licence_document_id,
            "is_verified": dp.is_verified,
            "total_completed_trips": dp.total_completed_trips,
            "average_rating": float(dp.average_rating),
            "submitted_at": dp.created_at.isoformat() if dp.created_at else "2026-11-01T10:00:00Z",
            "vehicles_count": v_count,
        })

    return ApiResponse.ok(data=queue_items)


@router.post("/kyc-queue/{driver_id}/review", response_model=ApiResponse[Dict[str, Any]])
async def review_driver_kyc(
    driver_id: str,
    payload: ReviewKYCRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Approve or reject a driver's driving licence and onboarding credentials."""
    stmt = select(DriverProfile).options(selectinload(DriverProfile.user)).where(DriverProfile.id == driver_id)
    res = await db.execute(stmt)
    dp = res.scalar_one_or_none()

    if not dp:
        # Check by user_id
        stmt2 = select(DriverProfile).options(selectinload(DriverProfile.user)).where(DriverProfile.user_id == driver_id)
        res2 = await db.execute(stmt2)
        dp = res2.scalar_one_or_none()

    if not dp:
        raise HTTPException(status_code=404, detail="Driver profile record not found.")

    action = payload.action.upper()
    if action not in ("APPROVE", "REJECT"):
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT.")

    driver_name = dp.user.full_name if dp.user else "Driver"

    if action == "APPROVE":
        dp.is_verified = True
        log_admin_action(
            action="KYC_APPROVED",
            actor_name=current_admin.full_name,
            target_entity="DriverProfile",
            target_id=dp.id,
            details=f"Approved licence {dp.licence_number} for partner {driver_name}.",
        )
    else:
        dp.is_verified = False
        log_admin_action(
            action="KYC_REJECTED",
            actor_name=current_admin.full_name,
            target_entity="DriverProfile",
            target_id=dp.id,
            details=f"Rejected licence for partner {driver_name}. Feedback: {payload.feedback_reason or 'Documentation incomplete'}",
        )

    await db.commit()

    return ApiResponse.ok(
        data={
            "driver_id": dp.id,
            "driver_name": driver_name,
            "is_verified": dp.is_verified,
            "action": action,
            "feedback": payload.feedback_reason,
            "message": f"Partner verification {action.lower()}d successfully.",
        }
    )


@router.get("/pricing", response_model=ApiResponse[Dict[str, Any]])
async def get_pricing_configuration(
    current_admin: User = Depends(require_admin),
):
    """Retrieve current corridor fixed pricing rules and commission settings."""
    return ApiResponse.ok(
        data={
            "routes": ACTIVE_ROUTE_PRICES,
            "commission_rule": ACTIVE_COMMISSION_RULE,
        }
    )


@router.put("/pricing/commission", response_model=ApiResponse[Dict[str, Any]])
async def update_commission_rule(
    payload: UpdateCommissionRequest,
    current_admin: User = Depends(require_admin),
):
    """Update platform commission per seat."""
    old_fee = ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"]
    ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"] = payload.fixed_fee_per_seat
    if payload.description:
        ACTIVE_COMMISSION_RULE["description"] = payload.description

    log_admin_action(
        action="COMMISSION_RULE_UPDATED",
        actor_name=current_admin.full_name,
        target_entity="CommissionRule",
        target_id=ACTIVE_COMMISSION_RULE["rule_id"],
        details=f"Updated platform commission fee from ₹{old_fee} to ₹{payload.fixed_fee_per_seat}/seat.",
    )

    return ApiResponse.ok(
        data={
            "rule_id": ACTIVE_COMMISSION_RULE["rule_id"],
            "fixed_fee_per_seat": payload.fixed_fee_per_seat,
            "description": ACTIVE_COMMISSION_RULE["description"],
            "message": f"Platform commission updated to ₹{payload.fixed_fee_per_seat}/seat.",
        }
    )


@router.put("/pricing/{route_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_corridor_price(
    route_id: str,
    payload: UpdateRoutePriceRequest,
    current_admin: User = Depends(require_admin),
):
    """
    Central Admin Pricing Invariant:
    Update authoritative fixed per-seat fare for corridor segments.
    """
    route = next((r for r in ACTIVE_ROUTE_PRICES if r["route_id"] == route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found in catalog.")

    old_fare = route["fare_per_seat"]
    route["fare_per_seat"] = payload.fare_per_seat

    log_admin_action(
        action="ROUTE_PRICE_UPDATED",
        actor_name=current_admin.full_name,
        target_entity="RoutePrice",
        target_id=route_id,
        details=f"Updated corridor fare for {route['origin_city']} ⇄ {route['destination_city']} from ₹{old_fare} to ₹{payload.fare_per_seat}/seat.",
    )

    return ApiResponse.ok(
        data={
            "route_id": route_id,
            "origin_city": route["origin_city"],
            "destination_city": route["destination_city"],
            "old_fare": old_fare,
            "new_fare": payload.fare_per_seat,
            "message": f"Fixed corridor fare updated to ₹{payload.fare_per_seat}/seat.",
        }
    )
    ACTIVE_COMMISSION_RULE["fixed_fee_per_seat"] = payload.fixed_fee_per_seat
    if payload.description:
        ACTIVE_COMMISSION_RULE["description"] = payload.description

    log_admin_action(
        action="COMMISSION_RULE_UPDATED",
        actor_name=current_admin.full_name,
        target_entity="CommissionRule",
        target_id=ACTIVE_COMMISSION_RULE["rule_id"],
        details=f"Updated platform commission fee from ₹{old_fee} to ₹{payload.fixed_fee_per_seat}/seat.",
    )

    return ApiResponse.ok(
        data={
            "rule_id": ACTIVE_COMMISSION_RULE["rule_id"],
            "fixed_fee_per_seat": payload.fixed_fee_per_seat,
            "description": ACTIVE_COMMISSION_RULE["description"],
            "message": f"Platform commission updated to ₹{payload.fixed_fee_per_seat}/seat.",
        }
    )


@router.get("/audit-logs", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_admin_audit_logs(
    current_admin: User = Depends(require_admin),
):
    """Retrieve immutable administrative audit log trail."""
    return ApiResponse.ok(data=ADMIN_AUDIT_LOGS)


class AdminUpdatePaymentQrRequest(BaseModel):
    upi_id: str = Field(..., min_length=3, max_length=100)
    payee_name: str = Field(..., min_length=2, max_length=100)
    business_name: Optional[str] = "Bidar Connect"
    qr_image_data: Optional[str] = None
    instructions: Optional[str] = None


@router.get("/payment-qr", response_model=ApiResponse[Dict[str, Any]])
async def get_admin_payment_qr(
    current_admin: User = Depends(require_admin),
):
    """Retrieve the Platform Admin's active collection QR configuration."""
    return ApiResponse.ok(data=get_admin_qr_config())


@router.post("/payment-qr", response_model=ApiResponse[Dict[str, Any]])
async def update_admin_payment_qr(
    payload: AdminUpdatePaymentQrRequest,
    current_admin: User = Depends(require_admin),
):
    """Update Platform Collection UPI QR image, UPI ID, and Payee details."""
    updated = update_admin_qr_config(
        upi_id=payload.upi_id,
        payee_name=payload.payee_name,
        business_name=payload.business_name,
        qr_image_data=payload.qr_image_data,
        instructions=payload.instructions,
    )
    log_admin_action(
        action="PLATFORM_QR_UPDATED",
        actor_name=current_admin.full_name,
        target_entity="PaymentGateway",
        target_id="admin_qr",
        details=f"Updated Platform Collection UPI to {payload.upi_id} ({payload.payee_name}). Custom image: {bool(payload.qr_image_data)}",
    )
    return ApiResponse.ok(data=updated)
