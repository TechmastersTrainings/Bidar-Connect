"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  Car,
  Calendar,
  Search,
  ExternalLink,
  Milestone,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CorridorSearchWidget } from "../../components/CorridorSearchWidget";

interface StopItem {
  name: string;
  landmark: string;
  city: string;
  eta: string;
  description: string;
  tip: string;
}

const BIDAR_TO_HYD_STOPS: StopItem[] = [
  {
    name: "New Bus Stand (Main Hub)",
    landmark: "Opposite KSRTC Depot 1, Udgir Road",
    city: "Bidar",
    eta: "00:00 (Departure)",
    description: "Primary gathering point with ample two-wheeler parking and sheltered waiting bay.",
    tip: "Arrive 10 minutes prior to scheduled departure. Drivers wait near the main entry porch.",
  },
  {
    name: "Guru Nanak Gate / Halladkeri",
    landmark: "Guru Nanak Hospital X-Roads",
    city: "Bidar",
    eta: "+00:15",
    description: "Convenient pickup hub for students, faculty, and residents of north Bidar.",
    tip: "Boarding at the fuel station opposite the gate.",
  },
  {
    name: "Humnabad Bypass",
    landmark: "NH 65 Flyover Junction",
    city: "Humnabad",
    eta: "+00:45",
    description: "Major highway interchange connecting Kalaburagi/Solapur traffic.",
    tip: "Driver pauses briefly at the service lane before toll plaza.",
  },
  {
    name: "Zaheerabad Bypass",
    landmark: "Near Mahindra Factory Main Gate",
    city: "Zaheerabad",
    eta: "+01:15",
    description: "Industrial corridor checkpoint; easy pedestrian access from Zaheerabad town.",
    tip: "Prompt boarding permitted at the highway restaurant cluster.",
  },
  {
    name: "Sangareddy X-Roads",
    landmark: "Below the Sangareddy Flyover",
    city: "Sangareddy",
    eta: "+01:50",
    description: "Key junction connecting IIT Hyderabad (Kandi) commuters.",
    tip: "Ideal drop-off point for IIT Kandi students and staff.",
  },
  {
    name: "Miyapur Metro Station",
    landmark: "Metro Pillar 124, Service Road",
    city: "Hyderabad",
    eta: "+02:15",
    description: "Seamless transfer to Hyderabad Metro Red Line connecting Ameerpet, Secunderabad, and LB Nagar.",
    tip: "Direct entry to Metro escalator within 30 meters of drop point.",
  },
  {
    name: "Gachibowli DLF / ORR",
    landmark: "Opposite DLF Cybercity Gate 2",
    city: "Hyderabad",
    eta: "+02:30",
    description: "Core destination for IT commuters working in HITEC City, Financial District, and Kondapur.",
    tip: "Convenient evening return departures originate from this hub.",
  },
];

const HYD_TO_BIDAR_STOPS: StopItem[] = [
  {
    name: "Gachibowli DLF / ORR Hub",
    landmark: "Gate 2 Service Lane, DLF Cybercity",
    city: "Hyderabad",
    eta: "00:00 (Departure)",
    description: "Primary evening boarding point for IT employees heading to Bidar/Zaheerabad.",
    tip: "Waiting lounge available near tech park cafes.",
  },
  {
    name: "Miyapur Metro Station",
    landmark: "Pillar 124, Towards NH 65",
    city: "Hyderabad",
    eta: "+00:20",
    description: "Pick-up point for commuters taking the metro from central Hyderabad.",
    tip: "Notify driver in-app once you reach metro gate 3.",
  },
  {
    name: "Sangareddy X-Roads",
    landmark: "Sangareddy Flyover Exit Lane",
    city: "Sangareddy",
    eta: "+00:45",
    description: "Pickup checkpoint for Kandi IIT commuters.",
    tip: "Boarding on the service road toward Mumbai/Pune highway.",
  },
  {
    name: "Zaheerabad Bypass",
    landmark: "Mahindra Flyover Junction",
    city: "Zaheerabad",
    eta: "+01:20",
    description: "Midway junction on NH 65.",
    tip: "Short 2-minute drop pause.",
  },
  {
    name: "Humnabad Highway Cut",
    landmark: "Humnabad Toll Plaza Service Road",
    city: "Humnabad",
    eta: "+01:50",
    description: "Highway drop point.",
    tip: "Direct auto connection available to Humnabad bus stand.",
  },
  {
    name: "New Bus Stand (Main Hub)",
    landmark: "Udgir Road KSRTC Depot 1",
    city: "Bidar",
    eta: "+02:30 (Arrival)",
    description: "Central destination in Bidar with 24/7 rickshaw stands and bus connectivity.",
    tip: "Journey ends at central stand.",
  },
];

