"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  ShieldCheck,
  Phone,
  KeyRound,
  Loader2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { requestOtp, verifyOtp, loginAsDefaultAdmin } = useAuth();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("9800000000");
  const [otp, setOtp] = useState("");
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit registered admin phone number.");
      return;
    }

    setLoading(true);
    const res = await requestOtp(cleanPhone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Unable to dispatch verification OTP.");
      return;
    }

    const code = res.devOtp || "123456";
    setSuggestedOtp(code);
    setOtp(code);
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
    const res = await verifyOtp(cleanPhone, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Authentication failed. Authorization revoked.");
      return;
    }

    onClose();
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    const res = await loginAsDefaultAdmin();
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to authenticate default admin account.");
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Admin Portal Access</h2>
              <p className="text-xs text-slate-300">Bidar Connect Platform Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Registered Phone
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9800000000"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all font-mono tracking-wide"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Corridor operations credential with ADMIN authorization.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Security Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500 uppercase tracking-wider">Fast Login</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant Sign In (Demo Admin: +91 9800000000)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter 6-Digit One-Time Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                {suggestedOtp && (
                  <p className="text-[11px] text-blue-700 font-medium mt-1.5 flex items-center gap-1">
                    <span>Dev OTP auto-populated:</span>
                    <code className="bg-blue-50 px-1 py-0.5 rounded font-mono text-blue-800">{suggestedOtp}</code>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Change Phone
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authenticate Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>TLS Encrypted Administrative Session & RBAC Enforced</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

