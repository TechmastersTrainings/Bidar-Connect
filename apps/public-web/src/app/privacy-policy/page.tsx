"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileText, Lock, Mail, MapPin } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Effective Date: November 1, 2026 &bull; Compliant with Digital Personal Data Protection Act (DPDP Act, 2023)
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-xs text-slate-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Commitment to Personal Data Protection</h2>
          <p>
            Bidar Connect Technologies Pvt. Ltd. (&quot;Bidar Connect&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to
            protecting the personal privacy of all passengers, car owners, drivers, and platform visitors.
            This Privacy Policy governs the collection, processing, storage, and rights concerning personal data
            collected through our web portals and mobile applications, in accordance with India&apos;s Digital
            Personal Data Protection Act (DPDP Act, 2023) and the Information Technology Act, 2000.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Categories of Data Collected</h2>
          <p>We collect and process the minimum information necessary to execute lawful commuter carpooling:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              <strong>Identity & Authentication Data:</strong> Mobile phone number, verified OTP tokens, full legal name,
              and optional email address.
            </li>
            <li>
              <strong>Driver Partner KYC Data:</strong> Driving Licence number, expiration date, vehicle Registration
              Certificate (RC) details, vehicle make/model/color, and insurance validity documents.
            </li>
            <li>
              <strong>Location & Trip Telemetry:</strong> Pickup and drop landmarks selected by the user, and real-time
              GPS coordinates strictly while an active journey is in progress to power safety tracking and emergency SOS.
            </li>
            <li>
              <strong>Financial & Transaction Records:</strong> Payment gateway order identifiers, transaction amounts,
              GST breakdown, and bank account/UPI identifiers for driver reimbursement payouts. We do not store credit card numbers, CVVs, or UPI MPINs.
            </li>
            <li>
              <strong>Safety & Emergency Contacts:</strong> Names and phone numbers of nominated emergency contacts
              provided by commuters for distress alerts.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Purpose and Legal Basis for Processing</h2>
          <p>We process personal data solely for specified lawful purposes:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Facilitating carpool matching and coordinate communication between passengers and drivers.</li>
            <li>Verifying the identity of drivers and vehicle roadworthiness to maintain passenger safety.</li>
            <li>Triggering real-time emergency dispatch and relaying coordinates to highway patrol upon SOS actuation.</li>
            <li>Processing double-entry financial ledger reimbursements and preventing commercial fare gouging.</li>
            <li>Complying with statutory reporting mandates under the Motor Vehicles Act and Information Technology Rules.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Data Sharing & Third-Party Disclosures</h2>
          <p>
            Bidar Connect never sells, rents, or monetizes personal data. Data is shared exclusively under strict confidentiality agreements with:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Co-passengers and drivers (only first name, phone number, vehicle details, and pickup landmarks).</li>
            <li>RBI-authorized payment gateway aggregators for processing escrow collections and settlements.</li>
            <li>SMS, WhatsApp, and push notification gateway providers for dispatching security OTPs and trip advisories.</li>
            <li>Law enforcement agencies or highway traffic police strictly upon receipt of valid judicial warrants or in life-threatening emergencies.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Data Retention & User Rights</h2>
          <p>
            You have the right under the DPDP Act to access, rectify, or request erasure of your personal data.
            Account deletion requests are processed within 30 days, subject to mandatory statutory retention
            periods required for financial audit trails under Indian tax law.
          </p>
        </section>

        <section className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">6. Data Protection & Grievance Contact</h2>
          <p className="text-slate-600">
            For inquiries regarding your personal data or to exercise your statutory rights, please contact our Data Protection Officer:
          </p>
          <div className="mt-2 space-y-1 text-slate-700">
            <p><strong>Officer:</strong> Anand V. Biradar, Chief Grievance Officer</p>
            <p><strong>Email:</strong> privacy@bidarconnect.in</p>
            <p><strong>Address:</strong> Station Road, Bidar, Karnataka 585401, India</p>
          </div>
        </section>
      </div>
    </div>
  );
}

