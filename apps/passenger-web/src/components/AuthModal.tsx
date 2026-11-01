"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, ShieldCheck, Phone, User as UserIcon, KeyRound, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    const res = await requestOtp(phone);
    setLoading(false);
    if (res.success) {
      if (res.devOtp) {
        setSuggestedOtp(res.devOtp);
        setOtp(res.devOtp); // Auto-fill for developer/demo convenience
      }
      setStep("OTP");
    } else {
      setError(res.error || "Failed to send OTP code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 4) {
      setError("Please enter the verification OTP code.");
      return;
    }
    setLoading(true);
    const res = await verifyOtp(phone, otp, fullName);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Verification failed. Check your OTP.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sign In / Register</h3>
              <p className="text-xs text-emerald-100">Bidar Connect Secure Identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name (Optional for existing accounts)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Anand Kulkarni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <span className="absolute left-10 top-2.5 text-sm font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  We'll send a 6-digit verification code via SMS or WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center space-x-2 text-sm"
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
              <div className="text-center py-1">
                <span className="text-xs text-slate-500">
                  Code sent to <span className="font-semibold text-slate-800">+91 {phone}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="ml-2 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Enter 6-Digit OTP Code
                </label>
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
                    className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                {suggestedOtp && (
                  <p className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium text-center">
                    💡 Local test OTP auto-filled: <strong>{suggestedOtp}</strong> (or enter <strong>123456</strong>)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Proceed</span>
                )}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            By proceeding, you agree to Bidar Connect's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

