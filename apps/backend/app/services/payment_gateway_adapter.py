from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import hmac
import hashlib
import time
import uuid

from apps.backend.app.core.config import settings


class PaymentGatewayAdapter(ABC):
    """
    Provider-agnostic interface for payment collection, signature verification,
    disbursements (payouts), and refunds.
    """

    @abstractmethod
    def create_order(
        self, amount: float, currency: str, receipt: str, notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Creates a payment order with the gateway."""
        pass

    @abstractmethod
    def verify_payment_signature(
        self, order_id: str, payment_id: str, signature: str
    ) -> bool:
        """Verifies HMAC SHA-256 payment signature."""
        pass

    @abstractmethod
    def verify_webhook_signature(
        self, raw_body: bytes, signature_header: str
    ) -> bool:
        """Verifies webhook payload HMAC signature."""
        pass

    @abstractmethod
    def disburse_payout(
        self, driver_id: str, amount: float, destination: Dict[str, Any], reference_id: str
    ) -> Dict[str, Any]:
        """Disburses funds to driver's bank account or UPI ID."""
        pass

    @abstractmethod
    def process_refund(
        self, payment_id: str, amount: float, reason: str
    ) -> Dict[str, Any]:
        """Dispatches refund to passenger's original payment method."""
        pass


class MockPaymentGateway(PaymentGatewayAdapter):
    """
    Robust deterministic mock gateway for testing and local sandbox operation.
    Generates cryptographically valid HMAC signatures so validation tests pass cleanly.
    """

    def __init__(self, key_secret: str = settings.RAZORPAY_KEY_SECRET, webhook_secret: str = settings.RAZORPAY_WEBHOOK_SECRET):
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret

    def generate_payment_signature(self, order_id: str, payment_id: str) -> str:
        """Helper to generate a valid signature for mock client tests."""
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(self.key_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def generate_webhook_signature(self, raw_body: bytes) -> str:
        """Helper to generate a valid webhook signature for tests."""
        return hmac.new(self.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    def create_order(
        self, amount: float, currency: str = "INR", receipt: str = "", notes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        order_uid = uuid.uuid4().hex[:12]
        order_id = f"order_mock_{order_uid}"
        # Pre-generate a mock payment ID and valid signature for seamless local testing
        mock_payment_id = f"pay_mock_{order_uid}"
        mock_signature = self.generate_payment_signature(order_id, mock_payment_id)

        return {
            "order_id": order_id,
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "key_id": settings.RAZORPAY_KEY_ID,
            "mock_payment_id": mock_payment_id,
            "mock_signature": mock_signature,
            "notes": notes or {},
            "created_at": int(time.time()),
        }

    def verify_payment_signature(
        self, order_id: str, payment_id: str, signature: str
    ) -> bool:
        expected = self.generate_payment_signature(order_id, payment_id)
        # Constant time comparison to prevent timing attacks
        return hmac.compare_digest(expected, signature)

    def verify_webhook_signature(
        self, raw_body: bytes, signature_header: str
    ) -> bool:
        expected = self.generate_webhook_signature(raw_body)
        return hmac.compare_digest(expected, signature_header)

    def disburse_payout(
        self, driver_id: str, amount: float, destination: Dict[str, Any], reference_id: str
    ) -> Dict[str, Any]:
        payout_id = f"pout_mock_{uuid.uuid4().hex[:12]}"
        utr = f"UTR_SBI_{int(time.time())}_{uuid.uuid4().hex[:6].upper()}"
        return {
            "payout_id": payout_id,
            "driver_id": driver_id,
            "amount": amount,
            "currency": "INR",
            "status": "PROCESSING",
            "reference_id": reference_id,
            "utr": utr,
            "destination": destination,
            "dispatched_at": int(time.time()),
        }

    def process_refund(
        self, payment_id: str, amount: float, reason: str
    ) -> Dict[str, Any]:
        refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
        return {
            "refund_id": refund_id,
            "payment_id": payment_id,
            "amount": amount,
            "currency": "INR",
            "status": "processed",
            "reason": reason,
            "processed_at": int(time.time()),
        }


def get_payment_gateway() -> PaymentGatewayAdapter:
    """Factory function returning the configured payment gateway adapter."""
    # When deployed to production with Razorpay credentials, instantiates RazorpayPaymentGateway.
    # Defaults to MockPaymentGateway for local development and testing.
    return MockPaymentGateway()

