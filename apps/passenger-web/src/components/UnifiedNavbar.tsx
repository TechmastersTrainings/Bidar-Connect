"use client";

import React, { useState } from "react";
import { useAuth, AppMode } from "../contexts/AuthContext";
import {
  Car,
  Users,
  ShieldCheck,
  AlertTriangle,
  Phone,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X
} from "lucide-react";

interface UnifiedNavbarProps {
  onOpenAuth: (mode?: "LOGIN" | "REGISTER") => void;
  onOpenDriverOnboard: () => void;
  onSelectTab: (tab: string) => void;
  activeTab: string;
}

export function UnifiedNavbar({
  onOpenAuth,
  onOpenDriverOnboard,
  onSelectTab,
  activeTab
}: UnifiedNavbarProps) {
  const { user, isAuthenticated, activeMode, setActiveMode, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleModeSwitch = (targetMode: AppMode) => {
    if (targetMode === "DRIVER") {
      if (!isAuthenticated) {
        onOpenAuth("LOGIN");
        return;
      }
      if (!user?.is_driver) {
        onOpenDriverOnboard();
        return;
      }
    }
    setActiveMode(targetMode);
  };

  const userInitials = (user?.full_name || "BC")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5 text-blue-400" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    Bidar Connect
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    NH 65
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Your Journey, Connected.
                </span>
              </div>
            </a>
          </div>

          {/* Center: Prominent Segmented Mode Switcher */}
          <div className="flex items-center">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => handleModeSwitch("PASSENGER")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMode === "PASSENGER"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Passenger Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch("DRIVER")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMode === "DRIVER"
                    ? "bg-slate-900 text-amber-400 shadow-sm border border-slate-800"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Driver Partner</span>
                {isAuthenticated && !user?.is_driver && (
                  <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    Activate
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Actions, SOS & User Profile */}
          <div className="flex items-center gap-3">
            {/* 24/7 Helpline Pill */}
            <a
              href="tel:+918482112112"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
              title="24/7 Corridor Emergency SOS Helpline"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS: 8482 112 112</span>
            </a>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                    {userInitials}
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[120px]">
                      {user?.full_name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 block leading-tight">
                      {activeMode === "DRIVER" ? "Driver Partner" : "Commuter"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{user?.full_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{user?.phone}</div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Verified Passenger
                        </span>
                        {user?.is_driver && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Verified Driver
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleModeSwitch(activeMode === "DRIVER" ? "PASSENGER" : "DRIVER");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between font-semibold"
                      >
                        <span>Switch to {activeMode === "DRIVER" ? "Passenger Mode" : "Driver Mode"}</span>
                        {activeMode === "DRIVER" ? <Users className="w-4 h-4 text-blue-600" /> : <Car className="w-4 h-4 text-amber-500" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab("PROFILE");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Shared Profile & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab(activeMode === "PASSENGER" ? "MY_BOOKINGS" : "EARNINGS");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>{activeMode === "PASSENGER" ? "My Bookings & Passes" : "Settlement Ledger"}</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth("LOGIN")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth("REGISTER")}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

