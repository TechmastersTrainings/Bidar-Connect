import React from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  ExternalLink,
} from "lucide-react";

export function DriverPayoutsTab() {
  const payouts = [
    {
      payout_id: "PO_20261105_01",
      ride_id: "ride_b2h_001",
      amount: 870.0,
      seats: 3,
      status: "PROCESSING",
      buffer_seconds_left: 180,
      utr: "Pending 5-min Safety Hold Buffer",
      created_at: "Today, 10:15 AM",
    },
    {
      payout_id: "PO_20261028_09",
      ride_id: "ride_h2b_092",
      amount: 1160.0,
      seats: 4,
      status: "SETTLED",
      buffer_seconds_left: 0,
      utr: "UTR_SBI_20261028_998145",
      created_at: "Oct 28, 2026",
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold text-slate-900">Driver Payouts & Escrow</h1>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
          INR 290 / seat
        </span>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-3xl p-5 text-white shadow-lg border border-slate-800 space-y-3">
        <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
          Total Settled Earnings
        </div>
        <div className="text-3xl font-black text-white">INR 12,470</div>
        <p className="text-[11px] text-slate-400">
          Disbursed directly to State Bank of India account (&bull;&bull;&bull;&bull; 8192) via IMPS/NEFT.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pending Escrow</span>
            <span className="font-bold text-amber-400 text-sm">INR 870.00</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Safety Buffer Hold</span>
            <span className="font-bold text-emerald-400 text-sm">5 Minutes</span>
          </div>
        </div>
      </div>

      {/* Payouts List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
          Recent Settlements & Queued Payouts
        </div>

        {payouts.map((p) => (
          <div
            key={p.payout_id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-mono text-xs font-bold text-slate-900">{p.payout_id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === "SETTLED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                }`}
              >
                {p.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Trip: {p.ride_id} ({p.seats} seats)</span>
              <span className="font-black text-slate-900 text-sm">INR {p.amount.toFixed(2)}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank UTR Reference:</span>
                <span className="font-mono font-bold text-slate-800">{p.utr}</span>
              </div>
              <div className="text-slate-400">{p.created_at}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

