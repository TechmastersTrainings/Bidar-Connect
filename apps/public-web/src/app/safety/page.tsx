"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Car,
  MapPin,
  LifeBuoy,
  FileCheck,
  Radio,
  Lock,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Platform Trust & Safety Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Safety First on Every Kilometer
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Your safety is our top operational commitment. From mandatory document audits to real-time
          GPS journey monitoring and a dedicated highway emergency response pipeline, we ensure complete peace of mind.
        </p>
      </div>

      {/* 24/7 SOS Helpline Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white mb-12 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span>24/7 Dedicated Emergency Helpline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              NH 65 Highway Patrol & SOS Dispatch
            </h2>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              In-app SOS triggers instantly broadcast your live GPS coordinates, vehicle registration number,
              and driver details directly to our incident response center and your saved emergency contacts.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Direct Emergency Line
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1">
              +91 8482 112 112
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Available 24 Hours &bull; 7 Days a Week
            </div>
          </div>
        </div>
      </div>

      {/* 5-Layer Safety Pillars */}
      <div className="space-y-6 mb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Our 5-Layer Trust & Safety Pillars
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Engineered into every stage of the Bidar Connect ride lifecycle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1. 100% ID & Licence Verification
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every driver partner must submit a government-issued Driving Licence and Vehicle RC book.
              Our operations team manually audits credentials for validity, active status, and commercial restrictions before ride publishing is permitted.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              2. Vehicle Roadworthiness Standards
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vehicles must carry valid third-party or comprehensive motor insurance and up-to-date Pollution
              Under Control (PUC) certificates. Seating capacity is strictly restricted to prevent overcrowding.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              3. Live Journey GPS Telemetry
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Passengers can generate a secure shareable tracking link with one tap. Family members can track
              the vehicle&apos;s real-time progress along NH 65 on any mobile browser without installing an app.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              4. Women Commuter Safety Shield
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Female commuters can filter for women-only carpools, where both driver and co-passengers are
              exclusively verified female travelers, ensuring comfort and privacy on intercity commutes.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              5. Zero-Tolerance Suspension Policy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Any report of rash driving, overcharging, harassment, or route deviation results in immediate
              suspension of platform privileges pending investigation by the Chief Grievance Officer.
            </p>
          </div>

          {/* Emergency Escalation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Corridor Incident Response Network
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct operational tie-ups with toll booth response stations at Kamkole and highway emergency
              medical centers in Zaheerabad and Sangareddy for prompt physical assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Safety CTA */}
      <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Questions about our safety checks or verification protocol?
        </h3>
        <p className="text-xs text-slate-600 max-w-lg mx-auto mb-6">
          Reach out to our dedicated corridor operations safety team. We review every query within 24 hours.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
        >
          <span>Contact Platform Safety Officer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

