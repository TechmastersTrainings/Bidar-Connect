"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { UnifiedNavbar } from "../components/UnifiedNavbar";
import { DriverOnboardModal } from "../components/DriverOnboardModal";
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
  Milestone,
  ShieldCheck,
  QrCode,
  Smartphone,
  Layers,
  Banknote,
  Send,
  Loader2,
  Fuel,
  Compass,
  FileCheck
} from "lucide-react";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------
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

interface VehicleItem {
  vehicle_id: string;
  make: string;
  model: string;
  registration_number: string;
  color: string;
  year: number;
  fuel_type: string;
  passenger_capacity: number;
  is_active: boolean;
  is_verified: boolean;
}

interface DriverProfileData {
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_driver: boolean;
  is_verified: boolean;
  licence_number: string | null;
  licence_expiry: string | null;
  total_completed_trips: number;
  average_rating: number;
  payout_bank_account: string | null;
  payout_ifsc: string | null;
  payout_upi_id: string | null;
}

interface DriverRideItem {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  available_seats: number;
  total_offered_seats?: number;
  fare_per_seat: number;
  status: string;
  vehicle: {
    make: string;
    model: string;
    registration_number: string;
    color: string;
  };
  notes?: string;
  total_confirmed_passengers: number;
  estimated_gross_earnings: number;
  manifest?: Array<{
    booking_id: string;
    reference_code: string;
    passenger_name: string;
    passenger_phone: string;
    seats_booked: number;
    pickup_point: string;
    drop_point: string;
    fare_amount: number;
    booking_status: string;
    payment_status: string;
  }>;
}

interface DriverEarningsData {
  total_completed_trips: number;
  total_seats_sold: number;
  total_gross_earnings: number;
  total_platform_commission: number;
  total_net_payout: number;
  pending_payout_amount: number;
  recent_payouts: Array<{
    payout_id: string;
    ride_id: string;
    gross_amount: number;
    commission_deducted: number;
    net_amount: number;
    status: string;
    paid_at: string | null;
  }>;
}

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return "http://127.0.0.1:8000/api/v1";
};

