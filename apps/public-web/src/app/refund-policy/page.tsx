"use client";

import React from "react";
import Link from "next/link";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wider">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-500">Legal</span>
      </div>

      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cancellation & Refund Policy
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Governed by Business Rules BR-REF-01 and BR-REF-02 &bull; Effective November 1, 2026
        </p>
      </div>

      <div className="space-y-8 text-xs text-slate-700 leading-relaxed">
        {/* Intro */}
        <p>
          At Bidar Connect, our goal is to maintain absolute financial fairness for both commuters and car
          owners. Because carpooling relies on committed seat availability along the NH 65 corridor, cancellations
          are governed by automated time-tiered rules programmed directly into our double-entry ledger engine.
        </p>

        {/* Passenger Cancellation Policy (Rule BR-REF-01) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. Passenger Cancellations (Rule BR-REF-01)
              </h2>
              <p className="text-xs text-slate-500">
                Tiered refund schedule based on time elapsed before scheduled departure
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="py-3 px-4 border-b border-slate-200">Cancellation Window</th>
                  <th className="py-3 px-4 border-b border-slate-200">Refund Percentage</th>
                  <th className="py-3 px-4 border-b border-slate-200">Refund Amount (per ₹310 seat)</th>
                  <th className="py-3 px-4 border-b border-slate-200">Driver Cost Compensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="bg-emerald-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    More than 2 hours before departure
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600">100% Full Refund</td>
                  <td className="py-3 px-4 font-bold text-slate-900">INR 310.00</td>
                  <td className="py-3 px-4 text-slate-500">Seat released back to corridor inventory</td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Between 1 and 2 hours before departure
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-700">50% Partial Refund</td>
                  <td className="py-3 px-4 font-bold text-slate-900">INR 155.00</td>
                  <td className="py-3 px-4 text-slate-700">INR 135.00 settled to driver for late vacancy</td>
                </tr>
                <tr className="bg-red-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Less than 1 hour before departure or No-Show
                  </td>
                  <td className="py-3 px-4 font-bold text-red-600">0% Non-Refundable</td>
                  <td className="py-3 px-4 font-bold text-slate-900">INR 0.00</td>
                  <td className="py-3 px-4 text-slate-700">INR 290.00 settled to driver</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Driver Cancellation Policy (Rule BR-REF-02) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Driver Cancellations (Rule BR-REF-02)
              </h2>
              <p className="text-xs text-slate-500">
                100% passenger guarantee in the event a car owner cancels a scheduled trip
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p>
              If a driver cancels a confirmed ride at any time prior to departure, our platform automatically triggers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Immediate 100% Refund:</strong> All confirmed passengers are refunded ₹310 in full to their original payment method with zero deductions.
              </li>
              <li>
                <strong>Alternative Ride Priority:</strong> Passengers receive immediate SMS alert with available alternate driver matches along NH 65.
              </li>
              <li>
                <strong>Driver Reliability Audit:</strong> Drivers who cancel trips incur an internal reliability penalty. Repeated cancellations trigger administrative review and temporary suspension.
              </li>
            </ul>
          </div>
        </section>

        {/* Reversal Timelines */}
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            3. Refund Settlement Timelines
          </h2>
          <p>
            Approved refunds are credited back to the original source instrument automatically:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>UPI Payments:</strong> 2 to 4 hours (instant for most major banking apps).</li>
            <li><strong>Debit / Credit Cards:</strong> 2 to 5 business days depending on the issuing bank.</li>
            <li><strong>Netbanking:</strong> 2 to 4 business days.</li>
          </ul>
        </section>

        {/* Grievance Escalation */}
        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            4. Disputed Cancellations & Grievance
          </h2>
          <p className="text-slate-600">
            If you experienced an emergency roadside breakdown, medical emergency, or driver no-show, please submit
            a grievance report with your ticket reference code. Our Chief Grievance Officer reviews and approves
            exceptional refund overrides within 24 hours.
          </p>
          <div className="mt-4">
            <Link
              href="/contact"
              className="text-blue-600 hover:underline font-semibold"
            >
              Submit Refund Grievance &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

