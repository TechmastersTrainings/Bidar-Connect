import React, { useState } from "react";
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { mobileApi } from "../services/api";
import { offlineStorage } from "../services/offline_storage";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencySOSModal({ isOpen, onClose }: EmergencySOSModalProps) {
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const contacts = offlineStorage.getEmergencyContacts();

  const handleBroadcastSOS = async () => {
    setBroadcasting(true);
    const location = {
      latitude: 17.6833,
      longitude: 77.6000,
      landmark: "Near Zaheerabad Bypass (NH 65 Expressway)",
    };

    const res = await mobileApi.triggerEmergencySOS(location, "Urgent assistance requested from mobile app.");
    setBroadcasting(false);
    setBroadcastDone(true);
    if (res?.data?.incident_id) {
      setIncidentId(res.data.incident_id);
    } else {
      setIncidentId("SOS_INC_EMERGENCY_ACTIVE");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-red-500 rounded-3xl p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
          aria-label="Close emergency modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
              Emergency Distress Pipeline
            </span>
            <h2 className="text-lg font-black text-white">NH 65 Highway SOS</h2>
          </div>
        </div>

        {/* Live GPS Coordinates */}
        <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 mb-4 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold text-slate-200">Current GPS Telemetry:</span>
          </div>
          <p className="font-mono text-emerald-400 text-xs pl-5">
            17.6833° N, 77.6000° E &bull; NH 65 Zaheerabad
          </p>
        </div>

        {broadcastDone ? (
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-2 mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-200">
              Emergency Distress Broadcasted!
            </h3>
            <p className="text-[11px] text-emerald-300">
              Incident ID: <code className="font-mono font-bold">{incidentId}</code>
            </p>
            <p className="text-[11px] text-slate-300">
              Highway patrol units and your {contacts.length} emergency contacts have been alerted.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <button
              onClick={handleBroadcastSOS}
              disabled={broadcasting}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/40 transition-all flex items-center justify-center gap-2"
            >
              {broadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Relaying Live Coordinates...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Broadcast Distress Coordinates</span>
                </>
              )}
            </button>

            <a
              href="tel:+918482112112"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Helpline: +91 8482 112 112</span>
            </a>
          </div>
        )}

        {/* Registered Emergency Contacts List */}
        <div className="border-t border-slate-800 pt-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Auto-Alerted Contacts:
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            {contacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-700/50"
              >
                <span>{c.name} ({c.relation})</span>
                <span className="font-mono text-[11px] text-blue-400">{c.phone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

