"use client";

import React from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2, Lock, FileText } from "lucide-react";

export default function CookiePolicyPage() {
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
          Cookie & Local Storage Policy
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Effective Date: November 1, 2026 &bull; Compliant with IT Rules 2021 & DPDP Act 2023
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-xs text-slate-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. What are Cookies and Local Storage?</h2>
          <p>
            Cookies and browser local storage are small text files placed on your device to enable core website
            functionality, remember your login session, and store offline digital tickets so they can be viewed
            without internet access along highway dead-zones on NH 65.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Categories of Storage We Use</h2>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Essential & Authentication Storage (Strictly Necessary)</span>
              </div>
              <p className="text-slate-600">
                These are mandatory for the platform to function. They store your cryptographically signed
                session token (<code className="font-mono bg-slate-100 px-1 rounded">bidar_token</code>), user identity, and role.
                They cannot be disabled as the booking system cannot operate without them.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Offline Ticket Vault Storage</span>
              </div>
              <p className="text-slate-600">
                Caches encrypted digital boarding passes on your device (<code className="font-mono bg-slate-100 px-1 rounded">bidar_offline_tickets</code>).
                This ensures you can always present your QR ticket to the driver even when traveling through
                highway cell tower dead-zones between Zaheerabad and Humnabad.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Cookie className="w-4 h-4 text-slate-600" />
                <span>Preference & Safety Settings</span>
              </div>
              <p className="text-slate-600">
                Remembers user interface preferences such as Women-Only ride filter status and app mode (Passenger vs Driver).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Zero Third-Party Advertising Trackers</h2>
          <p>
            Bidar Connect strictly maintains an ad-free platform. We do not use third-party advertising cookies,
            cross-site tracking pixels (e.g. Meta Pixel, TikTok, ad retargeting networks), or data brokering trackers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. How to Manage Cookies</h2>
          <p>
            You can control and manage cookies through your browser settings. Please note that removing or blocking
            essential session cookies will prevent you from signing in or confirming seat bookings.
          </p>
        </section>
      </div>
    </div>
  );
}

