"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Menu,
  X,
  Search,
  PlusCircle,
  Lock,
  Route,
  HelpCircle,
  IndianRupee,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { OfferSeatsModal } from "./OfferSeatsModal";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3.5 gap-4">
            {/* Brand Logo & Highway Corridor Status */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-200">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  Bidar Connect
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase leading-none whitespace-nowrap">
                    NH 65 Corridor
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Pill Bar */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/70 shadow-inner backdrop-blur-sm shrink-0">
              <Link
                href="/routes"
                className="whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-full px-3.5 py-1.5 transition-all duration-150"
              >
                Corridor Routes
              </Link>
              <Link
                href="/how-it-works"
                className="whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-full px-3.5 py-1.5 transition-all duration-150"
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                className="whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-full px-3.5 py-1.5 transition-all duration-150"
              >
                Transparent Fare
              </Link>
              <Link
                href="/safety"
                className="whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-full px-3.5 py-1.5 transition-all duration-150"
              >
                Safety Standards
              </Link>
              <Link
                href="/contact"
                className="whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-full px-3.5 py-1.5 transition-all duration-150"
              >
                Grievance & Support
              </Link>
            </nav>

            {/* Desktop Quick Portal Action Buttons */}
            <div className="hidden sm:flex items-center gap-2 xl:gap-2.5 shrink-0">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow hover:border-blue-200 active:scale-95"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Find Ride</span>
              </a>

              <button
                type="button"
                onClick={() => setOfferModalOpen(true)}
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm hover:shadow-md hover:shadow-blue-600/25 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span>Offer Seats</span>
              </button>

              <a
                href="http://localhost:3003"
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                title="Platform Governance & Dispatch Operations"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Admin</span>
              </a>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-1.5 text-sm font-semibold text-slate-700">
              <Link
                href="/routes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Route className="w-4 h-4 text-blue-600" />
                <span>Corridor Routes & Stops</span>
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>How It Works</span>
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <span>Transparent Pricing (INR 310)</span>
              </Link>
              <Link
                href="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Safety Standards</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <LifeBuoy className="w-4 h-4 text-blue-600" />
                <span>Grievance & Support</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-2.5">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Book Ride (Passenger Portal)</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setOfferModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Offer Empty Seats (Driver Portal)</span>
              </button>
              <a
                href="http://localhost:3003"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Governance Portal</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Driver Onboarding & Sign In Modal */}
      <OfferSeatsModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
      />
    </>
  );
}

