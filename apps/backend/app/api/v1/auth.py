from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from apps.backend.app.database.session import get_db_session
from apps.backend.app.models.user import User, DriverProfile
from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.schemas.auth import (
    RequestOtpRequest,
    VerifyOtpRequest,
    AuthTokenResponse,
    AuthUserResponse,
    UserRole,
)
from apps.backend.app.services.auth_service import auth_service
from apps.backend.app.core.dependencies import (
    get_current_active_user,
    require_admin,
    require_roles,
    require_verified_driver,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


class DriverOnboardRequest(BaseModel):
    licence_number: str = Field(..., min_length=5, max_length=50)
    licence_expiry: date
    licence_document_id: str = Field(..., min_length=3, max_length=255)
    payout_upi_id: Optional[str] = None


class UserStatusUpdateRequest(BaseModel):
    is_suspended: bool
    reason: Optional[str] = None


@router.post("/otp/request", response_model=ApiResponse[dict])
async def request_otp(payload: RequestOtpRequest):
    """
    Dispatches a 6-digit phone verification OTP code.
    In local development, the code is returned in metadata for testing.
    """
    res = await auth_service.request_otp(payload.phone)
    return ApiResponse.ok(res)


@router.post("/otp/verify", response_model=ApiResponse[AuthTokenResponse])
async def verify_otp(
    payload: VerifyOtpRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Verifies the phone OTP code, logs in or auto-registers the user,
    and returns a cryptographically signed Bearer JWT token.
    """
    token_resp = await auth_service.verify_otp(
        db=db,
        phone=payload.phone,
        otp=payload.otp,
        full_name=payload.full_name,
        email=payload.email,
    )
    return ApiResponse.ok(token_resp)


@router.get("/me", response_model=ApiResponse[AuthUserResponse])
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user profile, permissions, and verification status.
    Protected by JWT Bearer token authentication.
    """
    return ApiResponse.ok(auth_service.to_user_response(current_user))


@router.post("/driver-onboard", response_model=ApiResponse[AuthUserResponse])
async def onboard_driver(
    payload: DriverOnboardRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Enables driver capability for an existing passenger user and records
    driving licence credentials for administrative verification.
    """
    if current_user.driver_profile:
        driver_prof = current_user.driver_profile
        driver_prof.licence_number = payload.licence_number
        driver_prof.licence_expiry = payload.licence_expiry
        driver_prof.licence_document_id = payload.licence_document_id
        if payload.payout_upi_id:
            driver_prof.payout_upi_id = payload.payout_upi_id
    else:
        driver_prof = DriverProfile(
            user_id=current_user.id,
            licence_number=payload.licence_number,
            licence_expiry=payload.licence_expiry,
            licence_document_id=payload.licence_document_id,
            is_verified=False,  # Requires administrative review
            payout_upi_id=payload.payout_upi_id,
        )
        db.add(driver_prof)

    current_user.is_driver = True
    await db.commit()
    await db.refresh(current_user)

    return ApiResponse.ok(auth_service.to_user_response(current_user))


@router.get("/admin/users", response_model=ApiResponse[List[AuthUserResponse]])
async def list_users_admin(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Lists users on the platform. Strictly restricted to users with ADMIN role.
    """
    stmt = (
        select(User)
        .options(
            selectinload(User.driver_profile),
            selectinload(User.passenger_profile),
        )
    )
    res = await db.execute(stmt)
    users = res.scalars().all()
    user_responses = [auth_service.to_user_response(u) for u in users]
    return ApiResponse.ok(user_responses)


@router.patch("/admin/users/{user_id}/suspend", response_model=ApiResponse[AuthUserResponse])
async def toggle_user_suspension(
    user_id: str,
    payload: UserStatusUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Administrative control to suspend or reactivate an account.
    """
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    target_user.is_suspended = payload.is_suspended
    await db.commit()
    await db.refresh(target_user)

    return ApiResponse.ok(auth_service.to_user_response(target_user))


@router.get("/driver/test-gate")
async def driver_gate_test(
    driver: User = Depends(require_verified_driver),
):
    """
    Test endpoint verifying driver KYC gate.
    Rejects passengers, unverified drivers, and expired licences.
    """
    return ApiResponse.ok({
        "status": "authorized",
        "driver_id": driver.id,
        "licence_number": driver.driver_profile.licence_number if driver.driver_profile else None,
    })
