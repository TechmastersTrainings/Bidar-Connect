import React, { useState } from "react";
import {
  Car,
  ShieldCheck,
  PlusCircle,
  Users,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
} from "lucide-react";
import { ManifestPassenger } from "../../types";

export function DriverHomeScreen() {
  const [activeTripStatus, setActiveTripStatus] = useState<"SCHEDULED" | "EN_ROUTE" | "COMPLETED">("SCHEDULED");
  const [publishingModalOpen, setPublishingModalOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const manifest: ManifestPassenger[] = [
    {
      booking_id: "BK_001",
      passenger_name: "Anusha Patil",
      passenger_phone: "+919876500001",
      seats: 1,
      pickup_point: "New Bus Stand, Udgir Road",
      drop_point: "Gachibowli DLF Hub",
      status: "CONFIRMED",
    },
    {
      booking_id: "BK_002",
      passenger_name: "Santosh K.",
      passenger_phone: "+919876500002",
      seats: 2,
      pickup_point: "Guru Nanak Gate",
      drop_point: "Miyapur Metro",
      status: "CONFIRMED",
    },
  ];

  const handleStartTrip = () => {
    setActiveTripStatus("EN_ROUTE");
  };

  const handleCompleteTrip = () => {
    setActiveTripStatus("COMPLETED");
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingModalOpen(false);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 4000);
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Driver Verification Status Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">Prakash Biradar</span>
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 mr-0.5" />
                  KYC Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">KA 38 M 4120 &bull; Maruti Ertiga</p>
            </div>
          </div>

          <button
            onClick={() => setPublishingModalOpen(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            title="Publish New Commute"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Trips Done</div>
            <div className="text-sm font-bold text-white">42</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Commuter Rating</div>
            <div className="text-sm font-bold text-amber-400">4.9 / 5.0</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">This Week Payout</div>
            <div className="text-sm font-bold text-emerald-400">INR 1,740</div>
          </div>
        </div>
      </div>

      {publishSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>New commute published with fixed ₹310 fare! Open for passenger reservations.</span>
        </div>
      )}

      {/* Active Trip Manifest Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Active Manifest
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Bidar to Hyderabad (07:30 AM)
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              activeTripStatus === "EN_ROUTE"
                ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                : activeTripStatus === "COMPLETED"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {activeTripStatus}
          </span>
        </div>

        {/* Passenger Manifest Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Confirmed Passengers (3 Seats Booked)
          </div>

          {manifest.map((p) => (
            <div
              key={p.booking_id}
              className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900">{p.passenger_name} ({p.seats} Seat)</div>
                <div className="text-[11px] text-slate-500">Pickup: {p.pickup_point}</div>
                <div className="text-[11px] text-slate-500">Drop: {p.drop_point}</div>
              </div>

              <a
                href={`tel:${p.passenger_phone}`}
                className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 shrink-0"
                title="Call Passenger"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {/* Trip Lifecycle Controls */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {activeTripStatus === "SCHEDULED" && (
            <button
              onClick={handleStartTrip}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Journey & Broadcast GPS</span>
            </button>
          )}

          {activeTripStatus === "EN_ROUTE" && (
            <button
              onClick={handleCompleteTrip}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Journey (Trigger Payout)</span>
            </button>
          )}

          {activeTripStatus === "COMPLETED" && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 text-center font-medium">
              Trip completed! INR 870 queued for automated bank payout with 5-min safety hold.
            </div>
          )}
        </div>
      </div>

      {/* Publish Commute Modal */}
      {publishingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Publish Commute (NH 65)</h3>
              <button
                onClick={() => setPublishingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Route</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold">
                  <option>Bidar to Hyderabad</option>
                  <option>Hyderabad to Bidar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Departure Time</label>
                  <input
                    type="time"
                    defaultValue="07:30"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Available Seats</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold">
                    <option>3 Seats</option>
                    <option>2 Seats</option>
                    <option>1 Seat</option>
                    <option>4 Seats</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-[11px]">
                Fixed Regulated Fare: <strong>INR 310 / seat</strong> (INR 290 net driver reimbursement).
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
              >
                Publish Commute Now
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
