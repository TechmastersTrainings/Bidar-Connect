"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  ShieldCheck,
  Phone,
  User as UserIcon,
  Mail,
  KeyRound,
  Loader2,
  Car,
  LogIn,
  UserPlus,
  Info,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "LOGIN" | "REGISTER";
}

export function AuthModal({ isOpen, onClose, initialMode = "REGISTER" }: AuthModalProps) {
  const { requestOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">(initialMode);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = (newMode: "LOGIN" | "REGISTER") => {
    setMode(newMode);
    setStep("FORM");
    setError(null);
    setOtp("");
    setSuggestedOtp(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (mode === "REGISTER" && !fullName.trim()) {
      setError("Full legal name as per Driving Licence is required.");
      return;
    }

    setLoading(true);
    const res = await requestOtp(cleanPhone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to dispatch verification code.");
      return;
    }

    if (res.devOtp) {
      setSuggestedOtp(res.devOtp);
      setOtp(res.devOtp);
    } else {
      setSuggestedOtp("123456");
      setOtp("123456");
    }

    setStep("OTP");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const res = await verifyOtp(cleanPhone, otp, mode === "REGISTER" ? fullName : undefined, email || undefined);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Verification failed. Check the code.");
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Brand Navy */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Car className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {step === "OTP"
                  ? "Verify Mobile Number"
                  : mode === "REGISTER"
                  ? "Driver Partner Onboarding"
                  : "Driver Partner Sign In"}
              </h3>
              <p className="text-xs text-slate-400">Bidar ⇄ Hyderabad Verified Highway Corridor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {step === "FORM" && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
            <button
              type="button"
              onClick={() => resetForm("REGISTER")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "REGISTER"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Partner Registration</span>
            </button>
            <button
              type="button"
              onClick={() => resetForm("LOGIN")}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "LOGIN"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Driver Sign In</span>
            </button>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 text-xs font-medium text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "FORM" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {mode === "REGISTER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name (as per Driving Licence) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patil"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 text-xs font-bold text-slate-500 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl">
                    +91
                  </span>
                  <div className="relative w-full">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-r-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">We'll send an instant 6-digit OTP for secure authentication.</p>
              </div>

              {mode === "REGISTER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center space-x-2 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-slate-500">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800">+91 {phone}</strong>
                  <button
                    type="button"
                    onClick={() => setStep("FORM")}
                    className="ml-2 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </p>
              </div>

              <div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                  />
                </div>
                {suggestedOtp && (
                  <div className="mt-2 text-xs text-blue-900 bg-blue-50 p-2.5 rounded-xl font-medium text-center border border-blue-200 flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Test OTP auto-filled: <strong>{suggestedOtp}</strong> (Universal code: <strong>123456</strong>)</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Enter Driver Portal</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => requestOtp(phone)}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Didn't receive code? Resend SMS
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
