"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Car,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Download,
  Lock,
  Compass,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [host, setHost] = useState("localhost");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname) {
      setHost(window.location.hostname);
    }
  }, []);

  const unifiedUrl = `http://${host}:3001`;
  const adminUrl = `http://${host}:3003`;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-200">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>Unified Access Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Bidar Connect
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          One account for both riders and drivers. Sign in with your mobile number to search rides, publish departures, or download the Android app.
        </p>
      </div>

      {/* Access Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Single Unified Portal */}
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            All-In-One
          </div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Riders & Drivers</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Bidar Connect Portal</h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Unified web application. Use a single login to book verified seats on NH 65 or switch seamlessly to Driver Mode to publish rides.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Single login for Passenger and Driver modes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Fixed fare: ₹310 total / ₹290 net to driver</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant mode switcher with no re-login</span>
              </li>
            </ul>
          </div>

          <a
            href={unifiedUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <span>Sign In to Bidar Connect</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Card 2: Native Android APK */}
        <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-2xl border border-blue-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Mobile Mobility</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Android Application</h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Experience the unified Android app with one-tap passenger and driver switching, offline passes, and 24/7 SOS helpline.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Built for Android 14 (Target SDK 34)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>One single phone number login</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero letterbox fullscreen layout</span>
              </li>
            </ul>
          </div>

          <a
            href="/bidar-connect.apk"
            download="bidar-connect.apk"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download bidar-connect.apk</span>
          </a>
        </div>

        {/* Card 3: Admin Governance Portal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 border border-slate-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Operations</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Admin Governance</h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Platform administration console for driver KYC approvals, ride auditing, price controls, and SOS dispatch.
            </p>

            <ul className="space-y-2 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Driver KYC & vehicle approvals</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Corridor ride & passenger audit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>24/7 SOS helpline control room</span>
              </li>
            </ul>
          </div>

          <a
            href={adminUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <span>Open Admin Console</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