export default function RoutesPage() {
  const [direction, setDirection] = useState<"B2H" | "H2B">("B2H");
  const activeStops = direction === "B2H" ? BIDAR_TO_HYD_STOPS : HYD_TO_BIDAR_STOPS;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb & Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-500">Corridor Route Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bidar ⇄ Hyderabad (NH 65 Corridor)
        </h1>
        <p className="text-base text-slate-600 mt-2 max-w-3xl">
          Comprehensive boarding point guides, estimated transit timings, toll plazas, and landmark
          checkpoints across the 135 km intercity corridor.
        </p>
      </div>

      {/* Corridor Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Distance
          </div>
          <div className="text-2xl font-black text-slate-900">135 km</div>
          <div className="text-[11px] text-slate-500 mt-0.5">via NH 65 4-lane expressway</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Average Travel Time
          </div>
          <div className="text-2xl font-black text-blue-600">2.5 Hours</div>
          <div className="text-[11px] text-slate-500 mt-0.5">45 min faster than RTC bus</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Regulated Fare
          </div>
          <div className="text-2xl font-black text-emerald-600">INR 310</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fixed cost-sharing, zero surge</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Highway Toll
          </div>
          <div className="text-2xl font-black text-slate-900">1 Toll Plaza</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Kamkole FASTag toll included</div>
        </div>
      </div>

      {/* Interactive Search Box */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>Find Active Rides on This Route</span>
        </h2>
        <CorridorSearchWidget />
      </div>

      {/* Direction Selector Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {direction === "B2H" ? "Bidar to Hyderabad Schedule & Stops" : "Hyderabad to Bidar Return Stops"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click direction below to switch viewpoint
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-200 rounded-xl">
          <button
            onClick={() => setDirection("B2H")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              direction === "B2H"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bidar to Hyderabad
          </button>
          <button
            onClick={() => setDirection("H2B")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              direction === "H2B"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hyderabad to Bidar
          </button>
        </div>
      </div>

      {/* Stops Timeline */}
      <div className="space-y-4 mb-14">
        {activeStops.map((stop, idx) => (
          <div
            key={stop.name}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{stop.name}</h3>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {stop.city}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {stop.eta}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Landmark: {stop.landmark}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{stop.description}</p>
              </div>
            </div>

            <div className="md:text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100 md:bg-transparent md:border-0 md:p-0 flex flex-col md:items-end gap-2">
              <div>
                <div className="text-[11px] font-semibold text-amber-800">
                  Commuter Tip:
                </div>
                <div className="text-xs text-slate-600 max-w-xs">{stop.tip}</div>
              </div>
              <a
                href={`http://localhost:3001?origin=${encodeURIComponent(stop.city)}&destination=${encodeURIComponent(direction === "B2H" ? "Hyderabad" : "Bidar")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-all w-fit"
              >
                <span>Find Rides from {stop.city}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Highway Infrastructure & Safety Note */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Milestone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">NH 65 Corridor Highway Specifications</h3>
            <p className="text-xs text-blue-300">National Highway Authority of India (NHAI) Standard 4-Lane</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4-Lane Divided Highway</span>
            </h4>
            <p className="leading-relaxed">
              NH 65 provides physical concrete median separation from Sangareddy through Hyderabad ORR,
              minimizing opposing traffic risks and permitting consistent 80 km/h cruising.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Automated FASTag Tolls</span>
            </h4>
            <p className="leading-relaxed">
              Toll transit at Kamkole Plaza is automated via electronic FASTag, eliminating toll queue
              delays. All toll allocations are fully factored into the flat ₹310 passenger cost-sharing.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Emergency Highway Response</span>
            </h4>
            <p className="leading-relaxed">
              Every trip on Bidar Connect is monitored via GPS telemetry. The 24/7 safety helpline
              (+91 8482 112 112) is integrated with local highway patrol units stationed along NH 65.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
