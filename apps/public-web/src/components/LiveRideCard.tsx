"use client";

import React from "react";
import {
  Car,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export interface RideSummary {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  fare_per_seat: number;
  driver: {
    driver_id?: string;
    name: string;
    rating: number;
    total_completed_trips: number;
    avatar_url?: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    registration_number: string;
    fuel_type: string;
  };
  notes?: string | null;
}

interface LiveRideCardProps {
  ride: RideSummary;
}

export function LiveRideCard({ ride }: LiveRideCardProps) {
  const formattedTime = new Date(ride.departure_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(ride.departure_time).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const bookUrl = `http://localhost:3001?ride_id=${encodeURIComponent(ride.ride_id)}&origin=${encodeURIComponent(ride.origin_city)}&destination=${encodeURIComponent(ride.destination_city)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Header: Driver & Timing */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center shrink-0">
              {ride.driver.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900">
                  {ride.driver.name}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"
                  title="Aadhaar and Driving Licence verified by administration"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>KYC Verified</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{ride.driver.rating.toFixed(1)}</span>
                </span>
                <span>&bull;</span>
                <span>{ride.driver.total_completed_trips} trips completed</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              INR {ride.fare_per_seat}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Per Seat / Fixed
            </div>
          </div>
        </div>

        {/* Route Timing & Stops */}
        <div className="py-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <div className="space-y-1.5 pl-1 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0"></span>
              <span className="text-slate-700">
                <strong className="font-semibold text-slate-900">{ride.origin_city}:</strong>{" "}
                {ride.pickup_point}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0"></span>
              <span className="text-slate-700">
                <strong className="font-semibold text-slate-900">{ride.destination_city}:</strong>{" "}
                {ride.drop_point}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Badge */}
        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-600 mb-4 border border-slate-100">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-800">
              {ride.vehicle.make} {ride.vehicle.model}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-500">{ride.vehicle.color}</span>
          </div>
          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
            {ride.vehicle.registration_number}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Users className="w-4 h-4 text-blue-600" />
          <span>
            <strong className="text-slate-900 font-bold">{ride.available_seats}</strong> seats available
          </span>
        </div>

        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/20"
        >
          <span>Select Seat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

