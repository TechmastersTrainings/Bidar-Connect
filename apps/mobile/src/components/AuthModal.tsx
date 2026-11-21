import React, { useState } from "react";
import {
  X,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Car,
  User,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { requestOtp, verifyOtp, loginAsDemoPassenger, loginAsDemoDriver } = useAuth();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    const res = await requestOtp(phone);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Unable to dispatch OTP.");
      return;
    }
    setOtp(res.devOtp || "123456");
    setStep("OTP");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await verifyOtp(phone, otp);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Verification failed.");
      return;
    }
    onClose();
  };

  const handleFastPassenger = async () => {
    setLoading(true);
    await loginAsDemoPassenger();
    setLoading(false);
    onClose();
  };

  const handleFastDriver = async () => {
    setLoading(true);
    await loginAsDemoDriver();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Mobile Authentication</h2>
              <p className="text-[10px] text-slate-300">Bidar Connect NH 65</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  10-Digit Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-slate-400">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Security Code</span>}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative my-3 text-center">
                <span className="bg-white px-2 text-[10px] text-slate-400 uppercase font-semibold">
                  Fast Demo Sign In
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFastPassenger}
                  className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Commuter</span>
                </button>
                <button
                  type="button"
                  onClick={handleFastDriver}
                  className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Driver Partner</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Enter 6-Digit Code
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-blue-600 mt-1">Dev Code Auto-filled: {otp}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="w-1/3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                >
                  Change
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Login</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

