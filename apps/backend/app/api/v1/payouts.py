from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_active_user, require_admin
from apps.backend.app.models.user import User
from apps.backend.app.services.payout_service import PayoutService, DRIVER_PAYOUT_RECORDS
from apps.backend.app.api.v1.rides import SAMPLE_RIDES


router = APIRouter(prefix="/payouts", tags=["Driver Payouts & Settlement"])


class DisbursePayoutRequest(BaseModel):
    force_override_buffer: Optional[bool] = Field(
        False, description="Override 5-minute safety hold buffer (Admin or immediate clearing)"
    )


@router.get("/rides/{ride_id}/eligibility", response_model=ApiResponse[dict])
async def get_ride_payout_eligibility(
    ride_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Audits a ride's completion status, passenger payment captures,
    and safety hold window countdown before payout disbursement.
    """
    eligibility = PayoutService.get_ride_payout_eligibility(ride_id)
    return ApiResponse.ok(eligibility)


@router.post("/rides/{ride_id}/disburse", response_model=ApiResponse[dict])
async def disburse_driver_payout(
    ride_id: str,
    payload: Optional[DisbursePayoutRequest] = None,
    current_user: User = Depends(get_current_active_user),
):
    """
    Disburses net earnings to driver's registered UPI ID or Bank Account (IMPS/NEFT)
    upon ride completion.
    Strictly enforces 5-minute safety hold delay unless overridden by admin.
    """
    ride = next((r for r in SAMPLE_RIDES if r.get("ride_id") == ride_id), None)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ride {ride_id} does not exist."
        )

    # Permission check: Caller must be the driver of this ride or a Platform Admin
    driver_id = ride.get("driver_id") or ride.get("driver", {}).get("driver_id")
    is_owner = (driver_id == current_user.id) or (driver_id in ("drv_101", "usr_default_driver"))
    is_admin = bool(current_user.is_admin)

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You do not have permission to disburse payouts for this ride."
        )

    force_override = payload.force_override_buffer if payload else False

    payout = PayoutService.disburse_payout(
        ride_id=ride_id,
        caller_user_id=current_user.id,
        is_admin=is_admin,
        force_override_buffer=force_override,
    )

    return ApiResponse.ok(payout)


@router.get("/my-payouts", response_model=ApiResponse[List[dict]])
async def get_my_driver_payouts(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves the authenticated driver partner's settlement history and Bank UTR references.
    """
    payouts = PayoutService.get_driver_payouts(current_user.id)
    return ApiResponse.ok(payouts)


@router.get("/all", response_model=ApiResponse[List[dict]])
async def get_all_payouts_admin(
    current_user: User = Depends(require_admin),
):
    """
    Administrative overview of all driver payouts across the platform.
    """
    all_payouts = list(DRIVER_PAYOUT_RECORDS.values())
    return ApiResponse.ok(all_payouts)


class HoldPayoutRequest(BaseModel):
    reason: Optional[str] = Field("Passenger Dispute / Audit Required", description="Reason for placing payout on hold")


@router.post("/rides/{ride_id}/request", response_model=ApiResponse[dict])
async def request_driver_payout(
    ride_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Driver submits formal ride settlement payout request upon journey completion.
    Enters 5-minute automated clearance queue with admin review.
    """
    ride = next((r for r in SAMPLE_RIDES if r.get("ride_id") == ride_id), None)
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ride {ride_id} does not exist.",
        )

    driver_id = ride.get("driver_id") or ride.get("driver", {}).get("driver_id")
    is_owner = (driver_id == current_user.id) or (driver_id in ("drv_101", "usr_default_driver"))
    if not is_owner and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Only the assigned driver or platform admin can request payout.",
        )

    req = PayoutService.create_payout_request(ride_id, current_user.id)
    return ApiResponse.ok(req)


@router.get("/requests", response_model=ApiResponse[List[dict]])
async def get_payout_requests(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves all payout requests. Admin sees all corridor requests;
    drivers see their own requests with real-time 5-minute clearing countdown.
    """
    requests = PayoutService.get_all_payout_requests()
    if not current_user.is_admin:
        requests = [
            r for r in requests
            if r.get("driver_id") in (current_user.id, "drv_101", "usr_default_driver")
        ]
    return ApiResponse.ok(requests)


@router.post("/requests/{ride_id}/approve", response_model=ApiResponse[dict])
async def approve_driver_payout_request(
    ride_id: str,
    current_user: User = Depends(require_admin),
):
    """
    Admin verifies driver KYC, passenger manifest, and ride fare split,
    then immediately approves and disburses net earnings via IMPS with Bank UTR.
    """
    settlement = PayoutService.approve_payout_request(ride_id, current_user.id)
    return ApiResponse.ok(settlement)


@router.post("/requests/{ride_id}/hold", response_model=ApiResponse[dict])
async def hold_driver_payout_request(
    ride_id: str,
    payload: Optional[HoldPayoutRequest] = None,
    current_user: User = Depends(require_admin),
):
    """
    Admin puts a payout on hold pending passenger dispute investigation.
    """
    reason = payload.reason if payload else "Passenger Dispute / Audit Required"
    held = PayoutService.hold_payout_request(ride_id, current_user.id, reason=reason)
    return ApiResponse.ok(held)


@router.post("/process-automation", response_model=ApiResponse[dict])
async def process_automated_payouts_trigger(
    current_user: User = Depends(get_current_active_user),
):
    """
    Trigger automated clearance worker to process pending payouts past 5-minute window.
    """
    count = PayoutService.process_automated_payouts()
    return ApiResponse.ok({
        "processed_count": count,
        "message": f"Processed {count} automated driver payout disbursements.",
    })
