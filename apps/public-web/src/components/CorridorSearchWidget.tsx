"use client";

import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface CorridorSearchWidgetProps {
  onSearch?: (origin: string, destination: string, travelDate: string, seats: number) => void;
  loading?: boolean;
}

const CORRIDOR_CITIES = [
  "Bidar",
  "Humnabad",
  "Zaheerabad",
  "Sangareddy",
  "Hyderabad",
];

export function CorridorSearchWidget({ onSearch, loading = false }: CorridorSearchWidgetProps) {
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [travelDate, setTravelDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [seats, setSeats] = useState(1);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(origin, destination, travelDate, seats);
    } else {
      // Direct redirect to Passenger Portal
      const url = `http://localhost:3001?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${travelDate}&seats=${seats}`;
      window.location.href = url;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.35)] border border-white/90 p-5 sm:p-7 transition-all ring-1 ring-slate-900/10 text-slate-900">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Corridor Direction Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOrigin("Bidar");
                setDestination("Hyderabad");
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                origin === "Bidar" && destination === "Hyderabad"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Bidar to Hyderabad (Direct)
            </button>
            <button
              type="button"
              onClick={() => {
                setOrigin("Hyderabad");
                setDestination("Bidar");
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                origin === "Hyderabad" && destination === "Bidar"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Hyderabad to Bidar (Return)
            </button>
          </div>

          <span className="whitespace-nowrap hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
            Regulated Fare: INR 310
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Origin */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Departure City
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none z-10" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff", opacity: 1 }}
                className="w-full pl-9 pr-8 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-xs"
              >
                {CORRIDOR_CITIES.map((c) => (
                  <option key={`orig-${c}`} value={c} disabled={c === destination} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Destination */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Destination City
              </label>
              <button
                type="button"
                onClick={handleSwap}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors"
                title="Swap origin and destination"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Swap</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none z-10" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ colorScheme: "light", color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff", opacity: 1 }}
                className="w-full pl-9 pr-8 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-xs"
              >
                {CORRIDOR_CITIES.map((c) => (
                  <option key={`dest-${c}`} value={c} disabled={c === origin} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Travel Date */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Travel Date
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none z-10" />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all [color-scheme:light] shadow-xs cursor-pointer"
                style={{ colorScheme: "light", color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff", opacity: 1 }}
                required
              />
            </div>
          </div>

          {/* Seats & Submit */}
          <div className="relative flex flex-col justify-end">
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Seats
                </label>
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-slate-500 absolute left-2.5 pointer-events-none z-10" />
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    style={{ colorScheme: "light", color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff", opacity: 1 }}
                    className="w-full pl-8 pr-6 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-xs"
                  >
                    <option value={1} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">1</option>
                    <option value={2} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">2</option>
                    <option value={3} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">3</option>
                    <option value={4} style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }} className="text-slate-900 bg-white font-medium">4</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
                </div>
              </div>

              <div className="w-2/3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-transparent mb-1 select-none">
                  Action
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Find Rides</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-3 font-medium">
            <span>Stops: Humnabad &bull; Zaheerabad &bull; Sangareddy</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">135 km via NH 65 Expressway</span>
          </div>
          <span className="text-slate-600 font-medium">
            Zero surge pricing &bull; 100% ID Verified Drivers
          </span>
        </div>
      </form>
    </div>
  );
}
