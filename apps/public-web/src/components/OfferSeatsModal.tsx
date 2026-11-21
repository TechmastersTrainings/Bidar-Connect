"use client";

import React, { useState } from "react";
import {
  X,
  Car,
  User,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

interface OfferSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "REGISTER" | "LOGIN";
}

export function OfferSeatsModal({
  isOpen,
  onClose,
  initialMode = "REGISTER",
}: OfferSeatsModalProps) {
  const [mode, setMode] = useState<"REGISTER" | "LOGIN">(initialMode);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleMakeModel, setVehicleMakeModel] = useState("Maruti Suzuki Ertiga");
  const [vehicleReg, setVehicleReg] = useState("KA 38 M 4120");
  const [fuelType, setFuelType] = useState("DIESEL");
  const [capacity, setCapacity] = useState(4);
  const [licenceNumber, setLicenceNumber] = useState("KA382022004120");
  const [termsAccepted, setTermsAccepted] = useState(true);

  // OTP State
  const [otp, setOtp] = useState("123456");
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>("123456");

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getApiBase = () => {
    if (typeof window !== "undefined" && window.location.hostname) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    return "http://127.0.0.1:8000/api/v1";
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (mode === "REGISTER") {
      if (!fullName.trim()) {
        setError("Full legal name as per Driving Licence is required.");
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("A valid corporate or personal email address is mandatory for trip payouts and KYC.");
        return;
      }
      if (!vehicleReg.trim()) {
        setError("Vehicle registration plate number is required.");
        return;
      }
      if (!licenceNumber.trim()) {
        setError("Valid Driving Licence number is required.");
        return;
      }
      if (!termsAccepted) {
        setError("You must acknowledge the Motor Vehicles Act non-commercial cost-sharing terms.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${cleanPhone}` }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to dispatch verification code.");
        return;
      }

      const code = data.data?.dev_otp || "123456";
      setSuggestedOtp(code);
      setOtp(code);
      setStep("OTP");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Network error communicating with authentication service.");
    }
  };

  const handleVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = `+91${phone.trim().replace(/\s+/g, "")}`;
      const res = await fetch(`${getApiBase()}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          otp,
          full_name: mode === "REGISTER" ? fullName.trim() : undefined,
          email: mode === "REGISTER" ? email.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        setLoading(false);
        setError(data.error?.message || "Invalid or expired verification code.");
        return;
      }

      const token = data.data.access_token;
      const user = data.data.user;

      // If new registration, onboard driver profile and add vehicle
      if (mode === "REGISTER") {
        try {
          // 1. Onboard driver profile
          await fetch(`${getApiBase()}/auth/driver-onboard`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              licence_number: licenceNumber.trim().toUpperCase(),
              licence_expiry: "2029-12-31",
              licence_document_id: `doc_licence_${Date.now()}`,
              payout_upi_id: `${cleanPhone.replace("+91", "")}@upi`,
            }),
          });

          // 2. Register initial vehicle
          const parts = vehicleMakeModel.trim().split(" ");
          const make = parts[0] || "Maruti Suzuki";
          const model = parts.slice(1).join(" ") || "Ertiga";

          await fetch(`${getApiBase()}/driver/vehicles`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              make,
              model,
              registration_number: vehicleReg.trim().toUpperCase(),
              color: "Arctic White",
              year: 2023,
              fuel_type: fuelType,
              passenger_capacity: capacity,
            }),
          });
        } catch (onboardErr) {
          console.warn("Driver onboarding post-hook notice:", onboardErr);
        }
      }

      // Persist session into local storage for the driver portal
      if (typeof window !== "undefined") {
        localStorage.setItem("bidar_driver_token", token);
        localStorage.setItem("bidar_driver_user", JSON.stringify(user));
      }

      setLoading(false);
      setSuccessMessage("Authentication successful! Redirecting to Driver Portal...");

      setTimeout(() => {
        onClose();
        window.open("http://localhost:3002", "_blank");
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Verification failed. Please retry.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-xs">
              <Car className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {step === "OTP"
                  ? "Verify Driver Mobile"
                  : mode === "REGISTER"
                  ? "Driver Partner Onboarding"
                  : "Driver Partner Sign In"}
              </h2>
              <p className="text-xs text-slate-400">
                Bidar ⇄ Hyderabad (NH 65 Corridor) Verified Driver Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {step === "FORM" && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("REGISTER");
                setError(null);
              }}
              className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "REGISTER"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Driver Registration</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("LOGIN");
                setError(null);
              }}
              className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "LOGIN"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Existing Driver Sign In</span>
            </button>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 text-xs font-medium text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 text-xs font-medium text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === "FORM" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {mode === "REGISTER" && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Legal Name (as per Driving Licence) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address - MANDATORY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (Mandatory for Statements & KYC) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ramesh.patil@example.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tax receipts, payout notifications, and corridor manifests are delivered here.
                    </p>
                  </div>
                </>
              )}

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono tracking-wide font-medium transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
              </div>

              {mode === "REGISTER" && (
                <>
                  {/* Vehicle Information */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Vehicle & Licence Details
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Vehicle Make & Model
                        </label>
                        <input
                          type="text"
                          value={vehicleMakeModel}
                          onChange={(e) => setVehicleMakeModel(e.target.value)}
                          placeholder="e.g. Maruti Ertiga"
                          required
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Registration Plate
                        </label>
                        <input
                          type="text"
                          value={vehicleReg}
                          onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                          placeholder="e.g. KA 38 M 4120"
                          required
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Driving Licence Number
                        </label>
                        <input
                          type="text"
                          value={licenceNumber}
                          onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. KA382022004120"
                          required
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Passenger Capacity
                        </label>
                        <select
                          value={capacity}
                          onChange={(e) => setCapacity(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium"
                        >
                          <option value={1}>1 Passenger Seat</option>
                          <option value={2}>2 Passenger Seats</option>
                          <option value={3}>3 Passenger Seats</option>
                          <option value={4}>4 Passenger Seats</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Non-Commercial Terms */}
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-600 leading-tight">
                      I certify that I am offering empty seats for non-commercial cost-sharing under Section 66 of the Motor Vehicles Act 1988 with fixed regulated INR 310 corridor pricing.
                    </span>
                  </label>
                </>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "REGISTER"
                        ? "Verify Mobile & Complete Registration"
                        : "Verify Credentials & Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndComplete} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Enter 6-Digit Verification Code
                </h3>
                <p className="text-xs text-slate-500">
                  Code sent to <span className="font-semibold text-slate-800">+91 {phone}</span>
                </p>
              </div>

              {suggestedOtp && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-blue-800">
                    Local Development Bypass Code: <strong className="font-mono text-xs">{suggestedOtp}</strong>
                  </span>
                </div>
              )}

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-bold transition-all"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("FORM")}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Launch Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

