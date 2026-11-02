"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  ShieldCheck,
  Phone,
  User as UserIcon,
  Mail,
  MapPin,
  KeyRound,
  Loader2,
  UserPlus,
  LogIn,
  CheckCircle,
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

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupCity, setPickupCity] = useState("Bidar");
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // OTP State
  const [otp, setOtp] = useState("");
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (mode === "REGISTER") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError("Please enter your legal full name for registration.");
        return;
      }
      if (!agreedToTerms) {
        setError("You must agree to the Terms of Service to register.");
        return;
      }
    }

    setLoading(true);
    const res = await requestOtp(phone);
    setLoading(false);

    if (res.success) {
      if (res.devOtp) {
        setSuggestedOtp(res.devOtp);
        setOtp(res.devOtp); // Auto-fill for test convenience
      }
      setStep("OTP");
    } else {
      setError(res.error || "Failed to dispatch verification code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 4) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    const res = await verifyOtp(
      phone,
      otp,
      mode === "REGISTER" ? fullName : undefined,
      mode === "REGISTER" && email ? email : undefined
    );
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Verification failed. Check the code.");
    }
  };

  const resetForm = (newMode: "LOGIN" | "REGISTER") => {
    setMode(newMode);
    setStep("FORM");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Brand Navy */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {step === "OTP"
                  ? "Verify Mobile Number"
                  : mode === "REGISTER"
                  ? "Create Passenger Account"
                  : "Sign In to Bidar Connect"}
              </h3>
              <p className="text-xs text-slate-400">Bidar ⇄ Hyderabad Verified Corridor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Form Step Only) */}
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
              <span>Register (New User)</span>
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
              <span>Sign In (Existing)</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {step === "FORM" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* REGISTRATION FORM FIELDS */}
              {mode === "REGISTER" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Shiva Bhalke"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="e.g. shiva@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary Travel Hub
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <select
                        value={pickupCity}
                        onChange={(e) => setPickupCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Bidar">Bidar (New Bus Stand / Mailoor / Shivaji Chowk)</option>
                        <option value="Hyderabad">Hyderabad (Miyapur / Gachibowli / Secunderabad)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* COMMON MOBILE NUMBER FIELD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Indian Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <span className="absolute left-10 top-2.5 text-sm font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  A 6-digit one-time password (OTP) will be dispatched instantly.
                </p>
              </div>

              {mode === "REGISTER" && (
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termsCheck"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="termsCheck" className="text-xs text-slate-600">
                    I agree to Bidar Connect's Safety Rules, Fixed Corridor Fares (₹310), and Terms of Service.
                  </label>
                </div>
              )}

              {/* ACTION BUTTON - Brand Blue */}
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
                ) : mode === "REGISTER" ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register & Verify Mobile</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Send Sign In Code</span>
                  </>
                )}
              </button>

              {/* TOGGLE LINK */}
              <div className="text-center pt-2">
                {mode === "REGISTER" ? (
                  <p className="text-xs text-slate-500">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => resetForm("LOGIN")}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Sign In here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    New to Bidar Connect?{" "}
                    <button
                      type="button"
                      onClick={() => resetForm("REGISTER")}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </div>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-1">
                <span className="text-xs text-slate-500">
                  Verification code sent to{" "}
                  <span className="font-bold text-slate-800">+91 {phone}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep("FORM")}
                  className="ml-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{mode === "REGISTER" ? "Complete Registration" : "Verify & Sign In"}</span>
                  </>
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
