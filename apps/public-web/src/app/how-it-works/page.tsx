"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Car,
  ShieldCheck,
  CreditCard,
  QrCode,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  Banknote,
  Users,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<"PASSENGER" | "DRIVER">("PASSENGER");

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
          <Car className="w-3.5 h-3.5" />
          <span>Transparent Highway Cost-Sharing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Bidar Connect Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          A fair, legal, and verified carpooling platform connecting Bidar and Hyderabad.
          Whether you are booking a comfortable seat or sharing empty seats in your car,
          here is the complete process from departure to destination.
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 inline-flex p-1.5 bg-slate-200/80 rounded-2xl">
          <button
            onClick={() => setActiveTab("PASSENGER")}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "PASSENGER"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            For Commuters & Passengers
          </button>
          <button
            onClick={() => setActiveTab("DRIVER")}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "DRIVER"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            For Car Owners & Drivers
          </button>
        </div>
      </div>

      {/* Passenger Flow */}
      {activeTab === "PASSENGER" && (
        <div className="space-y-12">
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Search & Compare
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your travel date, pickup point in Bidar or Hyderabad, and seat requirements.
                  Review verified driver profiles, customer ratings, vehicle model, and exact departure times.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                100% ID-verified drivers
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Atomic Seat Hold
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select your preferred seat. The platform locks your seat with an automated 10-minute
                  atomic hold, preventing race conditions or double-bookings while you confirm.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                Guaranteed zero double-booking
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Regulated Escrow Pay
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay the regulated ₹310 fare securely via UPI, Card, or Netbanking. Your payment is held
                  in a secure escrow ledger and only settled to the driver after trip completion.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-600">
                Fixed ₹310 &bull; Zero surge pricing
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-lg flex items-center justify-center mb-4">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Board & Travel Safe
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive a digital ticket pass with QR code and driver contact. Board at your designated
                  NH 65 landmark. Share your live tracking link with family and travel with peace of mind.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                Live GPS & 24/7 SOS helpline
              </div>
            </div>
          </div>

          {/* Passenger CTA Banner */}
          <div className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-600/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Ready to book your next trip?</h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-lg">
                Explore scheduled morning and evening rides between Bidar and Hyderabad with instant confirmation.
              </p>
            </div>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <span>Open Passenger Booking Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Driver Flow */}
      {activeTab === "DRIVER" && (
        <div className="space-y-12">
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Driver KYC & Vehicle Registration
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload your valid Driving Licence and vehicle RC document. Our compliance team audits
                  document validity before activating your publishing permissions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                Swift KYC review within 2 hours
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Publish Your Commute
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Post your regular or occasional commute. Choose your departure time, pickup stop, and
                  number of available passenger seats (up to 4 seats).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                Automated ₹310 legal fare calculation
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Live Passenger Manifest
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Track confirmed passenger bookings in real-time. Contact passengers directly through
                  one-click calling to coordinate exact roadside pickup landmarks along NH 65.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600">
                Full passenger contact directory
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center mb-4">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Automated Bank Payout
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon marking the journey completed, our automated payout state machine verifies passenger
                  escrow and disburses ₹290 per seat directly to your bank account with official UTR reference.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-600">
                5-minute safety hold & instant settlement
              </div>
            </div>
          </div>

          {/* Driver CTA Banner */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Offset your fuel and toll costs legally</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
                Recover up to ₹870 to ₹1,160 per round-trip by sharing empty seats with verified commuters.
              </p>
            </div>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <span>Open Driver Partner Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Corridor Commuter Etiquette: Dos and Don'ts */}
      <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
          Corridor Travel Guidelines & Community Code
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Dos */}
          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-100 space-y-3">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span>Recommended Practices (Dos)</span>
            </h3>
            <ul className="space-y-2.5 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Be punctual:</strong> Arrive at the designated pickup landmark 10 minutes before scheduled departure.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Travel light:</strong> One standard cabin bag (up to 15 kg) and one laptop backpack per passenger.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Seatbelts compulsory:</strong> Both front and rear passengers must wear seatbelts at all times on NH 65.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Respect fellow riders:</strong> Keep phone calls brief and use headphones for personal media.
                </span>
              </li>
            </ul>
          </div>

          {/* Don'ts */}
          <div className="bg-red-50/60 rounded-2xl p-6 border border-red-100 space-y-3">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span>Strict Prohibitions (Don&apos;ts)</span>
            </h3>
            <ul className="space-y-2.5 text-slate-700">
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <span>
                  <strong>No cash haggling:</strong> Drivers may not request additional fees beyond the platform-regulated fare.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <span>
                  <strong>No smoking or alcohol:</strong> Absolutely zero tolerance for intoxication or tobacco in vehicles.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <span>
                  <strong>No unauthorized detours:</strong> Drivers cannot divert off the registered NH 65 route without consensus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <span>
                  <strong>No commercial luggage:</strong> Courier packages and commercial trade goods are strictly prohibited.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

