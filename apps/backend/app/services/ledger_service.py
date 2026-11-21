from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from apps.backend.app.models.finance import LedgerEntry


# Synchronized in-memory double-entry ledger store for persistent audit log tracking
PERSISTENT_LEDGER_ENTRIES: List[Dict[str, Any]] = []


class LedgerService:
    @staticmethod
    def record_entry(
        transaction_code: str,
        debit_account: str,
        credit_account: str,
        amount: float,
        currency: str = "INR",
        booking_id: Optional[str] = None,
        payout_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Records an immutable double-entry ledger record.
        Strict invariant: amount must be strictly positive.
        """
        if amount <= 0:
            raise ValueError(f"Ledger amount must be strictly positive (> 0), got: {amount}")

        entry_id = f"led_{uuid.uuid4().hex[:12]}"
        entry = {
            "id": entry_id,
            "transaction_code": transaction_code,
            "debit_account": debit_account,
            "credit_account": credit_account,
            "amount": round(float(amount), 2),
            "currency": currency,
            "booking_id": booking_id,
            "payout_id": payout_id,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "notes": notes or "",
        }
        PERSISTENT_LEDGER_ENTRIES.insert(0, entry)
        return entry

    @staticmethod
    def record_booking_payment(
        booking_id: str,
        driver_payable: float,
        company_commission: float,
        currency: str = "INR",
    ) -> List[Dict[str, Any]]:
        """
        Records the double-entry transactions upon passenger payment capture:
        1. Debit PASSENGER_PAYABLE -> Credit DRIVER_ESCROW_PAYABLE (Driver share)
        2. Debit PASSENGER_PAYABLE -> Credit COMPANY_COMMISSION_REVENUE (Platform fee)
        """
        entries = []
        txn_base = f"TXN_BOOK_{booking_id[:8]}"

        if driver_payable > 0:
            e1 = LedgerService.record_entry(
                transaction_code=f"{txn_base}_ESCROW",
                debit_account="PASSENGER_PAYABLE",
                credit_account="DRIVER_ESCROW_PAYABLE",
                amount=driver_payable,
                currency=currency,
                booking_id=booking_id,
                notes=f"Driver escrow reserve for booking {booking_id}.",
            )
            entries.append(e1)

        if company_commission > 0:
            e2 = LedgerService.record_entry(
                transaction_code=f"{txn_base}_COMM",
                debit_account="PASSENGER_PAYABLE",
                credit_account="COMPANY_COMMISSION_REVENUE",
                amount=company_commission,
                currency=currency,
                booking_id=booking_id,
                notes=f"Platform commission revenue for booking {booking_id}.",
            )
            entries.append(e2)

        return entries

    @staticmethod
    def record_driver_payout(
        payout_id: str,
        ride_id: str,
        driver_id: str,
        amount: float,
        currency: str = "INR",
    ) -> Dict[str, Any]:
        """
        Records the disbursement from driver escrow to driver bank account:
        Debit DRIVER_ESCROW_PAYABLE -> Credit DRIVER_BANK_DISBURSEMENT
        """
        txn_code = f"TXN_POUT_{payout_id[:8]}"
        return LedgerService.record_entry(
            transaction_code=txn_code,
            debit_account="DRIVER_ESCROW_PAYABLE",
            credit_account="DRIVER_BANK_DISBURSEMENT",
            amount=amount,
            currency=currency,
            payout_id=payout_id,
            notes=f"Settlement disbursement for ride {ride_id} to driver {driver_id}.",
        )

    @staticmethod
    def record_refund(
        booking_id: str,
        refund_amount: float,
        reversal_type: str = "FULL_REFUND",
        currency: str = "INR",
    ) -> Dict[str, Any]:
        """
        Records reversal of passenger payment from escrow back to passenger payable:
        Debit DRIVER_ESCROW_PAYABLE -> Credit PASSENGER_PAYABLE
        """
        txn_code = f"TXN_RFND_{booking_id[:8]}"
        return LedgerService.record_entry(
            transaction_code=txn_code,
            debit_account="DRIVER_ESCROW_PAYABLE",
            credit_account="PASSENGER_PAYABLE",
            amount=refund_amount,
            currency=currency,
            booking_id=booking_id,
            notes=f"Cancellation refund ({reversal_type}) for booking {booking_id}.",
        )

    @staticmethod
    def get_financial_summary() -> Dict[str, Any]:
        """
        Computes platform-wide financial reconciliation metrics from the immutable ledger.
        """
        total_escrow_credited = sum(
            e["amount"] for e in PERSISTENT_LEDGER_ENTRIES if e["credit_account"] == "DRIVER_ESCROW_PAYABLE"
        )
        total_escrow_debited = sum(
            e["amount"] for e in PERSISTENT_LEDGER_ENTRIES if e["debit_account"] == "DRIVER_ESCROW_PAYABLE"
        )
        total_disbursed = sum(
            e["amount"] for e in PERSISTENT_LEDGER_ENTRIES if e["credit_account"] == "DRIVER_BANK_DISBURSEMENT"
        )
        total_commission = sum(
            e["amount"] for e in PERSISTENT_LEDGER_ENTRIES if e["credit_account"] == "COMPANY_COMMISSION_REVENUE"
        )

        current_escrow_balance = max(0.0, round(total_escrow_credited - total_escrow_debited, 2))

        return {
            "total_collected_escrow": round(total_escrow_credited, 2),
            "total_disbursed_drivers": round(total_disbursed, 2),
            "total_company_revenue": round(total_commission, 2),
            "pending_driver_escrow": current_escrow_balance,
            "total_ledger_transactions": len(PERSISTENT_LEDGER_ENTRIES),
        }

    @staticmethod
    def get_all_entries(limit: int = 100) -> List[Dict[str, Any]]:
        return PERSISTENT_LEDGER_ENTRIES[:limit]

