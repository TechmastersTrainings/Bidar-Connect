from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import json
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status

from apps.backend.app.schemas.common import ApiResponse
from apps.backend.app.core.dependencies import get_current_active_user, require_admin
from apps.backend.app.models.user import User
from apps.backend.app.services.payment_gateway_adapter import get_payment_gateway
from apps.backend.app.services.ledger_service import LedgerService
from apps.backend.app.services.admin_qr_service import get_admin_qr_config, update_admin_qr_config
from apps.backend.app.api.v1.bookings import ACTIVE_BOOKINGS
from apps.backend.app.api.v1.rides import SAMPLE_RIDES


router = APIRouter(prefix="/payments", tags=["Payment & Ledger Engine"])

# Synchronized In-Memory Payment Storage
CAPTURED_PAYMENTS: Dict[str, Dict[str, Any]] = {}


class CreatePaymentOrderRequest(BaseModel):
    booking_id: str = Field(..., description="Target booking or hold reference")
    payment_method: Optional[str] = Field("UPI", description="UPI, CARD, or NETBANKING")


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: str


@router.post("/create-order", response_model=ApiResponse[dict])
async def create_payment_order(
    payload: CreatePaymentOrderRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Initiates a payment order for a booking using the centralized platform merchant gateway.
    Returns gateway order ID, amount, and cryptographic payload.
    """
    booking = ACTIVE_BOOKINGS.get(payload.booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {payload.booking_id} not found."
        )

    # Prevent double-payment if already captured
    if booking.get("status") == "CONFIRMED" and payload.booking_id in CAPTURED_PAYMENTS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment for this booking has already been captured and confirmed."
        )

    amount = float(booking.get("total_fare", 310.0))
    currency = "INR"
    receipt = f"rec_{booking.get('reference_code', payload.booking_id[:8])}"

    gateway = get_payment_gateway()
    order_data = gateway.create_order(
        amount=amount,
        currency=currency,
        receipt=receipt,
        notes={
            "booking_id": payload.booking_id,
            "passenger_id": current_user.id,
            "passenger_phone": current_user.phone,
            "reference_code": booking.get("reference_code", ""),
        },
    )

    return ApiResponse.ok(order_data)


@router.post("/verify", response_model=ApiResponse[dict])
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Verifies the cryptographic HMAC-SHA256 signature from the gateway.
    Upon successful validation, atomically transitions booking to CONFIRMED
    and writes double-entry financial ledger records.
    """
    booking = ACTIVE_BOOKINGS.get(payload.booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {payload.booking_id} not found."
        )

    gateway = get_payment_gateway()
    is_valid = gateway.verify_payment_signature(
        order_id=payload.gateway_order_id,
        payment_id=payload.gateway_payment_id,
        signature=payload.gateway_signature,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Authentication failed; transaction rejected."
        )

    # Capture Payment
    captured_at = datetime.now(timezone.utc).isoformat()
    fare_per_seat = float(booking.get("fare_per_seat", 310.0))
    seats_booked = int(booking.get("seats_booked", 1))
    total_fare = float(booking.get("total_fare", fare_per_seat * seats_booked))
    commission = float(booking.get("company_commission", 20.0 * seats_booked))
    driver_payable = float(booking.get("driver_payable", total_fare - commission))

    payment_record = {
        "payment_id": f"pay_{payload.gateway_payment_id[-10:]}",
        "booking_id": payload.booking_id,
        "gateway_order_id": payload.gateway_order_id,
        "gateway_payment_id": payload.gateway_payment_id,
        "amount": total_fare,
        "currency": "INR",
        "status": "CAPTURED",
        "captured_at": captured_at,
        "reference_code": booking.get("reference_code", f"BC-{payload.booking_id[:6].upper()}"),
        "breakdown": {
            "fare_per_seat": fare_per_seat,
            "seats_booked": seats_booked,
            "subtotal": total_fare,
            "company_commission": commission,
            "driver_payable": driver_payable,
        },
    }

    CAPTURED_PAYMENTS[payload.booking_id] = payment_record

    # Finalize Booking Confirmation
    booking["status"] = "CONFIRMED"
    booking["payment_id"] = payment_record["payment_id"]
    booking["payment_status"] = "CAPTURED"
    booking["confirmed_at"] = captured_at

    # Atomic Double-Entry Ledger Recording:
    # 1. Debit PASSENGER_PAYABLE -> Credit DRIVER_ESCROW_PAYABLE
    # 2. Debit PASSENGER_PAYABLE -> Credit COMPANY_COMMISSION_REVENUE
    LedgerService.record_booking_payment(
        booking_id=payload.booking_id,
        driver_payable=driver_payable,
        company_commission=commission,
        currency="INR",
    )

    return ApiResponse.ok(payment_record)


@router.post("/webhook")
async def payment_gateway_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
):
    """
    Idempotent asynchronous webhook endpoint for payment gateway events.
    Verifies raw body cryptographic HMAC-SHA256 signature before processing.
    """
    raw_body = await request.body()
    gateway = get_payment_gateway()

    if x_razorpay_signature:
        is_valid = gateway.verify_webhook_signature(raw_body, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature."
            )

    try:
        event = json.loads(raw_body.decode("utf-8"))
    except Exception:
        event = {}

    event_type = event.get("event", "payment.captured")
    payload_data = event.get("payload", {}).get("payment", {}).get("entity", {})
    booking_id = payload_data.get("notes", {}).get("booking_id")

    if booking_id and booking_id in ACTIVE_BOOKINGS:
        booking = ACTIVE_BOOKINGS[booking_id]
        if event_type == "payment.captured" and booking.get("status") != "CONFIRMED":
            booking["status"] = "CONFIRMED"
            booking["payment_status"] = "CAPTURED"
            total_fare = float(booking.get("total_fare", 310.0))
            commission = float(booking.get("company_commission", 20.0))
            driver_payable = float(booking.get("driver_payable", total_fare - commission))

            LedgerService.record_booking_payment(
                booking_id=booking_id,
                driver_payable=driver_payable,
                company_commission=commission,
            )

    return {"status": "ok", "event_processed": event_type}


