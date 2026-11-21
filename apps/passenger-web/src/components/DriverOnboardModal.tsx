"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  Car,
  ShieldCheck,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  KeyRound,
  ArrowRight
} from "lucide-react";

interface DriverOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DriverOnboardModal({ isOpen, onClose, onSuccess }: DriverOnboardModalProps) {
  const { user, onboardDriver } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("2030-12-31");
  const [payoutUpiId, setPayoutUpiId] = useState("");

  const [vehicleMake, setVehicleMake] = useState("Hyundai");
  const [vehicleModel, setVehicleModel] = useState("Creta");
  const [vehicleReg, setVehicleReg] = useState("");
  const [fuelType, setFuelType] = useState("DIESEL");
  const [capacity, setCapacity] = useState(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLic = licenceNumber.trim().toUpperCase();
    if (!cleanLic || cleanLic.length < 6) {
      setError("Please enter a valid Driving Licence number.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanReg = vehicleReg.trim().toUpperCase();
    if (!cleanReg || cleanReg.length < 5) {
      setError("Please enter your vehicle registration number plate (e.g. KA 38 M 5678).");
      return;
    }

    setLoading(true);
    const res = await onboardDriver({
      licence_number: licenceNumber.trim().toUpperCase(),
      licence_expiry: licenceExpiry,
      payout_upi_id: payoutUpiId.trim() || undefined,
      vehicle_make: vehicleMake.trim(),
      vehicle_model: vehicleModel.trim(),
      vehicle_reg: cleanReg,
      fuel_type: fuelType,
      passenger_capacity: capacity,
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to activate driver capabilities.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              Driver Partner Onboarding
            </span>
            <span className="text-xs text-slate-400">Step {step} of 2</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {step === 1 ? "Activate Driver Partner Capabilities" : "Register Your Corridor Vehicle"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {step === 1
              ? "Publish corridor departures, carry co-travellers along NH 65, and earn locked ₹290 net per passenger seat."
              : "Add your car to receive instant rider reservations. Fixed ₹310 corridor fare strictly enforced."}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-700/60 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name (As on Driving Licence)
                </label>
                <input
                  type="text"
                  value={user?.full_name || ""}
                  disabled
                  className="w-full h-11 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Linked to your verified Bidar Connect account ({user?.phone})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Driving Licence Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA 38 2024 0019281"
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                    className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Licence Valid Until <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={licenceExpiry}
                    onChange={(e) => setLicenceExpiry(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Settlement UPI ID (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={payoutUpiId}
                    onChange={(e) => setPayoutUpiId(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Net earnings (₹290/seat) are dispatched to this UPI ID upon trip completion.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Continue to Vehicle Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Vehicle Make / Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registration Number Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA 38 M 5678"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">Electric (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Passenger Seats</label>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  >
                    <option value={3}>3 Seats</option>
                    <option value={4}>4 Seats (Standard)</option>
                    <option value={6}>6 Seats (SUV)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Platform Corridor Rules</span>
                </div>
                <p className="leading-relaxed">
                  Every seat is locked at ₹310. As driver partner, you receive ₹290 per confirmed passenger seat via automated escrow settlement.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3 h-11 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Activate Driver Partner Mode</span>
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

