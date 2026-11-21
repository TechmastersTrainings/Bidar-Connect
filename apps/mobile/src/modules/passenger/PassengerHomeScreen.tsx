import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ShieldCheck,
  Star,
  Car,
  Clock,
  ArrowRight,
  Share2,
  CheckCircle2,
  Heart,
  QrCode,
  Phone,
} from "lucide-react";
import { MobileRide } from "../../types";

interface PassengerHomeScreenProps {
  onOpenOfflineTicket: () => void;
  onOpenSOS: () => void;
}

const SAMPLE_MOBILE_RIDES: MobileRide[] = [
  {
    ride_id: "ride_b2h_001",
    origin_city: "Bidar",
    destination_city: "Hyderabad",
    departure_time: "2026-11-05T07:30:00+05:30",
    pickup_point: "New Bus Stand (Udgir Road)",
    drop_point: "Gachibowli DLF Hub",
    available_seats: 3,
    fare_per_seat: 310,
    driver: {
      name: "Prakash Biradar",
      rating: 4.9,
      total_completed_trips: 42,
    },
    vehicle: {
      make: "Maruti Suzuki",
      model: "Ertiga",
      color: "Magma Grey",
      registration_number: "KA 38 M 4120",
      fuel_type: "PETROL",
    },
    status: "SCHEDULED",
  },
  {
    ride_id: "ride_b2h_002",
    origin_city: "Bidar",
    destination_city: "Hyderabad",
    departure_time: "2026-11-05T09:00:00+05:30",
    pickup_point: "Guru Nanak Gate / Halladkeri",
    drop_point: "Miyapur Metro Station",
    available_seats: 2,
    fare_per_seat: 310,
    driver: {
      name: "Suresh Patil",
      rating: 4.8,
      total_completed_trips: 28,
    },
    vehicle: {
      make: "Hyundai",
      model: "Creta",
      color: "Polar White",
      registration_number: "TS 07 HK 9081",
      fuel_type: "DIESEL",
    },
    status: "SCHEDULED",
  },
];

export function PassengerHomeScreen({ onOpenOfflineTicket, onOpenSOS }: PassengerHomeScreenProps) {
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [womenOnly, setWomenOnly] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBook = () => {
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 4000);
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Search Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Where are you heading?
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Regulated: INR 310
          </span>
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
            <div className="flex-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">From</span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="Bidar">Bidar (New Bus Stand)</option>
                <option value="Humnabad">Humnabad Bypass</option>
                <option value="Zaheerabad">Zaheerabad</option>
                <option value="Hyderabad">Hyderabad (Gachibowli / Miyapur)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
            <div className="flex-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">To</span>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="Hyderabad">Hyderabad (Gachibowli / Miyapur)</option>
                <option value="Sangareddy">Sangareddy X-Roads</option>
                <option value="Zaheerabad">Zaheerabad Bypass</option>
                <option value="Bidar">Bidar (New Bus Stand)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setWomenOnly(!womenOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
              womenOnly
                ? "bg-pink-50 border-pink-300 text-pink-700"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${womenOnly ? "fill-pink-500 text-pink-500" : "text-slate-400"}`} />
            <span>Women-Only Rides</span>
          </button>

          <span className="text-[11px] text-slate-500">1 Seat &bull; Today</span>
        </div>
      </div>

      {bookingSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Atomic Seat Lock Confirmed! Pass saved to Offline Vault.</span>
          </div>
          <button
            onClick={onOpenOfflineTicket}
            className="font-bold underline text-emerald-900 shrink-0"
          >
            View Pass
          </button>
        </div>
      )}

      {/* Upcoming Trip Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            Confirmed Upcoming Trip
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
            In 2h 30m
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-base font-bold text-white flex items-center gap-2">
            <span>Bidar</span>
            <span className="text-slate-500">to</span>
            <span>Hyderabad (DLF)</span>
          </div>
          <p className="text-xs text-slate-300">
            Today &bull; 07:30 AM &bull; Pickup: New Bus Stand
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-400" />
            <span className="text-slate-200">Prakash (Ertiga KA 38 M 4120)</span>
          </div>
          <a
            href="tel:+919550856204"
            className="p-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:text-white"
            title="Call Driver"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Actions Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenOfflineTicket}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Pass & QR</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Live GPS Share</span>
          </button>
        </div>
      </div>

      {/* Available Corridor Rides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900">
            Scheduled Departures ({SAMPLE_MOBILE_RIDES.length})
          </h2>
          <span className="text-[11px] text-slate-500">Fixed INR 310 / seat</span>
        </div>

        {SAMPLE_MOBILE_RIDES.map((ride) => (
          <div
            key={ride.ride_id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900">{ride.driver.name}</span>
                  <span className="inline-flex items-center text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 mr-0.5" />
                    Verified
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{ride.driver.rating}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{ride.driver.total_completed_trips} trips</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-blue-600">INR {ride.fare_per_seat}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Fixed Fare</div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-900">
                  Departure:{" "}
                  {new Date(ride.departure_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pl-5">
                Pickup: {ride.pickup_point}
              </div>
              <div className="text-[11px] text-slate-500 pl-5">
                Drop: {ride.drop_point}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  <strong>{ride.available_seats}</strong> seats left
                </span>
              </div>

              <button
                onClick={handleBook}
                className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <span>Reserve Seat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
