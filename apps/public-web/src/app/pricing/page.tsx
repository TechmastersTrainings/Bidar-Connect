"use client";

import React from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  XCircle,
  Car,
  Fuel,
  CreditCard,
  FileText,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export default function PricingPage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Regulated Pricing Policy &bull; Rule BR-PRC-01</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Flat INR 310. Zero Hidden Charges.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          We believe highway travel should be transparent and predictable. Our fare is strictly calculated
          to cover actual fuel and toll costs without commercial taxi markups or algorithmic surge pricing.
        </p>
      </div>

      {/* Main Fare Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-200">
              Bidar ⇄ Hyderabad (NH 65 Standard Rate)
            </div>
            <div className="text-4xl sm:text-5xl font-black mt-1">
              INR 310
              <span className="text-sm font-semibold text-blue-200 ml-2">/ seat (All-Inclusive)</span>
            </div>
            <p className="text-xs text-blue-100 mt-2 max-w-md">
              Valid across all intermediate points between Bidar and Hyderabad with zero platform surge multipliers.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Surge Multiplier
            </div>
            <div className="text-3xl font-black text-white mt-0.5">1.0x Always</div>
            <div className="text-[11px] text-blue-200 mt-1">Rain &bull; Festivals &bull; Peak Hours</div>
          </div>
        </div>

        {/* Fare Breakdown Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Driver Share */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Driver Cost-Recovery</h3>
                  <p className="text-xs text-slate-500">Settled to driver&apos;s bank account</p>
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">INR 290</div>
            </div>

            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Fuel Cost Share:</strong> Offsets ~11 liters of petrol/diesel consumed across the 135 km highway stretch.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>FASTag Highway Tolls:</strong> Covers pro-rata share of Kamkole Toll Plaza toll charges on NH 65.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Guaranteed Payout:</strong> Credited automatically within 5 minutes of trip completion.
                </span>
              </li>
            </ul>
          </div>

          {/* Platform Maintenance */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform & Safety Fee</h3>
                  <p className="text-xs text-slate-500">Bidar Connect platform maintenance</p>
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">INR 20</div>
            </div>

            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Driver Verification:</strong> Administrative verification of Driving Licence and RC documents.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>24/7 SOS Telemetry:</strong> Highway incident response server and real-time GPS tracking.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Payment Processing & SMS:</strong> Banking gateway processing and multi-channel notification dispatches.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Corridor Travel Mode Economic Comparison */}
      <div className="mb-14">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How Does Bidar Connect Compare?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Corridor travel cost and convenience comparison for a single adult commuter (Bidar ⇄ Hyderabad)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Travel Mode</th>
                <th className="py-3.5 px-4">Average Cost</th>
                <th className="py-3.5 px-4">Travel Duration</th>
                <th className="py-3.5 px-4">Comfort & AC</th>
                <th className="py-3.5 px-4">Doorstep/Landmark Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr className="bg-blue-50/50 font-semibold text-slate-900">
                <td className="py-3.5 px-4 flex items-center gap-2 text-blue-700">
                  <Car className="w-4 h-4" />
                  <span>Bidar Connect Carpool</span>
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-600">INR 310 (Fixed)</td>
                <td className="py-3.5 px-4">2.5 Hours</td>
                <td className="py-3.5 px-4 text-emerald-700">Personal Car AC</td>
                <td className="py-3.5 px-4">Direct NH 65 Landmarks</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-slate-800">Private Taxi / Solo Cab</td>
                <td className="py-3.5 px-4 font-bold text-red-600">INR 2,400 - 3,200</td>
                <td className="py-3.5 px-4">2.5 Hours</td>
                <td className="py-3.5 px-4">AC Cab</td>
                <td className="py-3.5 px-4">Doorstep</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-slate-800">State RTC Bus (Airavat / Deluxe)</td>
                <td className="py-3.5 px-4">INR 240 - 290</td>
                <td className="py-3.5 px-4 text-amber-700">3.5 - 4.5 Hours</td>
                <td className="py-3.5 px-4">Variable / Crowded</td>
                <td className="py-3.5 px-4 text-slate-500">Only fixed central bus depots</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-slate-800">Passenger Train</td>
                <td className="py-3.5 px-4">INR 90 - 180</td>
                <td className="py-3.5 px-4 text-red-700">4.0+ Hours (Infrequent)</td>
                <td className="py-3.5 px-4">Non-AC General / Sleeper</td>
                <td className="py-3.5 px-4 text-slate-500">Only railway stations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Legal Cost-Sharing Statement */}
      <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Statutory Compliance: Section 66 of Motor Vehicles Act, 1988</span>
        </h3>
        <p className="leading-relaxed">
          Bidar Connect is strictly a non-commercial carpooling coordination platform. Fares are computed
          strictly to share running expenses (fuel, highway tolls, and routine maintenance) between private
          vehicle owners and passengers traveling on the same route. Vehicle owners do not generate commercial
          profits or operate as taxi permit carriers.
        </p>
      </div>
    </div>
  );
}

