"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import {
  Car,
  MapPin,
  Calendar,
  Users,
  Search,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  CreditCard,
  Ticket,
  AlertCircle,
  X,
  Phone,
  User,
  HeartHandshake,
  AlertTriangle,
  Copy,
  ChevronRight,
  PlusCircle,
  Trash2,
  Lock,
  Luggage,
} from "lucide-react";

interface DriverSummary {
  driver_id: string;
  name: string;
  rating: number;
  total_completed_trips: number;
  avatar_url: string | null;
}

interface VehicleSummary {
  vehicle_id: string;
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

interface BookingRecord {
  booking_id: string;
  reference_code: string;
  ride_id: string;
  passenger: {
    passenger_id: string;
    name: string;
    phone: string;
  };
  driver: DriverSummary;
  vehicle: VehicleSummary;
  route: {
    origin_city: string;
    destination_city: string;
    pickup_point: string;
    drop_point: string;
    departure_time: string;
  };
  seats_booked: number;
  fare_snapshot: {
    fare_per_seat: number;
    total_fare: number;
    company_commission: number;
    driver_payable: number;
    commission_rule_id: string;
  };
  booking_status: string;
  payment_status: string;
  reserved_until: string;
  created_at: string;
}

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship_type: string;
}

interface PassengerProfileData {
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  preferred_pickup_landmark: string | null;
  medical_emergency_notes: string | null;
  total_rides_taken: number;
  emergency_contacts: EmergencyContact[];
}

const API_BASE = "http://127.0.0.1:8000";

