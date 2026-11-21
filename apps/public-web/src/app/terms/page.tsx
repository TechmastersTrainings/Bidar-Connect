"use client";

import React from "react";
import Link from "next/link";
import { FileText, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Last Updated: November 1, 2026 &bull; Governing Intercity Carpooling on Bidar ⇄ Hyderabad (NH 65)
        </p>
      </div>

      <div className="prose prose-slate max-w-none text-xs text-slate-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Nature of the Platform</h2>
          <p>
            Bidar Connect operates strictly as a digital technology intermediary facilitating non-commercial,
            private commuter cost-sharing pursuant to Section 66 and Section 2(7) of the Motor Vehicles Act, 1988.
            Bidar Connect is not a taxi aggregator, stage carriage carrier, or common carrier. Rides offered on
            the platform represent voluntary expense-sharing arrangements between private vehicle owners and
            passengers traveling on the same route.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Eligibility & Verification</h2>
          <p>
            To use the platform, users must be at least 18 years of age. All users must authenticate via
            cryptographically verified phone OTP. Drivers must upload valid, unexpired Driving Licences and
            vehicle Registration Certificates. Providing false, forged, or expired documentation constitutes a
            material breach and will result in permanent disqualification and referral to law enforcement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Non-Commercial Fare Invariant</h2>
          <p>
            In compliance with Rule BR-PRC-01, the fare for travel across the Bidar ⇄ Hyderabad corridor is
            strictly fixed at ₹310 per passenger seat. Drivers are expressly forbidden from soliciting cash,
            negotiating off-platform surcharges, or demanding tolls directly from passengers. All financial
            settlements are governed by the platform&apos;s double-entry escrow ledger.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Driver Representations & Warranties</h2>
          <p>Every driver partner offering empty seats warrants that:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>They hold a valid, unexpired Motor Driving Licence for Light Motor Vehicles (LMV).</li>
            <li>The vehicle holds a valid Registration Certificate (RC), valid insurance, and unexpired PUC.</li>
            <li>The vehicle is maintained in roadworthy, safe mechanical operating condition.</li>
            <li>They shall adhere to all Indian Road Traffic Regulations and speed limits along NH 65.</li>
            <li>They will not operate under the influence of alcohol, drugs, or impairing medication.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Passenger Conduct & Obligations</h2>
          <p>Passengers utilizing Bidar Connect agree to:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Arrive at the designated pickup landmark at least 10 minutes prior to departure.</li>
            <li>Wear safety seatbelts for the entire duration of the journey.</li>
            <li>Refrain from carrying flammable items, illegal substances, or hazardous cargo.</li>
            <li>Treat driver partners and fellow passengers with dignity and courtesy.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Bidar Connect Technologies Pvt. Ltd. shall not
            be liable for indirect, incidental, special, or consequential damages resulting from highway traffic
            delays, vehicle breakdowns, weather events, or road closures along NH 65. Primary liability for motor
            vehicle operations resides with the vehicle driver under the Motor Vehicles Act.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">7. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of India. Any
            disputes arising out of or in connection with the platform shall be subject to the exclusive
            jurisdiction of the competent courts in Bidar, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
}

