"use client";

import React from "react";
import Link from "next/link";
import {
  Car,
  Phone,
  Mail,
  MapPin,
  Shield,
  LifeBuoy,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Emergency Highway Banner */}
      <div className="bg-blue-950 border-b border-blue-900/60 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-semibold text-white">
              24/7 NH 65 Highway Emergency & Incident Dispatch:
            </span>
            <span className="font-mono text-emerald-300 font-bold tracking-wide">
              +91 8482 112 112
            </span>
          </div>
          <div className="flex items-center gap-4 text-blue-300">
            <Link
              href="/safety"
              className="hover:text-white transition-colors underline underline-offset-2 flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Safety Protocol</span>
            </Link>
            <span className="text-blue-800">|</span>
            <Link
              href="/contact"
              className="hover:text-white transition-colors underline underline-offset-2 flex items-center gap-1"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Report Grievance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block">
                  Bidar Connect
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase block">
                  Central Intercity Carpooling Platform
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Organised commuter cost-sharing connecting Bidar and Hyderabad via NH 65.
              Operated strictly on a fuel and toll cost-sharing basis in full compliance with
              Section 66 of the Motor Vehicles Act, 1988. Zero surge pricing, 100% verified identities.
            </p>

            <div className="pt-2 text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Station Road, Bidar, Karnataka 585401, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a
                  href="mailto:support@bidarconnect.in"
                  className="hover:text-white transition-colors"
                >
                  support@bidarconnect.in
                </a>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/routes" className="hover:text-white transition-colors">
                  Corridor Stops & Schedule
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How Carpooling Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Transparent Fare (INR 310)
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors">
                  KYC Verification & Safety
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-blue-400"
                >
                  <span>Passenger Booking Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:3002"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-blue-400"
                >
                  <span>Driver Partner Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Regulatory */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal & Compliance
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block pt-1">
                  Compliant with IT Rules 2021 & Motor Vehicles Act 1988
                </span>
              </li>
            </ul>
          </div>

          {/* Statutory Grievance Redressal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Grievance Officer
            </h4>
            <div className="text-xs text-slate-400 space-y-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <p className="font-semibold text-slate-200">
                Rule 3(2) IT Rules, 2021
              </p>
              <p className="text-[11px]">
                Nodal Grievance Officer:
                <br />
                <span className="text-slate-200 font-medium">
                  Anand V. Biradar
                </span>
              </p>
              <p className="text-[11px]">
                Email:
                <br />
                <a
                  href="mailto:grievance@bidarconnect.in"
                  className="text-blue-400 hover:underline"
                >
                  grievance@bidarconnect.in
                </a>
              </p>
              <p className="text-[11px] text-slate-500">
                Turnaround: Acknowledged within 24h; resolved within 15 days.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} Bidar Connect Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Bidar ⇄ Hyderabad (135 km)</span>
            <span>&bull;</span>
            <span>NH 65 Expressway</span>
            <span>&bull;</span>
            <span>Regulated Fare: INR 310</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