export default function PassengerPortal() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"SEARCH" | "MY_BOOKINGS" | "PROFILE">("SEARCH");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search state
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [seats, setSeats] = useState(1);
  const [travelDate, setTravelDate] = useState("2026-11-05");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);

  // Booking Modal State
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [dropLandmark, setDropLandmark] = useState("");

  // Digital Ticket Pass State
  const [activeTicket, setActiveTicket] = useState<BookingRecord | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // My Bookings State
  const [myUpcomingBookings, setMyUpcomingBookings] = useState<BookingRecord[]>([]);
  const [myHistoryBookings, setMyHistoryBookings] = useState<BookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState<PassengerProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editPickupLandmark, setEditPickupLandmark] = useState("");
  const [editMedicalNotes, setEditMedicalNotes] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRel, setNewContactRel] = useState("Family");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Fetch Rides
  const fetchRides = async () => {
    setLoadingRides(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/rides/search?origin_city=${encodeURIComponent(origin)}&destination_city=${encodeURIComponent(destination)}&seats=${seats}`
      );
      const data = await res.json();
      if (data.success) {
        setRides(data.data);
      } else {
        setRides([]);
      }
    } catch (e) {
      console.error("Failed to fetch rides:", e);
      setRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [origin, destination]);

  // Fetch Bookings when tab changes to MY_BOOKINGS
  const fetchMyBookings = async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMyUpcomingBookings(data.data.upcoming || []);
        setMyHistoryBookings(data.data.history || []);
      }
    } catch (e) {
      console.error("Failed to load passenger bookings:", e);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch Profile when tab changes to PROFILE
  const fetchProfile = async () => {
    if (!token) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/passenger/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfileData(data.data);
        setEditPickupLandmark(data.data.preferred_pickup_landmark || "");
        setEditMedicalNotes(data.data.medical_emergency_notes || "");
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "MY_BOOKINGS") {
      fetchMyBookings();
    } else if (activeTab === "PROFILE") {
      fetchProfile();
    }
  }, [activeTab, token]);

  // Handle Open Booking
  const handleOpenBooking = (ride: Ride) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedRide(ride);
    setPickupLandmark(profileData?.preferred_pickup_landmark || ride.pickup_point);
    setDropLandmark(ride.drop_point);
    setBookingModalOpen(true);
  };

  // Confirm and Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedRide || !token) return;
    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_id: selectedRide.ride_id,
          passenger_name: user?.full_name || "Passenger",
          passenger_phone: user?.phone || "+919876543210",
          requested_seats: seats,
          pickup_point: pickupLandmark,
          drop_point: dropLandmark,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingModalOpen(false);
        setActiveTicket(data.data);
        setTicketModalOpen(true);
        fetchRides();
        if (activeTab === "MY_BOOKINGS") {
          fetchMyBookings();
        }
      } else {
        alert(data.error?.message || "Booking failed.");
      }
    } catch (e) {
      alert("Network error connecting to booking engine.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? Full fare will be refunded according to corridor policies.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancellation_reason: "Passenger personal schedule adjustment",
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (activeTicket && activeTicket.booking_id === bookingId) {
          setActiveTicket(data.data);
        }
        fetchMyBookings();
        fetchRides();
        alert("Booking cancelled successfully. Refund processed to original payment method.");
      } else {
        alert(data.error?.message || "Failed to cancel booking.");
      }
    } catch (e) {
      alert("Error cancelling booking.");
    }
  };

  // Save Profile Preferences
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/passenger/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_pickup_landmark: editPickupLandmark,
          medical_emergency_notes: editMedicalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(data.data);
        setProfileFeedback("Preferences updated successfully!");
        setTimeout(() => setProfileFeedback(null), 3000);
      }
    } catch (e) {
      setProfileFeedback("Failed to update preferences.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Add Emergency Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newContactName || !newContactPhone) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/passenger/emergency-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newContactName,
          phone: newContactPhone,
          relationship_type: newContactRel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewContactName("");
        setNewContactPhone("");
        fetchProfile();
      }
    } catch (e) {
      alert("Failed to add emergency contact.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">Bidar Connect</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  NH 65 Corridor
                </span>
              </div>
              <p className="text-xs text-slate-500">Organized Intercity Carpooling</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("SEARCH")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "SEARCH"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Find a Ride
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                } else {
                  setActiveTab("MY_BOOKINGS");
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "MY_BOOKINGS"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                } else {
                  setActiveTab("PROFILE");
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PROFILE"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Safety & Profile
            </button>
          </nav>

          {/* Auth State */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {user.full_name ? user.full_name.substring(0, 2) : "PA"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{user.phone}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-200 transition-colors font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* ========================================================================= */}
        {/* TAB 1: RIDE SEARCH & DISCOVERY                                            */}
        {/* ========================================================================= */}
        {activeTab === "SEARCH" && (
          <div>
            {/* Search Box Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Book Verified Intercity Carpool</h1>
                  <p className="text-xs text-slate-500">Government-audited corridor pricing: ₹310 per passenger seat</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Verified Drivers Only</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Departure Origin
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                    <select
                      value={origin}
                      onChange={(e) => {
                        const newOrigin = e.target.value;
                        setOrigin(newOrigin);
                        setDestination(newOrigin === "Bidar" ? "Hyderabad" : "Bidar");
                      }}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="Bidar">Bidar (New Bus Stand, Mailoor)</option>
                      <option value="Hyderabad">Hyderabad (Miyapur, Gachibowli)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                    <select
                      value={destination}
                      onChange={(e) => {
                        const newDest = e.target.value;
                        setDestination(newDest);
                        setOrigin(newDest === "Bidar" ? "Hyderabad" : "Bidar");
                      }}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="Hyderabad">Hyderabad (Miyapur, Gachibowli)</option>
                      <option value="Bidar">Bidar (New Bus Stand, Mailoor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Seats Required
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                    >
                      {[1, 2, 3, 4].map((s) => (
                        <option key={s} value={s}>
                          {s} {s === 1 ? "Seat" : "Seats"} (₹{310 * s})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchRides}
                    disabled={loadingRides}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span>{loadingRides ? "Searching..." : "Search Corridor"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Available Scheduled Departures ({rides.length})
                </h2>
                <p className="text-xs text-slate-500">Route: NH 65 • Distance ~140 km • Approx duration 2 hrs 45 mins</p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                Fixed ₹310 / Seat
              </span>
            </div>

            {/* Rides Listing */}
            {rides.length === 0 && !loadingRides ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No rides currently scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Check back soon or try selecting another date. Verified drivers post new departure manifests hourly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rides.map((ride) => (
                  <div
                    key={ride.ride_id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      {/* Driver & Departure Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={ride.driver.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                          alt={ride.driver.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{ride.driver.name}</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {ride.driver.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({ride.driver.total_completed_trips} trips)
                            </span>
                            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Verified KYC
                            </span>
                          </div>

                          {/* Route & Times */}
                          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Departure:{" "}
                              {new Date(ride.departure_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600">Pick-up: {ride.pickup_point}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600">Drop: {ride.drop_point}</span>
                          </div>

                          {/* Vehicle Spec */}
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {ride.vehicle.registration_number}
                            </span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-600">
                              {ride.vehicle.fuel_type} • AC On
                            </span>
                          </div>

                          {ride.notes && (
                            <p className="mt-2 text-xs text-slate-500 italic">
                              "{ride.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Booking Action */}
                      <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <div className="md:text-right">
                          <div className="text-lg font-black text-slate-900">
                            ₹{ride.fare_per_seat * seats}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ₹{ride.fare_per_seat}/seat • {seats} {seats === 1 ? "seat" : "seats"}
                          </div>
                          <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                            {ride.available_seats} {ride.available_seats === 1 ? "seat left" : "seats available"}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenBooking(ride)}
                          disabled={ride.available_seats < seats}
                          className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5"
                        >
                          <span>Reserve Seats</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY BOOKINGS & DIGITAL PASSES                                       */}
        {/* ========================================================================= */}
        {activeTab === "MY_BOOKINGS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">My Corridor Bookings</h1>
                <p className="text-xs text-slate-500">Access verified digital ride passes, trip history, and cancellations</p>
              </div>
              <button
                onClick={fetchMyBookings}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Refresh
              </button>
            </div>

            {/* Upcoming Rides */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                <span>Confirmed Upcoming Rides ({myUpcomingBookings.length})</span>
              </h2>

              {bookingsLoading ? (
                <p className="text-xs text-slate-500 py-4">Loading your bookings...</p>
              ) : myUpcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500">No active upcoming bookings.</p>
                  <button
                    onClick={() => setActiveTab("SEARCH")}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Find a ride now →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myUpcomingBookings.map((bkg) => (
                    <div
                      key={bkg.booking_id}
                      className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {bkg.reference_code}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {bkg.route.origin_city} → {bkg.route.destination_city}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {bkg.booking_status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          Departure:{" "}
                          {new Date(bkg.route.departure_time).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(bkg.route.departure_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Driver: <strong className="text-slate-800">{bkg.driver.name}</strong> • Car:{" "}
                          <span className="font-mono text-slate-700">{bkg.vehicle.registration_number}</span> ({bkg.vehicle.make} {bkg.vehicle.model})
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Pick-up: <strong>{bkg.route.pickup_point}</strong> • Drop:{" "}
                          <strong>{bkg.route.drop_point}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                        <button
                          onClick={() => {
                            setActiveTicket(bkg);
                            setTicketModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>View Ticket</span>
                        </button>
                        <button
                          onClick={() => handleCancelBooking(bkg.booking_id)}
                          className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Booking History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Completed & Past Rides ({myHistoryBookings.length})
              </h2>
              {myHistoryBookings.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No past ride history recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myHistoryBookings.map((bkg) => (
                    <div key={bkg.booking_id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800 mr-2">{bkg.reference_code}</span>
                        <span className="text-slate-600 font-medium">
                          {bkg.route.origin_city} → {bkg.route.destination_city} • {bkg.seats_booked} seat(s) • ₹{bkg.fare_snapshot.total_fare}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            bkg.booking_status === "CANCELLED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {bkg.booking_status}
                        </span>
                        <button
                          onClick={() => {
                            setActiveTicket(bkg);
                            setTicketModalOpen(true);
                          }}
                          className="text-emerald-700 hover:underline font-semibold"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SAFETY, PREFERENCES & PROFILE                                      */}
        {/* ========================================================================= */}
        {activeTab === "PROFILE" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Passenger Profile & Safety Settings</h1>
                <p className="text-xs text-slate-500">Configure pickup landmarks, emergency contacts, and medical safety notes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preferences Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Ride Preferences</span>
                </h2>

                {profileFeedback && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                    {profileFeedback}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.full_name || ""}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Phone Number</label>
                    <input
                      type="text"
                      disabled
                      value={user?.phone || ""}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Preferred NH 65 Pick-up Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near New Bus Stand In Gate, Bidar"
                      value={editPickupLandmark}
                      onChange={(e) => setEditPickupLandmark(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Drivers will prioritize this spot when picking you up along the corridor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Medical / Accessibility Notes (Confidential)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Motion sickness prone (front seat requested), carries emergency inhaler"
                      value={editMedicalNotes}
                      onChange={(e) => setEditMedicalNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    {profileSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </form>
              </div>

              {/* Emergency Contacts Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>Emergency Safety Contacts (SOS)</span>
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Shared with Bidar Connect safety response desk in the event of an SOS alert during a trip.
                </p>

                {/* Existing Contacts List */}
                <div className="space-y-2.5 mb-6">
                  {profileData?.emergency_contacts && profileData.emergency_contacts.length > 0 ? (
                    profileData.emergency_contacts.map((contact, idx) => (
                      <div
                        key={contact.id || idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {contact.name} ({contact.relationship_type})
                          </div>
                          <div className="text-slate-500 font-mono">{contact.phone}</div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Active SOS
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No emergency contact registered yet. Please add a trusted family member or colleague.</span>
                    </div>
                  )}
                </div>

                {/* Add Contact Form */}
                <form onSubmit={handleAddContact} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-800">Add Trusted Contact</h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Contact Full Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="10-digit Indian Mobile Number"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={newContactRel}
                      onChange={(e) => setNewContactRel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-emerald-500 outline-none"
                    >
                      <option value="Family">Family (Parent / Sibling / Spouse)</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Save Emergency Contact</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRM SEAT RESERVATION                                         */}
      {/* ========================================================================= */}
      {bookingModalOpen && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Review & Reserve Seats</h3>
                <p className="text-xs text-slate-400">
                  {selectedRide.origin_city} → {selectedRide.destination_city} • 10-Minute Seat Hold
                </p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Ride Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                    {selectedRide.driver.name}
                    <span className="inline-flex items-center text-amber-600 text-xs font-semibold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-0.5" />
                      {selectedRide.driver.rating.toFixed(1)}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedRide.vehicle.make} {selectedRide.vehicle.model} ({selectedRide.vehicle.registration_number})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedRide.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Landmark Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pick-up Landmark</label>
                <input
                  type="text"
                  value={pickupLandmark}
                  onChange={(e) => setPickupLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Drop-off Destination</label>
                <input
                  type="text"
                  value={dropLandmark}
                  onChange={(e) => setDropLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Immutable Fare Breakdown */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Corridor Fare (₹{selectedRide.fare_per_seat} × {seats} seat)</span>
                  <span className="font-semibold">₹{selectedRide.fare_per_seat * seats}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee & Insurance Fund</span>
                  <span className="font-semibold text-emerald-700">₹0 (Waived)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total Payable</span>
                  <span className="text-blue-700">₹{selectedRide.fare_per_seat * seats}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{bookingLoading ? "Reserving Atomic Lock..." : `Confirm & Pay ₹${selectedRide.fare_per_seat * seats}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIGITAL TICKET PASS (LIVE TRAVEL DOCUMENT)                       */}
      {/* ========================================================================= */}
      {ticketModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Ticket Header */}
            <div className="bg-slate-900 p-6 text-white text-center relative border-b border-slate-800">
              <button
                onClick={() => setTicketModalOpen(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black tracking-wide text-white">BIDAR CONNECT RIDE PASS</h3>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full font-mono font-bold text-xs text-blue-300">
                <span>{activeTicket.reference_code}</span>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Status</div>
                  <div className="text-xs font-black text-emerald-700">{activeTicket.booking_status}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Seats</div>
                  <div className="text-xs font-black text-slate-800">{activeTicket.seats_booked} Passenger Seat(s)</div>
                </div>
              </div>

              {/* Route */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Pick-up Landmark</span>
                  <div className="font-semibold text-slate-800">{activeTicket.route.pickup_point}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Drop-off Destination</span>
                  <div className="font-semibold text-slate-800">{activeTicket.route.drop_point}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Departure Time</span>
                  <div className="font-bold text-blue-800">
                    {new Date(activeTicket.route.departure_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ({activeTicket.route.origin_city} → {activeTicket.route.destination_city})
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <div className="font-bold text-slate-900">{activeTicket.driver.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {activeTicket.vehicle.color} {activeTicket.vehicle.make} ({activeTicket.vehicle.registration_number})
                  </div>
                </div>
                <a
                  href="tel:+919876543210"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
              </div>

              {/* Fare Summary */}
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-500">Paid Amount (Snapshotted):</span>
                <span className="font-bold text-slate-900">₹{activeTicket.fare_snapshot.total_fare}</span>
              </div>

              {activeTicket.booking_status !== "CANCELLED" && (
                <button
                  onClick={() => handleCancelBooking(activeTicket.booking_id)}
                  className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel Booking & Request Refund
                </button>
              )}

              <button
                onClick={() => setTicketModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