// ---------------------------------------------------------------------------
// Main Unified Application Component
// ---------------------------------------------------------------------------
export default function UnifiedBidarConnectApp() {
  const API_BASE = getApiBase();
  const { user, token, isAuthenticated, activeMode, setActiveMode, logout, refreshUser } = useAuth();

  // Navigation tab state (adaptive per mode)
  const [passengerTab, setPassengerTab] = useState<"SEARCH" | "MY_BOOKINGS" | "PROFILE" | "HELP">("SEARCH");
  const [driverTab, setDriverTab] = useState<"DASHBOARD" | "PUBLISH" | "RIDES" | "FLEET" | "EARNINGS" | "PROFILE">("DASHBOARD");
  const [profileSubTab, setProfileSubTab] = useState<"PERSONAL" | "PASSENGER" | "DRIVER">("PERSONAL");

  // Auth & Driver Onboarding Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [driverOnboardModalOpen, setDriverOnboardModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // PASSENGER MODE STATES
  // -------------------------------------------------------------------------
  const [origin, setOrigin] = useState("Bidar");
  const [destination, setDestination] = useState("Hyderabad");
  const [seats, setSeats] = useState(1);
  const [travelDate, setTravelDate] = useState("2026-11-06");
  const [timeWindow, setTimeWindow] = useState<"ALL" | "MORNING" | "AFTERNOON" | "EVENING">("ALL");
  const [fuelType, setFuelType] = useState<"ALL" | "EV" | "DIESEL" | "CNG" | "PETROL">("ALL");
  const [sortBy, setSortBy] = useState<"departure_asc" | "rating_desc" | "price_asc">("departure_asc");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);

  // Booking & Escrow Hold States
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [dropLandmark, setDropLandmark] = useState("");

  const [activeHold, setActiveHold] = useState<any | null>(null);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(600);
  const [confirmingHold, setConfirmingHold] = useState(false);
  const [paymentUtr, setPaymentUtr] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  // Passenger Bookings & Tickets
  const [myUpcomingBookings, setMyUpcomingBookings] = useState<BookingRecord[]>([]);
  const [myHistoryBookings, setMyHistoryBookings] = useState<BookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<BookingRecord | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Shared Profile Details
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfileData | null>(null);
  const [editPickupLandmark, setEditPickupLandmark] = useState("");
  const [editMedicalNotes, setEditMedicalNotes] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRel, setNewContactRel] = useState("Family");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // DRIVER MODE STATES
  // -------------------------------------------------------------------------
  const [driverProfile, setDriverProfile] = useState<DriverProfileData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [driverRides, setDriverRides] = useState<DriverRideItem[]>([]);
  const [earnings, setEarnings] = useState<DriverEarningsData | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);

  // Publish Ride Form States
  const [pubOrigin, setPubOrigin] = useState("Bidar");
  const [pubDest, setPubDest] = useState("Hyderabad");
  const [pubDate, setPubDate] = useState("2026-11-06");
  const [pubTime, setPubTime] = useState("08:00");
  const [pubPickup, setPubPickup] = useState("New Bus Stand, Bidar");
  const [pubDrop, setPubDrop] = useState("Gachibowli DLF, Hyderabad");
  const [pubSeats, setPubSeats] = useState(4);
  const [pubVehicleId, setPubVehicleId] = useState("");
  const [pubMake, setPubMake] = useState("Hyundai");
  const [pubModel, setPubModel] = useState("Creta");
  const [pubReg, setPubReg] = useState("");
  const [pubLoading, setPubLoading] = useState(false);
  const [pubFeedback, setPubFeedback] = useState<string | null>(null);

  // Add Vehicle Modal States
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vReg, setVReg] = useState("");
  const [vFuel, setVFuel] = useState("DIESEL");
  const [vCapacity, setVCapacity] = useState(4);
  const [vLoading, setVLoading] = useState(false);

  // Manifest Drawer / Modal
  const [selectedRideForManifest, setSelectedRideForManifest] = useState<DriverRideItem | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // Data Fetching: Passenger Data
  // -------------------------------------------------------------------------
  const fetchRides = async (orig = origin, dest = destination, s = seats) => {
    setLoadingRides(true);
    try {
      const url = `${API_BASE}/rides/search?origin_city=${encodeURIComponent(orig)}&destination_city=${encodeURIComponent(dest)}&seats=${s}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setRides(json.data);
      } else {
        setRides([]);
      }
    } catch (e) {
      console.warn("Failed fetching search rides", e);
      setRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  const fetchPassengerBookings = async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setMyUpcomingBookings(json.data.upcoming || []);
        setMyHistoryBookings(json.data.history || []);
      }
    } catch (e) {
      console.warn("Failed fetching bookings", e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchPassengerProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/passenger/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setPassengerProfile(json.data);
        setEditPickupLandmark(json.data.preferred_pickup_landmark || "");
        setEditMedicalNotes(json.data.medical_emergency_notes || "");
      }
    } catch (e) {
      console.warn("Failed fetching passenger profile", e);
    }
  };

  // -------------------------------------------------------------------------
  // Data Fetching: Driver Data
  // -------------------------------------------------------------------------
  const fetchDriverData = async () => {
    if (!token) return;
    setDriverLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [vRes, pRes, rRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/driver/vehicles`, { headers }),
        fetch(`${API_BASE}/driver/profile`, { headers }),
        fetch(`${API_BASE}/driver/rides`, { headers }),
        fetch(`${API_BASE}/driver/earnings`, { headers }),
      ]);

      if (vRes.ok) {
        const vJson = await vRes.json();
        if (vJson.success && Array.isArray(vJson.data)) {
          setVehicles(vJson.data);
          if (vJson.data.length > 0 && !pubVehicleId) {
            setPubVehicleId(vJson.data[0].vehicle_id);
          }
        }
      }

      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson.success && pJson.data) setDriverProfile(pJson.data);
      }

      if (rRes.ok) {
        const rJson = await rRes.json();
        if (rJson.success && Array.isArray(rJson.data)) setDriverRides(rJson.data);
      }

      if (eRes.ok) {
        const eJson = await eRes.json();
        if (eJson.success && eJson.data) setEarnings(eJson.data);
      }
    } catch (e) {
      console.warn("Failed fetching driver data", e);
    } finally {
      setDriverLoading(false);
    }
  };

  // Initial mount: fetch relevant datasets
  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (token) {
      fetchPassengerBookings();
      fetchPassengerProfile();
      fetchDriverData();
    }
  }, [token]);

  // Hold Timer countdown
  useEffect(() => {
    if (!activeHold || holdSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveHold(null);
          setHoldModalOpen(false);
          showToast("Seat hold expired. Seat returned to corridor inventory.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeHold, holdSecondsRemaining]);

  // -------------------------------------------------------------------------
  // Handlers: Passenger Workflows
  // -------------------------------------------------------------------------
  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    fetchRides(destination, temp, seats);
  };

  const handleInitiateHold = async () => {
    if (!selectedRide) return;
    if (!isAuthenticated) {
      setBookingModalOpen(false);
      setAuthInitialMode("LOGIN");
      setAuthModalOpen(true);
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_id: selectedRide.ride_id,
          requested_seats: seats,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setActiveHold(json.data);
        setHoldSecondsRemaining(600);
        setBookingModalOpen(false);
        setHoldModalOpen(true);
      } else {
        showToast(json.error?.message || "Failed to initiate seat hold.");
      }
    } catch (e) {
      showToast("Network error holding seat. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmHoldPayment = async () => {
    if (!activeHold || !paymentUtr.trim()) {
      showToast("Please enter the 12-digit UPI UTR reference.");
      return;
    }

    setConfirmingHold(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/hold/${activeHold.hold_id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          utr_reference: paymentUtr.trim(),
          payment_method: "UPI_QR",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setActiveTicket(json.data);
        setHoldModalOpen(false);
        setActiveHold(null);
        setPaymentUtr("");
        setTicketModalOpen(true);
        showToast("Escrow payment verified! Seat confirmed.");
        fetchPassengerBookings();
        fetchRides();
      } else {
        showToast(json.error?.message || "Payment verification failed.");
      }
    } catch (e) {
      showToast("Network error confirming payment.");
    } finally {
      setConfirmingHold(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Driver Workflows
  // -------------------------------------------------------------------------
  const handlePublishRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setAuthInitialMode("LOGIN");
      setAuthModalOpen(true);
      return;
    }

    setPubLoading(true);
    setPubFeedback(null);
    try {
      const departureIso = `${pubDate}T${pubTime}:00`;
      const res = await fetch(`${API_BASE}/driver/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin_city: pubOrigin,
          destination_city: pubDest,
          departure_time: departureIso,
          pickup_point: pubPickup.trim(),
          drop_point: pubDrop.trim(),
          available_seats: pubSeats,
          vehicle_id: pubVehicleId || undefined,
          vehicle_make: pubMake.trim(),
          vehicle_model: pubModel.trim(),
          vehicle_reg: pubReg.trim().toUpperCase(),
          vehicle_fuel: "DIESEL",
          driver_notes: "Corridor Highway Commute",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Highway departure published live on NH 65!");
        setPubFeedback("Ride published successfully! You are now accepting passenger reservations.");
        fetchDriverData();
        fetchRides();
        setTimeout(() => {
          setDriverTab("RIDES");
          setPubFeedback(null);
        }, 1200);
      } else {
        setPubFeedback(json.error?.message || "Failed to publish ride.");
      }
    } catch (err) {
      setPubFeedback("Network error publishing ride. Please check connection.");
    } finally {
      setPubLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setVLoading(true);
    try {
      const res = await fetch(`${API_BASE}/driver/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          make: vMake.trim(),
          model: vModel.trim(),
          registration_number: vReg.trim().toUpperCase(),
          color: "White",
          year: 2023,
          fuel_type: vFuel,
          passenger_capacity: vCapacity,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Vehicle registered to your fleet!");
        setAddVehicleOpen(false);
        setVMake("");
        setVModel("");
        setVReg("");
        fetchDriverData();
      } else {
        showToast(json.error?.message || "Failed to register vehicle.");
      }
    } catch (e) {
      showToast("Network error registering vehicle.");
    } finally {
      setVLoading(false);
    }
  };

  const handleUpdateRideStatus = async (rideId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/driver/rides/${rideId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(newStatus === "COMPLETED" ? "Trip completed! Net earnings queued for payout." : `Status updated: ${newStatus}`);
        fetchDriverData();
      } else {
        showToast(json.error?.message || "Failed to update trip status.");
      }
    } catch (e) {
      showToast("Network error updating trip status.");
    }
  };

  const handleDisbursePayout = async (rideId: string) => {
    if (!token) return;
    setPayoutLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payouts/rides/${rideId}/disburse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ force_override_buffer: true }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Settlement dispatched! UTR: ${json.data?.utr || "Verified Bank Transfer"}`);
        fetchDriverData();
      } else {
        showToast(json.error?.message || "Payout request submitted to platform escrow.");
      }
    } catch (e) {
      showToast("Network error requesting payout.");
    } finally {
      setPayoutLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Shared Profile Updates
  // -------------------------------------------------------------------------
  const handleSavePassengerPreferences = async () => {
    if (!token) return;
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/passenger/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_pickup_landmark: editPickupLandmark.trim(),
          medical_emergency_notes: editMedicalNotes.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setProfileFeedback("Preferences saved successfully!");
        fetchPassengerProfile();
      } else {
        setProfileFeedback(json.error?.message || "Failed to save preferences.");
      }
    } catch (e) {
      setProfileFeedback("Network error saving preferences.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newContactName || !newContactPhone) return;

    try {
      const res = await fetch(`${API_BASE}/passenger/emergency-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newContactName.trim(),
          phone: newContactPhone.trim(),
          relationship_type: newContactRel,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Emergency contact added!");
        setNewContactName("");
        setNewContactPhone("");
        fetchPassengerProfile();
      } else {
        showToast(json.error?.message || "Failed to add contact.");
      }
    } catch (e) {
      showToast("Network error adding contact.");
    }
  };

  // -------------------------------------------------------------------------
  // RENDER: Main Unified Application
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unified Application Header with Mode Switcher */}
      <UnifiedNavbar
        onOpenAuth={(m) => {
          setAuthInitialMode(m || "LOGIN");
          setAuthModalOpen(true);
        }}
        onOpenDriverOnboard={() => setDriverOnboardModalOpen(true)}
        onSelectTab={(t) => {
          if (activeMode === "PASSENGER") setPassengerTab(t as any);
          else setDriverTab(t as any);
        }}
        activeTab={activeMode === "PASSENGER" ? passengerTab : driverTab}
      />

      {/* Sub-Header Navigation (Mode-Tailored Tabs) */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-2 no-scrollbar">
            {activeMode === "PASSENGER" ? (
              /* PASSENGER TABS */
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPassengerTab("SEARCH")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    passengerTab === "SEARCH"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find a Ride</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPassengerTab("MY_BOOKINGS")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    passengerTab === "MY_BOOKINGS"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
                  {myUpcomingBookings.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-extrabold">
                      {myUpcomingBookings.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPassengerTab("PROFILE")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    passengerTab === "PROFILE"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Shared Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPassengerTab("HELP")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    passengerTab === "HELP"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safety & Support</span>
                </button>
              </div>
            ) : (
              /* DRIVER TABS */
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDriverTab("DASHBOARD")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "DASHBOARD"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriverTab("PUBLISH")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "PUBLISH"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publish Ride</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriverTab("RIDES")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "RIDES"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>My Rides & Manifest</span>
                  {driverRides.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[10px] flex items-center justify-center font-extrabold">
                      {driverRides.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDriverTab("FLEET")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "FLEET"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>My Fleet</span>
                  <span className="text-[10px] font-bold text-slate-400">({vehicles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriverTab("EARNINGS")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "EARNINGS"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Earnings & Settlements</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriverTab("PROFILE")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    driverTab === "PROFILE"
                      ? "bg-slate-900 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Shared Profile</span>
                </button>
              </div>
            )}

            {/* Quick Context Switch Badge */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Viewing as:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                activeMode === "PASSENGER" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}>
                {activeMode === "PASSENGER" ? "Rider / Commuter" : "Driver Partner"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ================================================================= */}
        {/* PASSENGER MODE VIEWS */}
        {/* ================================================================= */}
        {activeMode === "PASSENGER" && (
          <div>
            {/* VIEW 1: SEARCH & EXPLORE RIDES */}
            {passengerTab === "SEARCH" && (
              <div className="space-y-6">
                {/* Search Bar Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs">
                  <div className="max-w-2xl mb-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      NH 65 Intercity Corridor
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                      Where would you like to travel today?
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Bidar ⇄ Hyderabad flat rate of ₹310 per seat. Fully verified co-commuters. Zero surge pricing.
                    </p>
                  </div>

                  {/* Route & Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Origin */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">From</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        >
                          <option value="Bidar">Bidar (New Bus Stand)</option>
                          <option value="Hyderabad">Hyderabad (Gachibowli / Miyapur)</option>
                        </select>
                      </div>
                    </div>

                    {/* Destination with Swap Button */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1">To</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        >
                          <option value="Hyderabad">Hyderabad (Gachibowli / Miyapur)</option>
                          <option value="Bidar">Bidar (New Bus Stand)</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleSwapCities}
                          title="Swap Origin and Destination"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                        >
                          ⇄
                        </button>
                      </div>
                    </div>

                    {/* Travel Date & Search CTA */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="date"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => fetchRides(origin, destination, seats)}
                          disabled={loadingRides}
                          className="h-11 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          {loadingRides ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span>Search</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Corridor Guarantee Strip */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>310 Rs Flat Fare</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>KYC-Verified Drivers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Platform Escrow Protection</span>
                      </div>
                    </div>

                    <div className="text-slate-400">
                      Driving along NH 65?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveMode("DRIVER")}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Publish ride as Driver Partner →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ride Results Feed */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Available Corridor Departures
                      </h2>
                      <span className="text-xs text-slate-500">
                        {origin} → {destination} • {rides.length} ride{rides.length !== 1 ? "s" : ""} available
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchRides()}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingRides ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
                          <div className="h-4 bg-slate-200 rounded-md w-1/4 mb-3" />
                          <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-2" />
                          <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : rides.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                        <Compass className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">No Scheduled Departures Found</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        No driver partners have published departures for this route and date yet. You can be the first to publish or check back soon!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveMode("DRIVER")}
                        className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-all shadow-sm inline-flex items-center gap-2"
                      >
                        <Car className="w-4 h-4" />
                        <span>Publish Ride as Driver Partner</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {rides.map((r) => {
                        const depTimeStr = r.departure_time
                          ? new Date(r.departure_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "Scheduled";
                        return (
                          <div
                            key={r.ride_id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                          >
                            <div className="flex-1 space-y-3">
                              {/* Top Bar: Driver & Time */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center border border-blue-100">
                                    {r.driver?.name?.charAt(0) || "D"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-sm text-slate-900">{r.driver?.name || "Verified Driver"}</span>
                                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      <span className="font-semibold text-slate-700">{r.driver?.rating || "5.0"}</span>
                                      <span>•</span>
                                      <span>{r.driver?.total_completed_trips || 0} trips</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xl font-extrabold text-slate-900">₹{r.fare_per_seat}</span>
                                  <span className="text-[10px] text-slate-400 block font-medium">per seat (Toll incl.)</span>
                                </div>
                              </div>

                              {/* Route Timeline */}
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="font-semibold text-slate-800">{depTimeStr}:</span>
                                  <span className="text-slate-600 truncate">{r.pickup_point}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="font-semibold text-slate-800">+2h 45m:</span>
                                  <span className="text-slate-600 truncate">{r.drop_point}</span>
                                </div>
                              </div>

                              {/* Vehicle Meta */}
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-medium">
                                  <Car className="w-3.5 h-3.5 text-slate-400" />
                                  {r.vehicle?.make} {r.vehicle?.model}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-slate-700 font-semibold">{r.vehicle?.registration_number}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {r.available_seats} seats remaining
                                </span>
                              </div>
                            </div>

                            {/* Booking Action */}
                            <div className="md:border-l md:border-slate-100 md:pl-5 flex md:flex-col items-center justify-between md:justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRide(r);
                                  setBookingModalOpen(true);
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm"
                              >
                                Reserve Seat
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: MY BOOKINGS & PASSES */}
            {passengerTab === "MY_BOOKINGS" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    My Bookings & Digital Boarding Passes
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your upcoming corridor travel, view offline digital QR ticket passes, or call your driver partner.
                  </p>
                </div>

                {bookingsLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading bookings...</div>
                ) : myUpcomingBookings.length === 0 && myHistoryBookings.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Bookings Yet</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Search for available corridor departures on NH 65 to reserve your seat.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPassengerTab("SEARCH")}
                      className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      Search Available Rides
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myUpcomingBookings.map((b) => (
                      <div
                        key={b.booking_id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                              {b.reference_code || b.booking_id}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.booking_status}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {b.payment_status}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900">
                            {b.route?.origin_city || "Bidar"} → {b.route?.destination_city || "Hyderabad"}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                            <div><strong>Departure:</strong> {b.route?.departure_time ? new Date(b.route.departure_time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "Scheduled"}</div>
                            <div><strong>Pickup:</strong> {b.route?.pickup_point}</div>
                            <div><strong>Driver:</strong> {b.driver?.name} ({b.passenger?.phone})</div>
                            <div><strong>Vehicle:</strong> {b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.registration_number})</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTicket(b);
                              setTicketModalOpen(true);
                            }}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4 text-amber-400" />
                            <span>Digital Ticket Pass</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: SHARED PROFILE (RENDERED IN DEDICATED SECTION BELOW) */}
            {passengerTab === "PROFILE" && (
              <SharedProfileSection
                profileSubTab={profileSubTab}
                setProfileSubTab={setProfileSubTab}
                user={user}
                passengerProfile={passengerProfile}
                driverProfile={driverProfile}
                vehicles={vehicles}
                editPickupLandmark={editPickupLandmark}
                setEditPickupLandmark={setEditPickupLandmark}
                editMedicalNotes={editMedicalNotes}
                setEditMedicalNotes={setEditMedicalNotes}
                newContactName={newContactName}
                setNewContactName={setNewContactName}
                newContactPhone={newContactPhone}
                setNewContactPhone={setNewContactPhone}
                newContactRel={newContactRel}
                setNewContactRel={setNewContactRel}
                profileSaving={profileSaving}
                profileFeedback={profileFeedback}
                onSavePassengerPreferences={handleSavePassengerPreferences}
                onAddEmergencyContact={handleAddEmergencyContact}
                onOpenDriverOnboard={() => setDriverOnboardModalOpen(true)}
                onSwitchMode={(m) => setActiveMode(m)}
                activeMode={activeMode}
              />
            )}

            {/* VIEW 4: SAFETY & SUPPORT */}
            {passengerTab === "HELP" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Safety Standards & 24/7 Helpline
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Dedicated highway safety protocols and immediate passenger protection on NH 65.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Highway Emergency Helpline</span>
                    <h2 className="text-xl font-black text-red-900">+91 8482 112 112</h2>
                    <p className="text-xs text-red-600">Dispatches local highway patrol & corridor assistance immediately.</p>
                  </div>
                  <a
                    href="tel:+918482112112"
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Helpline Now</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
                    <h3 className="font-bold text-sm text-slate-900">100% Verified Drivers</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Every driver partner holds a government-issued driving licence verified against central VAHAN/SARATHI databases.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">2</div>
                    <h3 className="font-bold text-sm text-slate-900">Platform Escrow</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Passenger fares are secured under platform escrow and released only upon verified trip arrival.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* DRIVER MODE VIEWS */}
        {/* ================================================================= */}
        {activeMode === "DRIVER" && (
          <div>
            {/* VIEW 1: DRIVER DASHBOARD */}
            {driverTab === "DASHBOARD" && (
              <div className="space-y-6">
                {/* Greeting & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      Driver Partner Center
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                      Ready for your next journey, {user?.full_name?.split(" ")[0]}?
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Publish seats along NH 65 and earn locked ₹290 per confirmed passenger seat.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDriverTab("PUBLISH")}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Highway Ride</span>
                  </button>
                </div>

                {/* 4 Real-time Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">Active Rides</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{driverRides.length}</div>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Scheduled Departures</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">Confirmed Riders</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {driverRides.reduce((acc, r) => acc + (r.total_confirmed_passengers || 0), 0)}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Live Manifest</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">Net Payable</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      ₹{earnings?.pending_payout_amount || 0}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold mt-1 block">₹290 / Seat Cleared</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">Partner Rating</span>
                    <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
                      <span>{driverProfile?.average_rating ? Number(driverProfile.average_rating).toFixed(2) : "5.00"}</span>
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Corridor Driver</span>
                  </div>
                </div>

                {/* Active Ride Banner */}
                {driverRides.length > 0 ? (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                            Upcoming Trip: {driverRides[0].origin_city} → {driverRides[0].destination_city}
                          </span>
                          <span className="text-xs text-slate-400">
                            Status: <strong className="text-white">{driverRides[0].status}</strong>
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold mt-2">
                          {driverRides[0].departure_time ? new Date(driverRides[0].departure_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Scheduled"}
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                          Pickup: {driverRides[0].pickup_point} • Vehicle: {driverRides[0].vehicle?.make} {driverRides[0].vehicle?.model} ({driverRides[0].vehicle?.registration_number})
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRideForManifest(driverRides[0]);
                            setDriverTab("RIDES");
                          }}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors"
                        >
                          View Passenger Manifest
                        </button>
                        {driverRides[0].status === "SCHEDULED" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateRideStatus(driverRides[0].ride_id, "EN_ROUTE")}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                          >
                            Start Highway Trip
                          </button>
                        ) : driverRides[0].status === "EN_ROUTE" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateRideStatus(driverRides[0].ride_id, "COMPLETED")}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                          >
                            Complete Trip & Release ₹{driverRides[0].estimated_gross_earnings}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 px-3 py-2 bg-emerald-950/40 rounded-xl border border-emerald-800">
                            Trip Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                      <Car className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Scheduled Highway Rides</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Post your upcoming departure along NH 65 to accept co-commuter seat reservations.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDriverTab("PUBLISH")}
                      className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-all shadow-sm"
                    >
                      Publish Ride Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: PUBLISH RIDE */}
            {driverTab === "PUBLISH" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Publish Corridor Departure
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Scheduled intercity travel along NH 65 with locked government-compliant pricing of ₹310 per seat.
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                  {pubFeedback && (
                    <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl font-medium">
                      {pubFeedback}
                    </div>
                  )}

                  <form onSubmit={handlePublishRide} className="space-y-4">
                    {/* Route Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Corridor Route</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={pubOrigin}
                          onChange={(e) => {
                            setPubOrigin(e.target.value);
                            setPubDest(e.target.value === "Bidar" ? "Hyderabad" : "Bidar");
                          }}
                          className="h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        >
                          <option value="Bidar">From: Bidar</option>
                          <option value="Hyderabad">From: Hyderabad</option>
                        </select>

                        <select
                          value={pubDest}
                          onChange={(e) => {
                            setPubDest(e.target.value);
                            setPubOrigin(e.target.value === "Hyderabad" ? "Bidar" : "Hyderabad");
                          }}
                          className="h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        >
                          <option value="Hyderabad">To: Hyderabad</option>
                          <option value="Bidar">To: Bidar</option>
                        </select>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Departure Date</label>
                        <input
                          type="date"
                          required
                          value={pubDate}
                          onChange={(e) => setPubDate(e.target.value)}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Departure Time</label>
                        <input
                          type="time"
                          required
                          value={pubTime}
                          onChange={(e) => setPubTime(e.target.value)}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Landmarks */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Exact Pickup Landmark</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. New Bus Stand, Bidar"
                        value={pubPickup}
                        onChange={(e) => setPubPickup(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Exact Drop Landmark</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gachibowli DLF, Hyderabad"
                        value={pubDrop}
                        onChange={(e) => setPubDrop(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                    </div>

                    {/* Vehicle Details */}
                    {vehicles.length > 0 ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Vehicle from Fleet</label>
                        <select
                          value={pubVehicleId}
                          onChange={(e) => setPubVehicleId(e.target.value)}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                        >
                          {vehicles.map((v) => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>
                              {v.make} {v.model} ({v.registration_number}) • {v.fuel_type}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Car Make</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Hyundai"
                            value={pubMake}
                            onChange={(e) => setPubMake(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Model</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Creta"
                            value={pubModel}
                            onChange={(e) => setPubModel(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Plate Number</label>
                          <input
                            type="text"
                            required
                            placeholder="KA 38 M 5678"
                            value={pubReg}
                            onChange={(e) => setPubReg(e.target.value.toUpperCase())}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Seats Offered */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Available Seats Offered</label>
                      <select
                        value={pubSeats}
                        onChange={(e) => setPubSeats(Number(e.target.value))}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      >
                        <option value={3}>3 Seats (Cozy)</option>
                        <option value={4}>4 Seats (Standard)</option>
                        <option value={6}>6 Seats (SUV / MPV)</option>
                      </select>
                    </div>

                    {/* Locked Price Ledger Box */}
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>Passenger Seat Fare:</span>
                        <span className="text-slate-900">₹310 (Fixed Corridor Rate)</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Your Net Settlement per Seat:</span>
                        <span>₹290</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-amber-700 pt-1 border-t border-amber-200">
                        <span>Total Expected Net Payout ({pubSeats} Seats):</span>
                        <span className="font-extrabold">₹{pubSeats * 290}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={pubLoading}
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-amber-400 font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {pubLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing Corridor Ride...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Publish Corridor Ride (NH 65)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 3: DRIVER RIDES & LIVE MANIFEST */}
            {driverTab === "RIDES" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    My Scheduled Rides & Live Passenger Manifest
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your upcoming departures, inspect passenger lists, verify boardings, and complete highway trips.
                  </p>
                </div>

                {driverRides.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Rides Published</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      You haven't scheduled any corridor trips today.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDriverTab("PUBLISH")}
                      className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      Publish Ride Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {driverRides.map((r) => (
                      <div
                        key={r.ride_id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                                {r.ride_id}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {r.status}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">
                              {r.origin_city} → {r.destination_city}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {r.departure_time ? new Date(r.departure_time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "Scheduled"} • {r.pickup_point}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {r.status === "SCHEDULED" ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateRideStatus(r.ride_id, "EN_ROUTE")}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                              >
                                Start Highway Trip
                              </button>
                            ) : r.status === "EN_ROUTE" ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateRideStatus(r.ride_id, "COMPLETED")}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                              >
                                Complete Trip & Settle
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Passenger Manifest Section */}
                        <div>
                          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                            <span>Confirmed Passengers on Manifest:</span>
                            <span className="text-slate-500 font-normal">
                              {r.manifest ? r.manifest.length : 0} reservation(s)
                            </span>
                          </div>

                          {!r.manifest || r.manifest.length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 text-center">
                              No passenger bookings yet. Available seats: {r.available_seats}.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {r.manifest.map((m) => (
                                <div
                                  key={m.booking_id}
                                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900">{m.passenger_name}</div>
                                    <div className="text-slate-500 font-medium">
                                      {m.passenger_phone} • {m.seats_booked} Seat(s)
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-emerald-700 block">₹{m.fare_amount} Escrow</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{m.reference_code}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: FLEET MANAGEMENT */}
            {driverTab === "FLEET" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      My Vehicle Fleet
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Manage registered highway vehicles for your corridor departures.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddVehicleOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Car</span>
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                      <Car className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Vehicles Registered</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Add your vehicle details to publish corridor departures along NH 65.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddVehicleOpen(true)}
                      className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      Register Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((v) => (
                      <div
                        key={v.vehicle_id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900">{v.make} {v.model}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center font-mono font-bold text-sm text-slate-800 tracking-wider">
                          {v.registration_number}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                          <div>Fuel: <strong className="text-slate-700">{v.fuel_type}</strong></div>
                          <div>Capacity: <strong className="text-slate-700">{v.passenger_capacity} Seats</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 5: EARNINGS & SETTLEMENTS */}
            {driverTab === "EARNINGS" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Earnings & Escrow Settlement Ledger
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Direct automated clearing at locked ₹290 net per passenger seat.
                  </p>
                </div>

                {/* Net Balance Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Net Available Balance</span>
                  <div className="text-3xl sm:text-4xl font-black mt-2 mb-1">
                    ₹{earnings?.pending_payout_amount || 0}
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculated strictly as ₹290 driver settlement + ₹20 platform contribution = ₹310 total fare.
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      Destination: <strong className="text-white">{driverProfile?.payout_upi_id || "Registered UPI/Bank Account"}</strong>
                    </div>

                    <button
                      type="button"
                      disabled={payoutLoading || (earnings?.pending_payout_amount || 0) <= 0}
                      onClick={() => {
                        const rideId = driverRides[0]?.ride_id;
                        if (rideId) handleDisbursePayout(rideId);
                        else showToast("No active completed rides to disburse.");
                      }}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payoutLoading ? "Processing..." : "Withdraw to Bank / UPI"}
                    </button>
                  </div>
                </div>

                {/* Lifetime Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400">Total Completed Trips</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">{earnings?.total_completed_trips || 0}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400">Seats Sold</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">{earnings?.total_seats_sold || 0}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-slate-400">Total Disbursed Net</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">₹{earnings?.total_net_payout || 0}</div>
                  </div>
                </div>

                {/* Settlement History */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">Settlement History</h3>
                  {!earnings?.recent_payouts || earnings.recent_payouts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                      No settlement transactions recorded yet. Completed trips automatically trigger escrow disbursement.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {earnings.recent_payouts.map((p) => (
                        <div
                          key={p.payout_id}
                          className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900">Payout #{p.payout_id.slice(0, 8)}</span>
                            <span className="text-slate-500 block">{p.paid_at || "Processed"} • Status: {p.status}</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 text-sm">+ ₹{p.net_amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 6: SHARED PROFILE (DRIVER MODE CONTEXT) */}
            {driverTab === "PROFILE" && (
              <SharedProfileSection
                profileSubTab={profileSubTab}
                setProfileSubTab={setProfileSubTab}
                user={user}
                passengerProfile={passengerProfile}
                driverProfile={driverProfile}
                vehicles={vehicles}
                editPickupLandmark={editPickupLandmark}
                setEditPickupLandmark={setEditPickupLandmark}
                editMedicalNotes={editMedicalNotes}
                setEditMedicalNotes={setEditMedicalNotes}
                newContactName={newContactName}
                setNewContactName={setNewContactName}
                newContactPhone={newContactPhone}
                setNewContactPhone={setNewContactPhone}
                newContactRel={newContactRel}
                setNewContactRel={setNewContactRel}
                profileSaving={profileSaving}
                profileFeedback={profileFeedback}
                onSavePassengerPreferences={handleSavePassengerPreferences}
                onAddEmergencyContact={handleAddEmergencyContact}
                onOpenDriverOnboard={() => setDriverOnboardModalOpen(true)}
                onSwitchMode={(m) => setActiveMode(m)}
                activeMode={activeMode}
              />
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* RESPONSIVE MOBILE BOTTOM NAVIGATION BAR */}
      {/* =================================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2">
        <div className="flex items-center justify-around">
          {activeMode === "PASSENGER" ? (
            <>
              <button
                type="button"
                onClick={() => setPassengerTab("SEARCH")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  passengerTab === "SEARCH" ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => setPassengerTab("MY_BOOKINGS")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  passengerTab === "MY_BOOKINGS" ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Ticket className="w-5 h-5" />
                <span>Bookings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("DRIVER")}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-amber-600"
              >
                <Car className="w-5 h-5" />
                <span>Driver Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setPassengerTab("PROFILE")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  passengerTab === "PROFILE" ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDriverTab("DASHBOARD")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  driverTab === "DASHBOARD" ? "text-amber-500" : "text-slate-500"
                }`}
              >
                <Compass className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setDriverTab("PUBLISH")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  driverTab === "PUBLISH" ? "text-amber-500" : "text-slate-500"
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Publish</span>
              </button>

              <button
                type="button"
                onClick={() => setDriverTab("RIDES")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  driverTab === "RIDES" ? "text-amber-500" : "text-slate-500"
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>Manifest</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("PASSENGER")}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-blue-600"
              >
                <Users className="w-5 h-5" />
                <span>Rider Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setDriverTab("PROFILE")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                  driverTab === "PROFILE" ? "text-amber-500" : "text-slate-500"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}

      {/* 1. Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      {/* 2. Driver Onboard Modal */}
      <DriverOnboardModal
        isOpen={driverOnboardModalOpen}
        onClose={() => setDriverOnboardModalOpen(false)}
        onSuccess={() => {
          showToast("Driver Partner mode activated!");
          fetchDriverData();
        }}
      />

      {/* 3. Seat Hold & Escrow Payment Modal */}
      {bookingModalOpen && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Reserve Corridor Seat</h3>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900">
                {selectedRide.origin_city} → {selectedRide.destination_city}
              </div>
              <div className="text-slate-500">
                Driver: {selectedRide.driver?.name} • {selectedRide.vehicle?.make} {selectedRide.vehicle?.model}
              </div>
              <div className="text-slate-500">
                Pickup: {selectedRide.pickup_point}
              </div>
            </div>

            {/* Seat Selector with Live Visible Feedback */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Choose Seats to Reserve</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSeats(num)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      seats === num
                        ? "bg-blue-50 border-blue-600 text-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{num} Seat{num > 1 ? "s" : ""}</span>
                    <span className="text-[11px] font-semibold opacity-80">{num * 310} Rs</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs p-3 bg-blue-50/70 rounded-xl border border-blue-100">
              <div>
                <span className="block text-[10px] font-bold text-blue-600 uppercase">Selected Seats</span>
                <span className="font-bold text-slate-900">{seats} Seat{seats > 1 ? "s" : ""} Reserved</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Fare</span>
                <span className="text-base font-black text-blue-700">{seats * 310} Rs</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleInitiateHold}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Initiate 10-Minute Seat Hold</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Escrow UPI QR Payment Modal */}
      {holdModalOpen && activeHold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Platform Escrow Payment</h3>
                <span className="text-[11px] text-amber-600 font-bold">
                  Hold expires in: {Math.floor(holdSecondsRemaining / 60)}:{(holdSecondsRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHoldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* UPI QR Display */}
            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-40 h-40 bg-white mx-auto p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-800" />
              </div>
              <div className="font-mono text-xs font-bold text-slate-900">
                UPI ID: bidarconnect@upi
              </div>
              <div className="text-xs font-black text-blue-600">
                Pay Exactly: ₹{activeHold.total_fare || (seats * 310)}
              </div>
            </div>

            {/* UTR Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 12-Digit UPI UTR Reference</label>
              <input
                type="text"
                placeholder="e.g. 431089124019"
                value={paymentUtr}
                onChange={(e) => setPaymentUtr(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <button
              type="button"
              disabled={confirmingHold}
              onClick={handleConfirmHoldPayment}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {confirmingHold ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Verify Payment & Confirm Ticket</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Digital QR Boarding Pass Modal */}
      {ticketModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Corridor Boarding Pass</h3>
              <span className="font-mono text-xs font-bold text-blue-600">{activeTicket.reference_code || activeTicket.booking_id}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <QrCode className="w-36 h-36 mx-auto text-slate-900" />
              <span className="text-[10px] text-slate-400 mt-2 block">Present this QR code to your driver upon boarding.</span>
            </div>

            <div className="text-xs text-slate-600 text-left space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div><strong>Route:</strong> {activeTicket.route?.origin_city} → {activeTicket.route?.destination_city}</div>
              <div><strong>Pickup:</strong> {activeTicket.route?.pickup_point}</div>
              <div><strong>Driver:</strong> {activeTicket.driver?.name}</div>
              <div><strong>Vehicle:</strong> {activeTicket.vehicle?.make} {activeTicket.vehicle?.model}</div>
            </div>

            <button
              type="button"
              onClick={() => setTicketModalOpen(false)}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 6. Add Vehicle Modal (Driver Mode) */}
      {addVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Vehicle to Fleet</h3>
              <button
                type="button"
                onClick={() => setAddVehicleOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maruti"
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ertiga"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA 38 M 5678"
                  value={vReg}
                  onChange={(e) => setVReg(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fuel</label>
                  <select
                    value={vFuel}
                    onChange={(e) => setVFuel(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">EV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity</label>
                  <select
                    value={vCapacity}
                    onChange={(e) => setVCapacity(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={3}>3 Seats</option>
                    <option value={4}>4 Seats</option>
                    <option value={6}>6 Seats</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={vLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {vLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                <span>Add Vehicle to Fleet</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Shared Profile Section
// ---------------------------------------------------------------------------
function SharedProfileSection({
  profileSubTab,
  setProfileSubTab,
  user,
  passengerProfile,
  driverProfile,
  vehicles,
  editPickupLandmark,
  setEditPickupLandmark,
  editMedicalNotes,
  setEditMedicalNotes,
  newContactName,
  setNewContactName,
  newContactPhone,
  setNewContactPhone,
  newContactRel,
  setNewContactRel,
  profileSaving,
  profileFeedback,
  onSavePassengerPreferences,
  onAddEmergencyContact,
  onOpenDriverOnboard,
  onSwitchMode,
  activeMode
}: {
  profileSubTab: "PERSONAL" | "PASSENGER" | "DRIVER";
  setProfileSubTab: (t: "PERSONAL" | "PASSENGER" | "DRIVER") => void;
  user: any;
  passengerProfile: any;
  driverProfile: any;
  vehicles: any[];
  editPickupLandmark: string;
  setEditPickupLandmark: (v: string) => void;
  editMedicalNotes: string;
  setEditMedicalNotes: (v: string) => void;
  newContactName: string;
  setNewContactName: (v: string) => void;
  newContactPhone: string;
  setNewContactPhone: (v: string) => void;
  newContactRel: string;
  setNewContactRel: (v: string) => void;
  profileSaving: boolean;
  profileFeedback: string | null;
  onSavePassengerPreferences: () => void;
  onAddEmergencyContact: (e: React.FormEvent) => void;
  onOpenDriverOnboard: () => void;
  onSwitchMode: (mode: "PASSENGER" | "DRIVER") => void;
  activeMode: string;
}) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {(user?.full_name || "BC").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">{user?.full_name || "Verified Traveller"}</h1>
            <p className="text-xs text-slate-500 font-medium">{user?.phone} • {user?.email || "No email on file"}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Verified Passenger
              </span>
              {user?.is_driver ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Verified Driver Partner
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenDriverOnboard}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  + Activate Driver Partner
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSwitchMode(activeMode === "DRIVER" ? "PASSENGER" : "DRIVER")}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          Switch to {activeMode === "DRIVER" ? "Passenger Mode" : "Driver Mode"}
        </button>
      </div>

      {/* Sub-tabs for Shared Profile */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setProfileSubTab("PERSONAL")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            profileSubTab === "PERSONAL" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Personal & Emergency Contacts
        </button>
        <button
          type="button"
          onClick={() => setProfileSubTab("PASSENGER")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            profileSubTab === "PASSENGER" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Passenger Records & Preferences
        </button>
        <button
          type="button"
          onClick={() => setProfileSubTab("DRIVER")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            profileSubTab === "DRIVER" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Driver Partner Records & Fleet
        </button>
      </div>

      {/* SUB-TAB 1: PERSONAL & EMERGENCY */}
      {profileSubTab === "PERSONAL" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Account Identity</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Legal Name</span>
                <span className="font-semibold text-slate-800">{user?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mobile Number</span>
                <span className="font-semibold text-slate-800">{user?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Status</span>
                <span className="text-emerald-600 font-bold">Active & Verified (NH 65 Corridor)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Emergency Contacts (SOS Relay)</h3>
            <div className="space-y-2">
              {passengerProfile?.emergency_contacts?.map((c: any) => (
                <div key={c.id || c.phone} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-slate-500 block">{c.phone}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-medium">{c.relationship_type}</span>
                </div>
              ))}
            </div>

            <form onSubmit={onAddEmergencyContact} className="pt-2 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">+ Add Contact</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Save Emergency Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PASSENGER RECORDS */}
      {profileSubTab === "PASSENGER" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Passenger Preferences</h3>
          {profileFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl font-medium">
              {profileFeedback}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred Pickup Landmark (Bidar)</label>
              <input
                type="text"
                placeholder="e.g. New Bus Stand, Mailoor Cross, Guru Nanak Gate"
                value={editPickupLandmark}
                onChange={(e) => setEditPickupLandmark(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Medical / Emergency Travel Notes</label>
              <textarea
                rows={3}
                placeholder="e.g. Motion sickness, diabetic passenger, requires front seat"
                value={editMedicalNotes}
                onChange={(e) => setEditMedicalNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <button
              type="button"
              disabled={profileSaving}
              onClick={onSavePassengerPreferences}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {profileSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DRIVER RECORDS */}
      {profileSubTab === "DRIVER" && (
        <div className="space-y-6">
          {user?.is_driver ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
              <h3 className="text-sm font-bold text-slate-900">Driver Partner Credentials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Driving Licence Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{driverProfile?.licence_number || "KA38-DL-VERIFIED"}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Licence Valid Until</span>
                  <span className="font-bold text-slate-900 text-sm">{driverProfile?.licence_expiry || "2030-12-31"}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Payout UPI ID</span>
                  <span className="font-bold text-slate-900 text-sm">{driverProfile?.payout_upi_id || "bidarconnect@upi"}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Completed Highway Trips</span>
                  <span className="font-bold text-emerald-600 text-sm">{driverProfile?.total_completed_trips || 0} Trips</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Registered Vehicles ({vehicles.length})</span>
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <div key={v.vehicle_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{v.make} {v.model}</span>
                        <span className="font-mono text-slate-500 block">{v.registration_number}</span>
                      </div>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {v.fuel_type} • {v.passenger_capacity} Seats
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Driver Partner Mode Not Activated</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are currently registered as a passenger. Activate Driver Partner capabilities to publish rides and earn locked ₹290 per seat.
              </p>
              <button
                type="button"
                onClick={onOpenDriverOnboard}
                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Activate Driver Mode Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
