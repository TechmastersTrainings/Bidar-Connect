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

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return "http://127.0.0.1:8000/api/v1";
};

const getHostUrl = (port: number) => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
};

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
  const API_BASE = getApiBase();
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

  // Payout Request State
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [activePayoutModal, setActivePayoutModal] = useState<any | null>(null);
  const [safetyBufferSeconds, setSafetyBufferSeconds] = useState(0);

  // Safety Buffer Countdown Timer
  useEffect(() => {
    if (!activePayoutModal || safetyBufferSeconds <= 0) return;
    const interval = setInterval(() => {
      setSafetyBufferSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePayoutModal, safetyBufferSeconds]);

  // Periodic 4-second polling for live passenger manifest & ride status updates
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(async () => {
      fetchDashboardData();
      if (activePayoutModal && activePayoutModal.status !== "SETTLED") {
        try {
          const res = await fetch(`${API_BASE}/payouts/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await res.json();
          if (res.ok && d.success && Array.isArray(d.data)) {
            const currentReq = d.data.find((r: any) => r.ride_id === activePayoutModal.ride_id);
            if (currentReq) {
              setActivePayoutModal(currentReq);
              if (currentReq.status === "SETTLED") {
                setSafetyBufferSeconds(0);
              } else if (typeof currentReq.remaining_seconds === "number") {
                setSafetyBufferSeconds(currentReq.remaining_seconds);
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [token, activePayoutModal]);

  // Publish Form State - completely blank initial state, no default-typed values
  const [pubOrigin, setPubOrigin] = useState("Bidar");
  const [pubDestination, setPubDestination] = useState("Hyderabad");
  const [pubDate, setPubDate] = useState("");
  const [pubTime, setPubTime] = useState("");
  const [pubPickup, setPubPickup] = useState("");
  const [pubDrop, setPubDrop] = useState("");
  const [pubSeats, setPubSeats] = useState<number | "">("");
  const [pubVehicleId, setPubVehicleId] = useState("");
  const [pubVehicleMake, setPubVehicleMake] = useState("");
  const [pubVehicleModel, setPubVehicleModel] = useState("");
  const [pubVehicleReg, setPubVehicleReg] = useState("");
  const [pubVehicleFuel, setPubVehicleFuel] = useState("");
  const [pubNotes, setPubNotes] = useState("");
  const [publishing, setPublishing] = useState(false);

  // New Vehicle Form State - Clean blank state
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vReg, setVReg] = useState("");
  const [vColor, setVColor] = useState("");
  const [vYear, setVYear] = useState<number | "">("");
  const [vFuel, setVFuel] = useState("");
  const [vCapacity, setVCapacity] = useState<number | "">("");
  const [vSubmitting, setVSubmitting] = useState(false);

  // Payout Settings Form State
  const [pUpi, setPUpi] = useState("");
  const [pBankAcc, setPBankAcc] = useState("");
  const [pIfsc, setPIfsc] = useState("");
  const [pSubmitting, setPSubmitting] = useState(false);

  // KYC Form State
  const [kLicence, setKLicence] = useState("");
  const [kExpiry, setKExpiry] = useState("");
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
      try {
        const profRes = await fetch(`${API_BASE}/driver/profile`, { headers });
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.success && profData.data) {
            setProfile(profData.data);
            if (profData.data.payout_upi_id) setPUpi(profData.data.payout_upi_id);
            if (profData.data.payout_bank_account) setPBankAcc(profData.data.payout_bank_account);
            if (profData.data.payout_ifsc) setPIfsc(profData.data.payout_ifsc);
          }
        }
      } catch (e) {
        console.error("Profile load warning", e);
      }

      // 2. Vehicles
      try {
        const vehRes = await fetch(`${API_BASE}/driver/vehicles`, { headers });
        if (vehRes.ok) {
          const vehData = await vehRes.json();
          if (vehData.success && Array.isArray(vehData.data)) {
            setVehicles(vehData.data);
          }
        }
      } catch (e) {
        console.error("Vehicles load warning", e);
      }

      // 3. Rides
      try {
        const rideRes = await fetch(`${API_BASE}/driver/rides`, { headers });
        if (rideRes.ok) {
          const rideData = await rideRes.json();
          if (rideData.success && Array.isArray(rideData.data)) {
            setRides(rideData.data);
          }
        }
      } catch (e) {
        console.error("Rides load warning", e);
      }

      // 4. Earnings
      try {
        const earnRes = await fetch(`${API_BASE}/driver/earnings`, { headers });
        if (earnRes.ok) {
          const earnData = await earnRes.json();
          if (earnData.success && earnData.data) {
            setEarnings(earnData.data);
          }
        }
      } catch (e) {
        console.error("Earnings load warning", e);
      }
    } catch (e) {
      console.error("Failed to load driver dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "offer" || params.get("action") === "publish") {
        setActiveTab("PUBLISH");
        if (!token) {
          setIsAuthModalOpen(true);
        }
      }
    }
  }, [token]);

  // Handle Route flip
  const handleSwapRoute = () => {
    if (pubOrigin === "Bidar") {
      setPubOrigin("Hyderabad");
      setPubDestination("Bidar");
    } else {
      setPubOrigin("Bidar");
      setPubDestination("Hyderabad");
    }
  };

  // Publish Ride Handler
  const handlePublishRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!pubDate || !pubTime) {
      showToast("error", "Please select departure date and time.");
      return;
    }
    if (!pubPickup.trim() || !pubDrop.trim()) {
      showToast("error", "Please specify pickup and drop landmarks.");
      return;
    }
    if (!pubSeats || Number(pubSeats) < 1) {
      showToast("error", "Please select offered seats (1 to 6).");
      return;
    }
    if (!pubVehicleMake.trim() || !pubVehicleModel.trim()) {
      showToast("error", "Please type your car company and model.");
      return;
    }
    if (!pubVehicleReg.trim()) {
      showToast("error", "Please enter your vehicle registration number.");
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
          pickup_point: pubPickup.trim(),
          drop_point: pubDrop.trim(),
          available_seats: Number(pubSeats),
          vehicle_id: pubVehicleId || null,
          vehicle_make: pubVehicleMake.trim(),
          vehicle_model: pubVehicleModel.trim(),
          vehicle_reg: pubVehicleReg.trim().toUpperCase(),
          vehicle_fuel: pubVehicleFuel || "PETROL",
          driver_notes: pubNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Ride published successfully with locked ₹310 corridor fare!");
        setPubDate("");
        setPubTime("");
        setPubPickup("");
        setPubDrop("");
        setPubSeats("");
        setPubVehicleId("");
        setPubVehicleMake("");
        setPubVehicleModel("");
        setPubVehicleReg("");
        setPubVehicleFuel("");
        setPubNotes("");
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

  // Verify Passenger Boarding with 4-Digit Code
  const handleVerifyBoarding = async (rideId: string, bookingId: string, refCode: string) => {
    if (!token) return;
    const digits = refCode.replace(/[^0-9]/g, "").slice(-4) || "8421";
    const entered = window.prompt("Enter passenger 4-digit boarding code (displayed on their digital pass):", digits);
    if (!entered) return;

    try {
      const res = await fetch(`${API_BASE}/driver/rides/${rideId}/manifest/${bookingId}/verify-boarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boarding_code: entered.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Passenger verified and marked as boarded!");
        if (selectedRideForManifest) {
          const updated = selectedRideForManifest.manifest.map((item) =>
            item.booking_id === bookingId ? { ...item, booking_status: "BOARDED" } : item
          );
          setSelectedRideForManifest({ ...selectedRideForManifest, manifest: updated });
        }
      } else {
        showToast("error", data.error?.message || "Invalid boarding code. Please verify.");
      }
    } catch (err: any) {
      showToast("error", "Network error verifying boarding");
    }
  };

  // Request & Disburse Payout
  const handleRequestPayout = async (rideId: string, forceOverride: boolean = false) => {
    if (!token) return;
    setPayoutLoading(true);
    try {
      if (forceOverride) {
        const disburseRes = await fetch(`${API_BASE}/payouts/rides/${rideId}/disburse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ force_override_buffer: true }),
        });
        const disburseData = await disburseRes.json();
        if (disburseRes.ok && disburseData.success) {
          const resObj = disburseData.data;
          showToast("success", `Payout of INR ${resObj.net_payable || resObj.net_amount} settled via IMPS! UTR #${resObj.payout_reference_utr || resObj.bank_utr}`);
          setActivePayoutModal({
            ...resObj,
            status: "SETTLED",
            payout_reference_utr: resObj.payout_reference_utr || resObj.bank_utr,
          });
          setSafetyBufferSeconds(0);
          fetchDashboardData();
        } else {
          showToast("error", disburseData.error?.message || "Failed to disburse payout");
        }
        return;
      }

      // Step 2: Driver submits formal payout request for completed ride
      const reqRes = await fetch(`${API_BASE}/payouts/rides/${rideId}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const reqData = await reqRes.json();
      if (reqRes.ok && reqData.success) {
        const pData = reqData.data;
        showToast("success", "Payout requested! Enqueued for Admin review & 5-minute automated bank clearing.");
        setActivePayoutModal(pData);
        setSafetyBufferSeconds(pData.remaining_seconds || 300);
        fetchDashboardData();
      } else {
        // Fallback to eligibility check
        const eligRes = await fetch(`${API_BASE}/payouts/rides/${rideId}/eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eligData = await eligRes.json();
        if (eligRes.ok && eligData.success) {
          const info = eligData.data;
          setSafetyBufferSeconds(info.buffer_remaining_seconds || 300);
          setActivePayoutModal(info);
        } else {
          showToast("error", reqData.error?.message || eligData.error?.message || "Payout request failed");
        }
      }
    } catch (err: any) {
      showToast("error", "Network error processing payout settlement");
    } finally {
      setPayoutLoading(false);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
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

      {/* Header - White-Glass Public Website Aesthetic with 2-Tier Non-Overflowing Layout */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tier 1: Brand Logo, Ecosystem Switcher & Driver Profile */}
          <div className="flex items-center justify-between h-16 py-2.5 gap-3 border-b border-slate-100">
            {/* Brand Logo & Highway Corridor Status */}
            <div className="flex items-center gap-3 shrink-0">
              <a href={getHostUrl(3000)} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-200">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                    Bidar Connect
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase leading-none whitespace-nowrap">
                      NH 65 Corridor
                    </span>
                  </div>
                </div>
              </a>
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                Driver Portal
              </span>
            </div>

            {/* Quick Actions & Auth */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Cross Portal Link to Passenger Portal */}
              <a
                href={
                  token && user
                    ? `${getHostUrl(3001)}?auth_token=${encodeURIComponent(token)}&auth_user=${encodeURIComponent(JSON.stringify(user))}`
                    : getHostUrl(3001)
                }
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-slate-200 shadow-xs cursor-pointer"
                title="Open Passenger Booking Portal"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Passenger Portal</span>
                <span className="sm:hidden">Passenger</span>
              </a>

              <a
                href={getHostUrl(3000)}
                className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
                title="Go to Public Website"
              >
                <span>Home</span>
              </a>

              {/* Auth / Profile Area */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                      {profile?.full_name || user.full_name}
                      <span className="inline-flex items-center text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 text-[10px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                        {profile?.average_rating ? profile.average_rating.toFixed(1) : "5.0"}
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold leading-tight">
                      Verified Partner
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white transition-all font-semibold shadow-xs cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Driver Sign In
                </button>
              )}
            </div>
          </div>

          {/* Tier 2: Floating Pill Bar Navigation for Driver Features */}
          <div className="py-2.5 flex items-center justify-center overflow-x-auto">
            <nav className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-inner backdrop-blur-sm shrink-0 max-w-full">
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
                    className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold rounded-full px-3 py-1.5 transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200/60"
                        : "text-slate-700 hover:text-blue-600 hover:bg-white/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
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
                  <span className="text-2xl font-black text-slate-900">₹{earnings?.total_net_payout != null ? earnings.total_net_payout.toFixed(0) : "0"}</span>
                  <span className="ml-2 text-xs text-blue-600 font-semibold font-mono">Auto-Clear</span>
                </div>
              </div>
            </div>

            {/* Quick Action Banner - Vibrant Corridor Gradient */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 text-white shadow-md shadow-blue-900/10 border border-blue-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
                    Corridor Schedule
                  </span>
                  <span className="text-xs text-blue-100 font-medium">Bidar ⇄ Hyderabad (NH 65)</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Ready for your next scheduled highway trip?</h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  Publish your departure in seconds. Fares are locked at ₹310/seat with guaranteed passenger manifests.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab("PUBLISH")}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Publish New Ride</span>
                </button>
                <button
                  onClick={() => setActiveTab("RIDES")}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
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
                    {rides[0].status === "SCHEDULED" && (
                      <button
                        onClick={() => handleUpdateStatus(rides[0].ride_id, "EN_ROUTE")}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
                      >
                        <Car className="w-4 h-4 text-white" />
                        <span>Start Driving (En Route to Pickup)</span>
                      </button>
                    )}
                    {rides[0].status === "EN_ROUTE" && (
                      <button
                        onClick={() => handleUpdateStatus(rides[0].ride_id, "TRIP_STARTED")}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>All Passengers Boarded (Start Trip)</span>
                      </button>
                    )}
                    {rides[0].status === "TRIP_STARTED" && (
                      <button
                        onClick={() => handleUpdateStatus(rides[0].ride_id, "COMPLETED")}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Trip Ended (Complete Journey)</span>
                      </button>
                    )}
                    {rides[0].status === "COMPLETED" && (
                      <button
                        onClick={() => handleRequestPayout(rides[0].ride_id)}
                        disabled={payoutLoading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
                      >
                        <Wallet className="w-4 h-4 text-white" />
                        <span>{payoutLoading ? "Processing Escrow..." : "Trip Ended - Request Payout"}</span>
                      </button>
                    )}
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
        {activeTab === "PUBLISH" && !isAuthenticated ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
              <Car className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Driver Authentication Required to Offer Seats
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                To offer and publish empty seats on the Bidar ⇄ Hyderabad corridor, you must be logged in with a registered driver account, verified driving licence, and active email.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register as Driver (Enter Email & Licence)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Existing Account</span>
              </button>
            </div>
          </div>
        ) : activeTab === "PUBLISH" && (
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

              {/* Vehicle Details: Directly Type Car Company, Model & Number */}
              <div className="space-y-4">
                {vehicles.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Or Autofill from Saved Fleet
                    </label>
                    <select
                      value={pubVehicleId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setPubVehicleId(selId);
                        const found = vehicles.find((v) => v.vehicle_id === selId);
                        if (found) {
                          setPubVehicleMake(found.make);
                          setPubVehicleModel(found.model);
                          setPubVehicleReg(found.registration_number);
                          setPubVehicleFuel(found.fuel_type);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Type new car details below or pick saved vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.make} {v.model} ({v.registration_number})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Car Company / Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyundai, Maruti Suzuki, Tata"
                      value={pubVehicleMake}
                      onChange={(e) => setPubVehicleMake(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Car Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Creta, Ertiga, Swift, Nexon"
                      value={pubVehicleModel}
                      onChange={(e) => setPubVehicleModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vehicle Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KA 38 M 5678"
                      value={pubVehicleReg}
                      onChange={(e) => setPubVehicleReg(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fuel Type
                    </label>
                    <select
                      value={pubVehicleFuel}
                      onChange={(e) => setPubVehicleFuel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Offered Seats <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={pubSeats}
                      onChange={(e) => setPubSeats(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Offered Seats</option>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "seat" : "seats"}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  <span>Gross Fare Potential ({pubSeats || 0} seats):</span>
                  <span>₹{(Number(pubSeats) || 0) * 310}</span>
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
                        {!isCompleted ? (
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
                        ) : (
                          <button
                            onClick={() => handleRequestPayout(ride.ride_id)}
                            disabled={payoutLoading}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
                          >
                            <Wallet className="w-3.5 h-3.5 text-white" />
                            <span>Request Payout Settlement</span>
                          </button>
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
                  ₹{earnings?.total_gross_earnings != null ? earnings.total_gross_earnings.toFixed(0) : "0"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">From confirmed corridor rides</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Platform Commission</span>
                <span className="text-2xl font-black text-slate-900 mt-2 block">
                  ₹{earnings?.total_platform_commission != null ? earnings.total_platform_commission.toFixed(0) : "0"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Fixed ₹20/seat platform fee</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Payable to Driver</span>
                <span className="text-2xl font-black text-blue-600 mt-2 block">
                  ₹{earnings?.total_net_payout != null ? earnings.total_net_payout.toFixed(0) : "0"}
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
                      <div className="flex items-center gap-2">
                        {p.booking_status === "BOARDED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Boarded & Verified</span>
                          </span>
                        ) : p.booking_status !== "CANCELLED" ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyBoarding(selectedRideForManifest.ride_id, p.booking_id, p.reference_code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs"
                            title="Verify passenger 4-digit code and mark boarded"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify Boarding</span>
                          </button>
                        ) : null}
                        <span className="font-bold text-emerald-700">₹{p.fare_amount.toFixed(0)} ({p.payment_status})</span>
                      </div>
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

      {/* PAYOUT SETTLEMENT & ESCROW CLEARING MODAL */}
      {activePayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Trip Payout & Bank Settlement</h3>
                  <p className="text-xs text-slate-400">NH 65 Motor Vehicles Act Non-Commercial Clearing</p>
                </div>
              </div>
              <button
                onClick={() => setActivePayoutModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Financial Split Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Passenger Fares ({activePayoutModal.total_seats_booked || 3} seats @ ₹310):</span>
                  <span className="font-semibold text-slate-900">₹{activePayoutModal.gross_amount || 930}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Operations Fee (₹20/seat):</span>
                  <span className="font-semibold text-red-600">-₹{activePayoutModal.commission_deducted || 60}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Net Driver Settlement:</span>
                  <span className="text-emerald-700 text-base">₹{activePayoutModal.net_payable || 870}</span>
                </div>
              </div>

              {/* Status Display: Either settled with Bank UTR or Safety Delay Countdown */}
              {(activePayoutModal.status === "SETTLED" || activePayoutModal.settled_payout || activePayoutModal.payout_reference_utr) ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-900 text-sm">Settlement Disbursed Successfully!</h4>
                  <p className="text-emerald-800 text-[11px]">
                    Net earnings of <strong>INR {activePayoutModal.net_payable || activePayoutModal.settled_payout?.net_amount || 870}</strong> transferred via IMPS.
                  </p>
                  <div className="bg-white p-2 rounded-lg border border-emerald-300 font-mono text-[11px] text-emerald-900">
                    Bank UTR: <strong>{activePayoutModal.payout_reference_utr || activePayoutModal.settled_payout?.bank_utr || "UTR-20261104-9842"}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Credited to HDFC Bank A/C ****4120 &bull; Statutory 5-Min Clearing Confirmed
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Transfer Destination
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      HDFC Bank Ltd &bull; A/C: XXXX-XXXX-4120 (IFSC: HDFC0001234)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      UPI ID: {activePayoutModal.upi_id || "drv_101@okaxis"}
                    </p>
                  </div>

                  {safetyBufferSeconds > 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Admin Audit & Automated 5-Minute Clearing
                      </span>
                      <div className="text-2xl font-black font-mono text-amber-900">
                        {Math.floor(safetyBufferSeconds / 60).toString().padStart(2, "0")}:
                        {(safetyBufferSeconds % 60).toString().padStart(2, "0")}
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Payment request queued. Admin is reviewing passenger manifest. Automation engine will transfer funds directly to your bank account within 5 minutes or immediately upon Admin approval.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] text-center">
                      5-minute window complete. Processing instant bank clearing...
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRequestPayout(activePayoutModal.ride_id, true)}
                      disabled={payoutLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{payoutLoading ? "Disbursing IMPS..." : "Disburse Immediate Settlement (Admin Bypass)"}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActivePayoutModal(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Close Window
                </button>
              </div>
            </div>
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

