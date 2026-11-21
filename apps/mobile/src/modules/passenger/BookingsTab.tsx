import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Car,
  QrCode,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { offlineStorage } from "../../services/offline_storage";

interface BookingsTabProps {
  onOpenOfflineVault: () => void;
}

export function BookingsTab({ onOpenOfflineVault }: BookingsTabProps) {
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false);

  const bookings = [
    {
      booking_id: "BK_OFFLINE_20261105_01",
      origin: "Bidar",
      destination: "Hyderabad",
      departure_time: "2026-11-05T07:30:00+05:30",
      pickup: "New Bus Stand, Udgir Road",
      driver: "Prakash Biradar",
      vehicle: "Maruti Ertiga (KA 38 M 4120)",
      fare: 310,
      status: "CONFIRMED",
    },
    {
      booking_id: "BK_HIST_20261028_02",
      origin: "Hyderabad",
      destination: "Bidar",
      departure_time: "2026-10-28T18:00:00+05:30",
      pickup: "Gachibowli DLF Hub",
      driver: "Suresh Patil",
      vehicle: "Hyundai Creta (TS 07 HK 9081)",
      fare: 310,
      status: "COMPLETED",
    },
  ];

  const handleCancelClick = (id: string) => {
    setCancellingBookingId(id);
  };

  const handleConfirmCancel = () => {
    if (cancellingBookingId) {
      offlineStorage.removeTicket(cancellingBookingId);
      setCancellationConfirmed(true);
      setCancellingBookingId(null);
      setTimeout(() => setCancellationConfirmed(false), 4000);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold text-slate-900">My Trips & Passes</h1>
        <button
          onClick={onOpenOfflineVault}
          className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Offline Pass Vault</span>
        </button>
      </div>

      {cancellationConfirmed && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Trip cancelled successfully. Under Rule BR-REF-01, 100% refund (₹310) initiated to your UPI source.
          </span>
        </div>
      )}

      {/* Cancellation Modal Dialog */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Cancel Booking?</h3>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">Rule BR-REF-01 Refund Schedule:</p>
              <p>&bull; &gt; 2 hours before trip: <strong>100% refund (INR 310)</strong></p>
              <p>&bull; 1 to 2 hours before trip: <strong>50% refund (INR 155)</strong></p>
              <p>&bull; &lt; 1 hour before trip: <strong>0% non-refundable</strong></p>
            </div>

            <p className="text-xs text-slate-600">
              Your scheduled departure is in more than 2 hours. You are entitled to a full 100% refund.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCancellingBookingId(null)}
                className="w-1/2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="w-1/2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.map((b) => (
          <div
            key={b.booking_id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-mono text-xs font-bold text-slate-900">
                {b.booking_id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.status === "CONFIRMED"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {b.status}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <div className="font-bold text-slate-900 text-sm">
                {b.origin} to {b.destination}
              </div>
              <div className="text-slate-500 text-[11px]">
                {new Date(b.departure_time).toLocaleDateString()} at{" "}
                {new Date(b.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-slate-600 text-[11px]">Pickup: {b.pickup}</div>
              <div className="text-slate-600 text-[11px]">Driver: {b.driver} ({b.vehicle})</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-blue-600 text-xs">INR {b.fare}</span>

              <div className="flex items-center gap-2">
                {b.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleCancelClick(b.booking_id)}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={onOpenOfflineVault}
                  className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Pass</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
