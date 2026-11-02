"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import {
  Car,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  ShieldCheck,
  Wallet,
  Clock,
  MapPin,
  Users,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  RefreshCw,
  Plus,
  FileText,
  CreditCard,
  AlertTriangle,
  X,
  ChevronRight,
  Info,
  Building,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface Vehicle {
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

interface DriverProfile {
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

interface DriverRide {
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
}

interface PassengerManifestItem {
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
  emergency_contact?: {
    name: string;
    phone: string;
    relationship_type: string;
  } | null;
}

interface ManifestData {
  ride_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_offered_seats: number;
  available_seats: number;
  booked_seats: number;
  fare_per_seat: number;
  manifest: PassengerManifestItem[];
}

interface EarningsData {
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

export default function DriverPortalPage() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PUBLISH" | "RIDES" | "FLEET" | "KYC" | "EARNINGS">("OVERVIEW");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Data states
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & form states
  const [selectedRideForManifest, setSelectedRideForManifest] = useState<ManifestData | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Publish Form State
  const [pubOrigin, setPubOrigin] = useState("Bidar");
  const [pubDestination, setPubDestination] = useState("Hyderabad");
  const [pubDate, setPubDate] = useState("2026-11-06");
  const [pubTime, setPubTime] = useState("08:00");
  const [pubPickup, setPubPickup] = useState("New Bus Stand, Bidar");
  const [pubDrop, setPubDrop] = useState("Gachibowli DLF, Hyderabad");
  const [pubSeats, setPubSeats] = useState(3);
  const [pubVehicleId, setPubVehicleId] = useState("");
  const [pubNotes, setPubNotes] = useState("AC on throughout. Punctual departure guaranteed.");
  const [publishing, setPublishing] = useState(false);

  // New Vehicle Form State
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vReg, setVReg] = useState("");
  const [vColor, setVColor] = useState("");
  const [vYear, setVYear] = useState(2023);
  const [vFuel, setVFuel] = useState("DIESEL");
  const [vCapacity, setVCapacity] = useState(4);
  const [vSubmitting, setVSubmitting] = useState(false);

  // Payout Settings Form State
  const [pUpi, setPUpi] = useState("");
  const [pBankAcc, setPBankAcc] = useState("");
  const [pIfsc, setPIfsc] = useState("");
  const [pSubmitting, setPSubmitting] = useState(false);

  // KYC Form State
  const [kLicence, setKLicence] = useState("");
  const [kExpiry, setKExpiry] = useState("2028-12-31");
  const [kSubmitting, setKSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Profile
      const profRes = await fetch(`${API_BASE}/driver/profile`, { headers });
      const profData = await profRes.json();
      if (profData.success && profData.data) {
        setProfile(profData.data);
        if (profData.data.payout_upi_id) setPUpi(profData.data.payout_upi_id);
        if (profData.data.payout_bank_account) setPBankAcc(profData.data.payout_bank_account);
        if (profData.data.payout_ifsc) setPIfsc(profData.data.payout_ifsc);
      }

      // 2. Vehicles
      const vehRes = await fetch(`${API_BASE}/driver/vehicles`, { headers });
      const vehData = await vehRes.json();
      if (vehData.success && vehData.data) {
        setVehicles(vehData.data);
        if (vehData.data.length > 0 && !pubVehicleId) {
          setPubVehicleId(vehData.data[0].vehicle_id);
        }
      }

      // 3. Rides
      const rideRes = await fetch(`${API_BASE}/driver/rides`, { headers });
      const rideData = await rideRes.json();
      if (rideData.success && rideData.data) {
        setRides(rideData.data);
      }

      // 4. Earnings
      const earnRes = await fetch(`${API_BASE}/driver/earnings`, { headers });
      const earnData = await earnRes.json();
      if (earnData.success && earnData.data) {
        setEarnings(earnData.data);
      }
    } catch (e) {
      console.error("Failed to load driver dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle Route flip
  const handleSwapRoute = () => {
    if (pubOrigin === "Bidar") {
      setPubOrigin("Hyderabad");
      setPubDestination("Bidar");
      setPubPickup("Gachibowli DLF, Hyderabad");
      setPubDrop("New Bus Stand, Bidar");
    } else {
      setPubOrigin("Bidar");
      setPubDestination("Hyderabad");
      setPubPickup("New Bus Stand, Bidar");
      setPubDrop("Gachibowli DLF, Hyderabad");
    }
  };

  // Publish Ride Handler
  const handlePublishRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    setPublishing(true);
    try {
      const departure_time = `${pubDate}T${pubTime}:00+05:30`;
      const res = await fetch(`${API_BASE}/driver/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin_city: pubOrigin,
          destination_city: pubDestination,
          departure_time,
          pickup_point: pubPickup,
          drop_point: pubDrop,
          available_seats: Number(pubSeats),
          vehicle_id: pubVehicleId || (vehicles[0]?.vehicle_id ?? "veh_default"),
          driver_notes: pubNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Ride published successfully with locked ₹310 corridor fare!");
        setActiveTab("RIDES");
        fetchDashboardData();
      } else {
        showToast("error", data.error?.message || "Failed to publish ride");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error publishing ride");
    } finally {
      setPublishing(false);
    }
  };

  // Open Passenger Manifest Modal
  const handleOpenManifest = async (rideId: string) => {
    if (!token) return;
    setManifestLoading(true);
    try {
      const res = await fetch(`${API_BASE}/driver/rides/${rideId}/manifest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setSelectedRideForManifest(data.data);
      } else {
        showToast("error", data.error?.message || "Could not retrieve manifest");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error loading manifest");
    } finally {
      setManifestLoading(false);
    }
  };

  // Transition Journey Status
  const handleUpdateStatus = async (rideId: string, nextStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/driver/rides/${rideId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Ride transitioned to ${nextStatus}!`);
        if (selectedRideForManifest && selectedRideForManifest.ride_id === rideId) {
          setSelectedRideForManifest({ ...selectedRideForManifest, status: nextStatus });
        }
        fetchDashboardData();
      } else {
        showToast("error", data.error?.message || "Failed to update journey status");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error updating status");
    }
  };

  // Register New Vehicle
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setVSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/driver/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          make: vMake,
          model: vModel,
          registration_number: vReg,
          color: vColor,
          year: Number(vYear),
          fuel_type: vFuel,
          passenger_capacity: Number(vCapacity),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Vehicle ${vReg} added to your fleet!`);
        setIsVehicleModalOpen(false);
        setVMake("");
        setVModel("");
        setVReg("");
        setVColor("");
        fetchDashboardData();
      } else {
        showToast("error", data.error?.message || "Failed to register vehicle");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error registering vehicle");
    } finally {
      setVSubmitting(false);
    }
  };

  // Save Payout Settings
  const handleSavePayouts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/driver/payout-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payout_upi_id: pUpi || undefined,
          payout_bank_account: pBankAcc || undefined,
          payout_ifsc: pIfsc || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Payout configuration saved successfully!");
        fetchDashboardData();
      } else {
        showToast("error", data.error?.message || "Failed to save payout settings");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error saving settings");
    } finally {
      setPSubmitting(false);
    }
  };

  // Submit Driver KYC
  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setKSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/driver/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          licence_number: kLicence,
          licence_expiry: kExpiry,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Driving Licence verified successfully! You are now a Verified Partner.");
        setKLicence("");
        fetchDashboardData();
      } else {
        showToast("error", data.error?.message || "Failed to verify licence");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error updating KYC");
    } finally {
      setKSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center space-x-2 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header - Brand Navy & Royal Blue */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black tracking-tight text-white">Bidar Connect</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                  Driver Portal
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: "OVERVIEW", label: "Dashboard", icon: LayoutDashboard },
                { id: "PUBLISH", label: "Publish Ride", icon: PlusCircle },
                { id: "RIDES", label: "My Rides & Manifests", icon: ClipboardList },
                { id: "FLEET", label: "My Fleet", icon: Car },
                { id: "KYC", label: "KYC & Licence", icon: ShieldCheck },
                { id: "EARNINGS", label: "Earnings & Payouts", icon: Wallet },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Auth / Profile Area */}
            <div className="flex items-center space-x-3">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-100 flex items-center justify-end gap-1">
                      {profile?.full_name || user.full_name}
                      <span className="inline-flex items-center text-amber-400 text-[11px] font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        {profile?.average_rating ? profile.average_rating.toFixed(1) : "5.0"}
                      </span>
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      {profile?.is_verified ? "Verified Partner" : "Pending KYC"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
                >
                  Driver Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800 space-x-1">
          {[
            { id: "OVERVIEW", label: "Dashboard" },
            { id: "PUBLISH", label: "Publish" },
            { id: "RIDES", label: "Rides" },
            { id: "FLEET", label: "Fleet" },
            { id: "KYC", label: "KYC" },
            { id: "EARNINGS", label: "Earnings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rides</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-black text-slate-900">{rides.filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED").length}</span>
                  <span className="ml-2 text-xs text-slate-500 font-medium">scheduled</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Passengers</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-black text-slate-900">
                    {rides.reduce((acc, r) => acc + (r.total_confirmed_passengers || 0), 0)}
                  </span>
                  <span className="ml-2 text-xs text-slate-500 font-medium">riders booked</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Trips</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-black text-slate-900">{profile?.total_completed_trips || 0}</span>
                  <span className="ml-2 text-xs text-emerald-600 font-medium">100% completed</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Payable</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-black text-slate-900">₹{earnings?.total_net_payout ? earnings.total_net_payout.toFixed(0) : "1,740"}</span>
                  <span className="ml-2 text-xs text-blue-600 font-semibold font-mono">Auto-Clear</span>
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                    Corridor Schedule
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Bidar ⇄ Hyderabad (NH 65)</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Ready for your next scheduled highway trip?</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish your departure in seconds. Fares are locked at ₹310/seat with guaranteed passenger manifests.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab("PUBLISH")}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish New Ride</span>
                </button>
                <button
                  onClick={() => setActiveTab("RIDES")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                >
                  View My Rides
                </button>
              </div>
            </div>

            {/* Next Scheduled Journey Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upcoming Journey Manifest</h3>
                    <p className="text-xs text-slate-500">Live manifest and passenger pickup status</p>
                  </div>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {rides.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-black text-slate-900">{rides[0].origin_city}</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      <span className="text-base font-black text-slate-900">{rides[0].destination_city}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {rides[0].status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Departure Time</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(rides[0].departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Pickup Landmark</span>
                        <span className="font-semibold text-slate-800 truncate block">{rides[0].pickup_point}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Confirmed Riders</span>
                        <span className="font-semibold text-blue-700">
                          {rides[0].total_confirmed_passengers} / {rides[0].available_seats + rides[0].total_confirmed_passengers} seats
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                    <button
                      onClick={() => handleOpenManifest(rides[0].ride_id)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>View Passenger Manifest</span>
                    </button>
                    <button
                      onClick={() => {
                        const next = rides[0].status === "SCHEDULED" ? "EN_ROUTE" : rides[0].status === "EN_ROUTE" ? "TRIP_STARTED" : "COMPLETED";
                        handleUpdateStatus(rides[0].ride_id, next);
                      }}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Advance Status: {rides[0].status}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No active rides currently scheduled. Click <strong>Publish New Ride</strong> above to start!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PUBLISH RIDE */}
        {activeTab === "PUBLISH" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
            <div className="pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Publish Corridor Ride</h2>
                  <p className="text-xs text-slate-500">Official NH 65 Corridor: Bidar ⇄ Hyderabad</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePublishRide} className="mt-6 space-y-5">
              {/* Route Origin & Destination with Swap button */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Corridor Route <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      readOnly
                      value={pubOrigin}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 text-center"
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleSwapRoute}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                      title="Swap Route Direction"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      readOnly
                      value={pubDestination}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Departure Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={pubTime}
                    onChange={(e) => setPubTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pickup & Drop Landmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exact Pickup Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Bus Stand, Bidar"
                    value={pubPickup}
                    onChange={(e) => setPubPickup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exact Drop Landmark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gachibowli DLF, Hyderabad"
                    value={pubDrop}
                    onChange={(e) => setPubDrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Selection & Available Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fleet Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pubVehicleId}
                    onChange={(e) => setPubVehicleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.make} {v.model} ({v.registration_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Offered Seats <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pubSeats}
                    onChange={(e) => setPubSeats(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "seat" : "seats"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invariant Pricing Notice Card */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-blue-900">Admin-Locked Corridor Fare: ₹310 per seat</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Per Bidar Connect Invariant Rules, all passenger fares are centrally fixed. Drivers do not set or surge prices.
                </p>
                <div className="pt-2 flex justify-between text-xs font-mono font-bold text-slate-800 border-t border-blue-100">
                  <span>Gross Fare Potential ({pubSeats} seats):</span>
                  <span>₹{pubSeats * 310}</span>
                </div>
              </div>

              {/* Driver Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trip Notes / Rules
                </label>
                <textarea
                  rows={2}
                  value={pubNotes}
                  onChange={(e) => setPubNotes(e.target.value)}
                  placeholder="e.g. AC on throughout, boot space for 2 bags, strictly no smoking."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={publishing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center space-x-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{publishing ? "Publishing Schedule..." : "Publish Corridor Ride"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MY RIDES & MANIFESTS */}
        {activeTab === "RIDES" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Published Rides & Passenger Manifests</h2>
                <p className="text-xs text-slate-500">Track journey lifecycles and view confirmed passenger lists</p>
              </div>
              <button
                onClick={() => setActiveTab("PUBLISH")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Ride</span>
              </button>
            </div>

            {rides.length > 0 ? (
              <div className="space-y-4">
                {rides.map((ride) => {
                  const isCompleted = ride.status === "COMPLETED";
                  return (
                    <div
                      key={ride.ride_id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-black text-slate-900">{ride.origin_city}</span>
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                          <span className="text-base font-black text-slate-900">{ride.destination_city}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {ride.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: <span className="font-semibold text-slate-800">{ride.ride_id}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Departure</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(ride.departure_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Vehicle</span>
                          <span className="font-semibold text-slate-800">
                            {ride.vehicle.make} {ride.vehicle.model} ({ride.vehicle.registration_number})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Seats Booked</span>
                          <span className="font-bold text-blue-700">
                            {ride.total_confirmed_passengers} / {ride.available_seats + ride.total_confirmed_passengers}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Gross Revenue</span>
                          <span className="font-bold font-mono text-slate-900">
                            ₹{(ride.total_confirmed_passengers * ride.fare_per_seat).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenManifest(ride.ride_id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>Passenger Manifest ({ride.total_confirmed_passengers})</span>
                          </button>
                        </div>

                        {/* Status Transition Stepper */}
                        {!isCompleted && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-500 font-medium">Update Status:</span>
                            {["SCHEDULED", "EN_ROUTE", "TRIP_STARTED", "COMPLETED"].map((st) => (
                              <button
                                key={st}
                                disabled={ride.status === st}
                                onClick={() => handleUpdateStatus(ride.ride_id, st)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                                  ride.status === st
                                    ? "bg-slate-900 text-white cursor-default"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No rides published yet. Click <strong>Publish New Ride</strong> to add your schedule!
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FLEET & VEHICLES */}
        {activeTab === "FLEET" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Fleet & Vehicles</h2>
                <p className="text-xs text-slate-500">Manage registered cars and commercial/RC compliance</p>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map((v) => (
                <div
                  key={v.vehicle_id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {v.make} {v.model}
                        </h3>
                        <p className="text-[11px] text-slate-400">{v.color} • {v.year}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Registration Number:</span>
                      <span className="font-mono font-bold text-slate-800">{v.registration_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fuel Type:</span>
                      <span className="font-semibold text-slate-800">{v.fuel_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Passenger Capacity:</span>
                      <span className="font-semibold text-slate-800">{v.passenger_capacity} passengers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: KYC & ONBOARDING */}
        {activeTab === "KYC" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Driving Licence & KYC Verification</h2>
                    <p className="text-xs text-slate-500">Government compliance for intercity corridor rides</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    profile?.is_verified
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {profile?.is_verified ? "Verified Partner" : "Pending Verification"}
                </span>
              </div>

              {profile?.is_verified ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your Driving Credentials are Verified</span>
                  </div>
                  <div className="text-xs text-emerald-900 space-y-1 font-medium">
                    <p>Licence Number: <strong className="font-mono">{profile.licence_number}</strong></p>
                    <p>Valid Until: <strong>{profile.licence_expiry}</strong></p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitKYC} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Driving Licence Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KA3820230009876"
                      value={kLicence}
                      onChange={(e) => setKLicence(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Licence Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={kExpiry}
                      onChange={(e) => setKExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={kSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{kSubmitting ? "Verifying Credentials..." : "Submit Licence for Verification"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: EARNINGS & PAYOUTS */}
        {activeTab === "EARNINGS" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Gross Fare</span>
                <span className="text-2xl font-black text-slate-900 mt-2 block">
                  ₹{earnings?.total_gross_earnings.toFixed(0) || "1,860"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">From confirmed corridor rides</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Platform Commission</span>
                <span className="text-2xl font-black text-slate-900 mt-2 block">
                  ₹{earnings?.total_platform_commission.toFixed(0) || "120"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Fixed ₹20/seat platform fee</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Payable to Driver</span>
                <span className="text-2xl font-black text-blue-600 mt-2 block">
                  ₹{earnings?.total_net_payout.toFixed(0) || "1,740"}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Cleared upon trip arrival</span>
              </div>
            </div>

            {/* Payout Configuration Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100 flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Payout Configuration</h3>
                  <p className="text-xs text-slate-500">Configure your UPI ID or Bank Account for automatic settlement</p>
                </div>
              </div>

              <form onSubmit={handleSavePayouts} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      UPI ID (Instant Transfer)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh@okaxis"
                      value={pUpi}
                      onChange={(e) => setPUpi(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50100234567890"
                      value={pBankAcc}
                      onChange={(e) => setPBankAcc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bank IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={pIfsc}
                      onChange={(e) => setPIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                  >
                    {pSubmitting ? "Saving..." : "Save Payout Settings"}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Settlements Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Settlement Batches</h3>
                <span className="text-xs text-slate-400">Automated Clearing House</span>
              </div>
              <div className="divide-y divide-slate-100">
                {(earnings?.recent_payouts || []).map((pay) => (
                  <div key={pay.payout_id} className="p-4 sm:px-6 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 font-mono block">{pay.payout_id}</span>
                      <span className="text-slate-400 text-[11px]">Ride: {pay.ride_id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block font-mono">₹{pay.net_amount.toFixed(0)}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          pay.status === "DISBURSED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PASSENGER MANIFEST MODAL */}
      {selectedRideForManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirmed Passenger Manifest</h3>
                  <p className="text-xs text-slate-400">
                    {selectedRideForManifest.origin_city} ⇄ {selectedRideForManifest.destination_city} • {selectedRideForManifest.booked_seats} / {selectedRideForManifest.total_offered_seats} Seats Booked
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRideForManifest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedRideForManifest.manifest.length > 0 ? (
                selectedRideForManifest.manifest.map((p) => (
                  <div
                    key={p.booking_id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{p.passenger_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                          {p.seats_booked} {p.seats_booked === 1 ? "seat" : "seats"}
                        </span>
                      </div>
                      <a
                        href={`tel:${p.passenger_phone}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Passenger</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Pickup Landmark:</span>
                        <span className="font-semibold text-slate-800">{p.pickup_point}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Drop Landmark:</span>
                        <span className="font-semibold text-slate-800">{p.drop_point}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">Ref: {p.reference_code}</span>
                      <span className="font-bold text-emerald-700">₹{p.fare_amount.toFixed(0)} ({p.payment_status})</span>
                    </div>

                    {p.emergency_contact && (
                      <div className="text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Emergency Contact: {p.emergency_contact.name} ({p.emergency_contact.phone})
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No confirmed passengers have booked this ride yet. Seats remain open for booking.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRideForManifest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER VEHICLE MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Vehicle to Fleet</h3>
                  <p className="text-xs text-slate-400">Verified Partner Fleet Registration</p>
                </div>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={vMake}
                    onChange={(e) => setVMake(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA 38 M 5678"
                  value={vReg}
                  onChange={(e) => setVReg(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Color</label>
                  <input
                    type="text"
                    required
                    placeholder="Silver"
                    value={vColor}
                    onChange={(e) => setVColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Year</label>
                  <input
                    type="number"
                    required
                    min={2005}
                    max={2030}
                    value={vYear}
                    onChange={(e) => setVYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Capacity</label>
                  <select
                    value={vCapacity}
                    onChange={(e) => setVCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {[3, 4, 5, 6, 7].map((c) => (
                      <option key={c} value={c}>{c} seats</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fuel Type</label>
                <select
                  value={vFuel}
                  onChange={(e) => setVFuel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="DIESEL">Diesel</option>
                  <option value="PETROL">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={vSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs text-xs flex items-center justify-center space-x-2"
              >
                <Car className="w-4 h-4" />
                <span>{vSubmitting ? "Registering Vehicle..." : "Save Vehicle to Fleet"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="LOGIN"
      />
    </div>
  );
}