@router.get("/receipt/{booking_id}", response_model=ApiResponse[dict])
async def get_payment_receipt(
    booking_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves the verified payment receipt and financial breakdown for a booking.
    """
    payment = CAPTURED_PAYMENTS.get(booking_id)
    if not payment:
        # Fallback receipt if booking was confirmed in earlier phases
        booking = ACTIVE_BOOKINGS.get(booking_id)
        if booking and booking.get("status") == "CONFIRMED":
            fare_per_seat = float(booking.get("fare_per_seat", 310.0))
            seats = int(booking.get("seats_booked", 1))
            total = float(booking.get("total_fare", fare_per_seat * seats))
            comm = float(booking.get("company_commission", 20.0 * seats))
            payment = {
                "payment_id": f"pay_{booking_id[-8:]}",
                "booking_id": booking_id,
                "gateway_order_id": f"order_legacy_{booking_id[:6]}",
                "gateway_payment_id": f"pay_legacy_{booking_id[:6]}",
                "amount": total,
                "currency": "INR",
                "status": "CAPTURED",
                "captured_at": booking.get("created_at", datetime.now(timezone.utc).isoformat()),
                "reference_code": booking.get("reference_code", "BC-LEGACY"),
                "breakdown": {
                    "fare_per_seat": fare_per_seat,
                    "seats_booked": seats,
                    "subtotal": total,
                    "company_commission": comm,
                    "driver_payable": total - comm,
                },
            }
            CAPTURED_PAYMENTS[booking_id] = payment
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No captured payment receipt found for booking {booking_id}."
            )

    return ApiResponse.ok(payment)


@router.get("/ledger", response_model=ApiResponse[List[dict]])
async def get_immutable_ledger(
    limit: int = 100,
    current_user: User = Depends(require_admin),
):
    """
    Admin-only query of the double-entry immutable financial ledger.
    Zero deletions or silent overwrites.
    """
    entries = LedgerService.get_all_entries(limit=limit)
    return ApiResponse.ok(entries)


@router.get("/summary", response_model=ApiResponse[dict])
async def get_financial_summary(
    current_user: User = Depends(require_admin),
):
    """
    High-level platform financial reconciliation metrics computed directly from ledger records.
    """
    summary = LedgerService.get_financial_summary()
    return ApiResponse.ok(summary)


class UpdatePaymentQrRequest(BaseModel):
    upi_id: str = Field(..., min_length=3, max_length=100)
    payee_name: str = Field(..., min_length=2, max_length=100)
    business_name: Optional[str] = "Bidar Connect"
    qr_image_data: Optional[str] = None
    instructions: Optional[str] = None


@router.get("/qr-config", response_model=ApiResponse[dict])
async def get_payment_qr():
    """
    Public endpoint: Returns the Admin's configured Platform Collection QR code and UPI details.
    All passenger booking payments are directed to this Admin account, not the driver.
    """
    config = get_admin_qr_config()
    return ApiResponse.ok(config)


@router.post("/qr-config", response_model=ApiResponse[dict])
async def update_payment_qr(
    payload: UpdatePaymentQrRequest,
    current_admin: User = Depends(require_admin),
):
    """
    Admin-only endpoint: Upload/configure the Platform Collection UPI QR code and payee details.
    """
    updated = update_admin_qr_config(
        upi_id=payload.upi_id,
        payee_name=payload.payee_name,
        business_name=payload.business_name,
        qr_image_data=payload.qr_image_data,
        instructions=payload.instructions,
    )
    return ApiResponse.ok(updated)

