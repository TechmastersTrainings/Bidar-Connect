"use client";

import { useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Shield,
  Clock,
  CreditCard,
  Star,
  Car,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Route,
  UserCheck,
  Banknote,
  AlertTriangle,
  HelpCircle,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (inline for self-contained initial build)
// ---------------------------------------------------------------------------
interface DriverSummary {
  name: string;
  rating: number;
  total_completed_trips: number;
  avatar_url: string | null;
}
interface VehicleSummary {
  make: string;
  model: string;
  color: string;
  registration_number: string;
  fuel_type: string;
}
interface Ride {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  fare_per_seat: number;
  driver: DriverSummary;
  vehicle: VehicleSummary;
  notes: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Bidar Connect
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#routes" className="hover:text-blue-600 transition-colors">Routes</a>
            <a href="#safety" className="hover:text-blue-600 transition-colors">Safety</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors px-3 py-2">
              Log in
            </a>
            <a href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md transition-colors shadow-sm">
              Get Started
            </a>
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <a href="#how-it-works" className="block py-2 text-sm font-medium text-slate-600">How It Works</a>
            <a href="#routes" className="block py-2 text-sm font-medium text-slate-600">Routes</a>
            <a href="#safety" className="block py-2 text-sm font-medium text-slate-600">Safety</a>
            <a href="#faq" className="block py-2 text-sm font-medium text-slate-600">FAQ</a>
            <a href="#contact" className="block py-2 text-sm font-medium text-slate-600">Contact</a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a href="/login" className="text-sm font-medium text-center py-2.5 text-slate-700 border border-slate-300 rounded-md">Log in</a>
              <a href="/register" className="text-sm font-medium text-center py-2.5 bg-blue-600 text-white rounded-md">Get Started</a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero Section with Live Search
// ---------------------------------------------------------------------------
function HeroSection({
  onSearch,
  loading,
}: {
  onSearch: (origin: string, dest: string, seats: number) => void;
  loading: boolean;
}) {
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [seats, setSeats] = useState(1);

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Organised Intercity Carpooling on the{" "}
            <span className="text-blue-600">Bidar ⇄ Hyderabad</span> Route
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            Travel comfortably between Bidar and Hyderabad with verified drivers, fixed per-seat fares, and
            instant booking confirmation. No surge pricing, no haggling, no uncertainty.
          </p>
        </div>

        <div className="mt-10 bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                >
                  <option value="Bidar">Bidar</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bidar">Bidar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  defaultValue="2026-11-05"
                  className="w-full h-11 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full h-11 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    {[1, 2, 3, 4].map((s) => (
                      <option key={s} value={s}>
                        {s} {s === 1 ? "Seat" : "Seats"}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => onSearch(origin, destination, seats)}
                  disabled={loading}
                  className="h-11 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium rounded-md transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Ride Results
// ---------------------------------------------------------------------------
function RideCard({ ride }: { ride: Ride }) {
  const depTime = new Date(ride.departure_time).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const depDate = new Date(ride.departure_time).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-slate-900 text-base">{depTime}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">{depDate}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{ride.pickup_point}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{ride.drop_point}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                {ride.driver.name.charAt(0)}
              </div>
              <div>
                <span className="font-medium text-slate-800">{ride.driver.name}</span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{ride.driver.rating}</span>
                  <span className="text-slate-300">•</span>
                  <span>{ride.driver.total_completed_trips} trips</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Car className="w-3.5 h-3.5" />
            <span>{ride.vehicle.make} {ride.vehicle.model}</span>
            <span className="text-slate-300">•</span>
            <span>{ride.vehicle.color}</span>
            <span className="text-slate-300">•</span>
            <span>{ride.vehicle.registration_number}</span>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              ₹{ride.fare_per_seat}
            </p>
            <p className="text-xs text-slate-500">per seat</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              ride.available_seats >= 3
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : ride.available_seats >= 1
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <Users className="w-3 h-3 mr-1" />
              {ride.available_seats} seats left
            </span>
          </div>
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors shadow-sm">
            Reserve Seat
          </button>
        </div>
      </div>
    </div>
  );
}

function RideResults({
  rides,
  loading,
  searched,
}: {
  rides: Ride[];
  loading: boolean;
  searched: boolean;
}) {
  if (!searched) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">
        {loading
          ? "Searching available rides..."
          : `${rides.length} ride${rides.length !== 1 ? "s" : ""} available`}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rides.length > 0 ? (
        <div className="space-y-4">
          {rides.map((ride) => (
            <RideCard key={ride.ride_id} ride={ride} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No rides found for this route and date.</p>
          <p className="text-sm text-slate-400 mt-1">
            Try a different date or check back later as drivers publish new rides daily.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Search Your Route",
      description:
        "Select Bidar or Hyderabad as your origin, pick your travel date, and choose the number of seats you need.",
    },
    {
      icon: CheckCircle2,
      title: "Instant Seat Confirmation",
      description:
        "Select a verified driver and vehicle. Your seats are instantly reserved with a fixed, transparent fare.",
    },
    {
      icon: CreditCard,
      title: "Pay Securely to the Platform",
      description:
        "Pay the company directly via UPI or card. No cash to driver, no haggling, no surprise charges.",
    },
    {
      icon: Car,
      title: "Travel Comfortably",
      description:
        "Meet your verified driver at the pickup point. Share your live trip with family. Arrive safely.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-slate-900">How Bidar Connect Works</h2>
          <p className="mt-2 text-sm text-slate-500">Four simple steps from search to safe arrival</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute top-4 right-4 w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Route & Pricing Info
// ---------------------------------------------------------------------------
function RouteInfo() {
  const stops = [
    "New Bus Stand, Bidar",
    "Humnabad Ring Road",
    "Zaheerabad Bypass",
    "Sangareddy",
    "Miyapur Cross Roads",
    "Gachibowli / Secunderabad",
  ];

  return (
    <section id="routes" className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              The Bidar ⇄ Hyderabad Corridor
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Approximately 140 km via NH 65. Travel time: 2.5 to 3 hours depending on traffic.
            </p>
            <div className="space-y-3">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      i === 0 ? "bg-emerald-500 border-emerald-500" :
                      i === stops.length - 1 ? "bg-blue-500 border-blue-500" :
                      "bg-white border-slate-300"
                    }`} />
                    {i < stops.length - 1 && (
                      <div className="w-0.5 h-6 bg-slate-200" />
                    )}
                  </div>
                  <span className="text-sm text-slate-700">{stop}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-600" />
                Fixed Transparent Pricing
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Bidar ⇄ Hyderabad (Full Route)</span>
                  <span className="text-sm font-semibold text-slate-900">₹310 / seat</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Bidar ⇄ Humnabad</span>
                  <span className="text-sm font-semibold text-slate-900">₹70 / seat</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600">Humnabad ⇄ Hyderabad</span>
                  <span className="text-sm font-semibold text-slate-900">₹250 / seat</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Fares are fixed by the platform and cannot be changed by drivers. The fare shown during search is exactly what you pay.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">For Car Owners</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Travelling between Bidar and Hyderabad? List your available seats and offset your fuel and toll costs. No commercial licence needed for genuine cost-sharing carpooling.
              </p>
              <a
                href="/register"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
              >
                Offer Your Seats <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Safety & Trust
// ---------------------------------------------------------------------------
function SafetySection() {
  const features = [
    {
      icon: UserCheck,
      title: "Verified Identity",
      description: "Every driver undergoes phone verification. Driving licence and vehicle RC are reviewed.",
    },
    {
      icon: Shield,
      title: "Transparent Fixed Pricing",
      description: "Fares are controlled by the platform. No surge, no negotiation, no hidden charges.",
    },
    {
      icon: Route,
      title: "Live Journey Sharing",
      description: "Share a secure trip link with your family so they can track your ride in real time.",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Support",
      description: "One-tap emergency SOS contact and 24/7 grievance support for all passengers.",
    },
    {
      icon: CreditCard,
      title: "Secure Platform Payments",
      description: "All payments go through the company. No direct cash exchanges with the driver.",
    },
    {
      icon: Star,
      title: "Community Ratings",
      description: "Only passengers who completed a verified trip can rate and review drivers.",
    },
  ];

  return (
    <section id="safety" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-slate-900">Your Safety Is Non-Negotiable</h2>
          <p className="mt-2 text-sm text-slate-500">
            Every feature is designed to make your intercity journey secure and predictable
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <f.icon className="w-5 h-5 text-blue-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
function FAQSection() {
  const faqs = [
    {
      q: "How is the fare decided?",
      a: "Fares are fixed by the platform based on route distance and operational costs. Drivers cannot change the fare. The price you see during search is exactly what you pay.",
    },
    {
      q: "Is Bidar Connect a taxi service?",
      a: "No. Bidar Connect is a non-commercial carpooling platform. Drivers are private car owners sharing their regular trips to offset fuel and toll costs within legal cost-sharing limits.",
    },
    {
      q: "What if the driver cancels?",
      a: "If a driver cancels, you receive a 100% full refund automatically. You will also be notified immediately so you can search for an alternative ride.",
    },
    {
      q: "How do I pay?",
      a: "You pay the company directly via UPI or card during checkout. Payments never go directly to the driver's personal account.",
    },
    {
      q: "Can I cancel my booking?",
      a: "Yes. Cancellations more than 2 hours before departure receive a 100% refund. Within 2 hours, a 50% refund applies to protect the driver's travel commitment.",
    },
    {
      q: "How do I know the driver is verified?",
      a: "Every driver must upload their driving licence, vehicle registration certificate (RC), and valid insurance. Documents are reviewed for compliance.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-slate-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-800 pr-4">{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                    openIdx === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Contact & Footer
// ---------------------------------------------------------------------------
function ContactAndFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <section id="contact" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Get in Touch</h2>
            <p className="text-sm text-slate-500 mb-6">
              Have questions about Bidar Connect? We are here to help.
            </p>
            <div className="space-y-4">
              <a href="tel:+919876543210" className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </a>
              <a href="mailto:support@bidarconnect.in" className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                <Mail className="w-4 h-4" /> support@bidarconnect.in
              </a>
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Bidar, Karnataka 585401, India</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#routes" className="hover:text-white transition-colors">Routes & Pricing</a></li>
                <li><a href="#safety" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a></li>
                <li><a href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="tel:+919876543210" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> +91 98765 43210
                  </a>
                </li>
                <li>
                  <a href="mailto:support@bidarconnect.in" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> support@bidarconnect.in
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {currentYear} Bidar Connect. All rights reserved.</p>
            <p>Intercity Carpooling Platform — Bidar ⇄ Hyderabad</p>
          </div>
        </div>
      </footer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page Root
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (origin: string, dest: string, seats: number) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/rides/search?origin_city=${encodeURIComponent(origin)}&destination_city=${encodeURIComponent(dest)}&seats=${seats}`
      );
      const json = await res.json();
      if (json.success) {
        setRides(json.data);
      } else {
        setRides([]);
      }
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Navbar />
      <HeroSection onSearch={handleSearch} loading={loading} />
      <RideResults rides={rides} loading={loading} searched={searched} />
      <HowItWorks />
      <RouteInfo />
      <SafetySection />
      <FAQSection />
      <ContactAndFooter />
    </main>
  );
}

