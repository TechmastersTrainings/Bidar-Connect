import React from "react";
import {
  QrCode,
  X,
  ShieldCheck,
  Phone,
  Car,
  Clock,
  MapPin,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { offlineStorage } from "../services/offline_storage";
import { OfflineTicket } from "../types";

interface OfflineTicketVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineTicketVaultModal({ isOpen, onClose }: OfflineTicketVaultModalProps) {
  if (!isOpen) return null;

  const tickets = offlineStorage.getTickets();
  const activeTicket: OfflineTicket | undefined = tickets[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Offline Digital Pass Vault</h2>
              <div className="flex items-center gap-1 text-[10px] text-blue-300">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Zero Internet Required (Highway Safe)</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close offline vault"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeTicket ? (
          <div className="p-5 space-y-4">
            {/* Visual Simulated QR Pass Card */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-3">
              {/* QR Pattern Simulation */}
              <div className="w-36 h-36 bg-slate-900 mx-auto rounded-xl p-2.5 flex flex-col justify-between shadow-inner">
                <div className="grid grid-cols-6 gap-1 w-full h-full">
                  {[...Array(36)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xs ${
                        idx % 2 === 0 || idx % 5 === 0 || idx === 0 || idx === 5 || idx === 30 || idx === 35
                          ? "bg-white"
                          : "bg-slate-900"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Encrypted Digital Ticket Pass
                </span>
                <span className="text-sm font-mono font-black text-slate-900 block">
                  {activeTicket.booking_id}
                </span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>HMAC-SHA256 Authenticated</span>
              </div>
            </div>

            {/* Ride Details Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Corridor Route:</span>
                <span className="font-bold text-slate-900">
                  {activeTicket.origin_city} to {activeTicket.destination_city}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Departure Time:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(activeTicket.departure_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Pickup Landmark:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                  {activeTicket.pickup_point}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Vehicle:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeTicket.vehicle_registration}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Driver Partner:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{activeTicket.driver_name}</span>
                  <a
                    href={`tel:${activeTicket.driver_phone}`}
                    className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Offline Guidance */}
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Present this screen to the driver at the pickup landmark. Valid even in highway network dead-zones between Zaheerabad and Humnabad.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Offline Tickets Stored</h3>
            <p className="text-xs text-slate-500">
              When you book a ride, your signed pass is automatically cached for offline presentation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
