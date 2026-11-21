"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import {
  AdminMetricsData,
  AdminUserItem,
  DriverKYCQueueItem,
  AuditLogItem,
  LedgerEntryData,
  FinancialSummaryData,
  SOSAlertData,
  DispatchLogItem,
} from "@bidar/shared-types";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Car,
  FileCheck,
  Sliders,
  Clock,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  LogIn,
  IndianRupee,
  MapPin,
  TrendingUp,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  ArrowRight,
  Radio,
  FileText,
  Shield,
  Layers,
  Lock,
  Wallet,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Send,
  LifeBuoy,
  RadioTower,
  Megaphone,
  PhoneCall,
  QrCode,
  Upload,
  Copy,
} from "lucide-react";

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return "http://127.0.0.1:8000/api/v1";
};

type ActiveTab = "metrics" | "kyc" | "payouts" | "users" | "pricing" | "qr" | "audit" | "ledger" | "dispatches";

export default function AdminPortalPage() {
  const API_BASE = getApiBase();
  const { user, token, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("metrics");

  // State Containers
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [kycQueue, setKycQueue] = useState<DriverKYCQueueItem[]>([]);
  const [kycFilter, setKycFilter] = useState<"ALL" | "PENDING" | "VERIFIED">("ALL");
  const [kycLoading, setKycLoading] = useState(false);

  // Driver Settlement & 5-Min Clearing Queue
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutActionLoading, setPayoutActionLoading] = useState<string | null>(null);

  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [usersLoading, setUsersLoading] = useState(false);

  const [pricingData, setPricingData] = useState<{ routes: any[]; commission_rule: any } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryData[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinancialSummaryData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Phase 11: Dispatches & SOS State
  const [sosAlerts, setSosAlerts] = useState<SOSAlertData[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogItem[]>([]);
  const [dispatchesLoading, setDispatchesLoading] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastChannels, setBroadcastChannels] = useState<string[]>(["PUSH", "SMS"]);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Platform Collection QR Configuration State
  const [adminQrConfig, setAdminQrConfig] = useState<{
    upi_id: string;
    payee_name: string;
    business_name: string;
    qr_image_url: string;
    qr_image_data: string | null;
    instructions: string;
    updated_at?: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);
  const [editUpiId, setEditUpiId] = useState("");
  const [editPayeeName, setEditPayeeName] = useState("");
  const [editBusinessName, setEditBusinessName] = useState("Bidar Connect");
  const [editInstructions, setEditInstructions] = useState("");
  const [uploadedQrPreview, setUploadedQrPreview] = useState<string | null>(null);
  const [qrCopied, setQrCopied] = useState(false);

  const [resolvingSosAlert, setResolvingSosAlert] = useState<SOSAlertData | null>(null);
  const [sosResolutionNotes, setSosResolutionNotes] = useState("");
  const [submittingSosResolution, setSubmittingSosResolution] = useState(false);

  // Action Modals State
  const [reviewItem, setReviewItem] = useState<DriverKYCQueueItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [suspendTargetUser, setSuspendTargetUser] = useState<AdminUserItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [submittingSuspend, setSubmittingSuspend] = useState(false);

  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [newRoutePrice, setNewRoutePrice] = useState<number>(310);
  const [submittingPrice, setSubmittingPrice] = useState(false);

  const [editingCommission, setEditingCommission] = useState(false);
  const [newCommissionFee, setNewCommissionFee] = useState<number>(20);
  const [submittingCommission, setSubmittingCommission] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    if (!token) return;
    setMetricsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch admin metrics", e);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fetch KYC Queue
  const fetchKycQueue = async (filter = kycFilter) => {
    if (!token) return;
    setKycLoading(true);
    try {
      const url = filter === "ALL" ? `${API_BASE}/admin/kyc-queue` : `${API_BASE}/admin/kyc-queue?status=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKycQueue(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch KYC queue", e);
    } finally {
      setKycLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append("q", userSearch.trim());
      if (userRoleFilter !== "ALL") params.append("role", userRoleFilter);
      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch users directory", e);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Pricing
  const fetchPricing = async () => {
    if (!token) return;
    setPricingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPricingData(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch corridor pricing", e);
    } finally {
      setPricingLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditLogs(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Financial Ledger & Escrow Summary
  const fetchLedger = async () => {
    if (!token) return;
    setLedgerLoading(true);
    try {
      const [sumRes, ledRes] = await Promise.all([
        fetch(`${API_BASE}/payments/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/payments/ledger`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sumData = await sumRes.json();
      const ledData = await ledRes.json();
      if (sumRes.ok && sumData.success) {
        setFinanceSummary(sumData.data);
      }
      if (ledRes.ok && ledData.success) {
        setLedgerEntries(ledData.data);
      }
    } catch (e) {
      console.error("Failed to fetch financial ledger", e);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Fetch Dispatches & Highway SOS Alerts
  const fetchDispatches = async () => {
    if (!token) return;
    setDispatchesLoading(true);
    try {
      const [sosRes, dispRes] = await Promise.all([
        fetch(`${API_BASE}/notifications/sos/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/notifications/dispatches`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sosData = await sosRes.json();
      const dispData = await dispRes.json();
      if (sosRes.ok && sosData.success) {
        setSosAlerts(sosData.data);
      }
      if (dispRes.ok && dispData.success) {
        setDispatchLogs(dispData.data);
      }
    } catch (e) {
      console.error("Failed to fetch notification dispatches & SOS alerts", e);
    } finally {
      setDispatchesLoading(false);
    }
  };

  const fetchPayoutRequests = async () => {
    if (!token) return;
    setPayoutLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payouts/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setPayoutRequests(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch payout requests", e);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleApprovePayout = async (rideId: string) => {
    if (!token) return;
    setPayoutActionLoading(rideId);
    try {
      const res = await fetch(`${API_BASE}/payouts/requests/${rideId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Payout approved! Settled via IMPS. Bank UTR: ${data.data.payout_reference_utr}`);
        fetchPayoutRequests();
      } else {
        showToast("error", data.error?.message || "Failed to approve payout");
      }
    } catch (err: any) {
      showToast("error", "Network error approving payout");
    } finally {
      setPayoutActionLoading(null);
    }
  };

  const handleHoldPayout = async (rideId: string, reason?: string) => {
    if (!token) return;
    setPayoutActionLoading(rideId);
    try {
      const res = await fetch(`${API_BASE}/payouts/requests/${rideId}/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason || "Passenger Dispute / Audit Required" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Payout placed on hold. Automated transfer halted.");
        fetchPayoutRequests();
      } else {
        showToast("error", data.error?.message || "Failed to hold payout");
      }
    } catch (err: any) {
      showToast("error", "Network error holding payout");
    } finally {
      setPayoutActionLoading(null);
    }
  };

  // Load Platform Collection QR Configuration
  const fetchQrConfig = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/payment-qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAdminQrConfig(data.data);
          setEditUpiId(data.data.upi_id || "");
          setEditPayeeName(data.data.payee_name || "");
          setEditBusinessName(data.data.business_name || "Bidar Connect");
          setEditInstructions(data.data.instructions || "");
          setUploadedQrPreview(data.data.qr_image_data || null);
        }
      }
    } catch (e) {
      console.error("Failed to load platform QR", e);
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveQrConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!editUpiId.trim() || !editPayeeName.trim()) {
      showToast("error", "UPI ID and Payee Name are required.");
      return;
    }
    setQrSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/payment-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          upi_id: editUpiId.trim(),
          payee_name: editPayeeName.trim(),
          business_name: editBusinessName.trim() || "Bidar Connect",
          qr_image_data: uploadedQrPreview || null,
          instructions: editInstructions.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminQrConfig(data.data);
        showToast("success", "Platform Collection QR updated! Passenger checkout will now display this QR.");
      } else {
        showToast("error", data.error?.message || "Failed to update platform QR.");
      }
    } catch (err: any) {
      showToast("error", "Network error updating platform QR");
    } finally {
      setQrSaving(false);
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "QR image must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedQrPreview(base64);
      showToast("success", "Custom QR image loaded. Click Save & Publish to activate.");
    };
    reader.readAsDataURL(file);
  };

  // Trigger loads on tab changes or auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
      fetchDispatches(); // Load SOS alerts on initial auth for notification badge
      fetchPayoutRequests(); // Load payout requests for notification badge
      if (activeTab === "kyc") fetchKycQueue();
      if (activeTab === "payouts") fetchPayoutRequests();
      if (activeTab === "users") fetchUsers();
      if (activeTab === "pricing") fetchPricing();
      if (activeTab === "qr") fetchQrConfig();
      if (activeTab === "audit") fetchAuditLogs();
      if (activeTab === "ledger") fetchLedger();
      if (activeTab === "dispatches") fetchDispatches();
    }
  }, [isAuthenticated, activeTab]);

  // Periodic polling for live payout timer countdown & automated status transitions
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const interval = setInterval(() => {
      if (activeTab === "payouts" || activeTab === "metrics") {
        fetchPayoutRequests();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, activeTab]);

  // Execute KYC Decision
  const handleReviewKyc = async () => {
    if (!reviewItem || !token) return;
    if (reviewAction === "REJECT" && !reviewReason.trim()) {
      showToast("error", "Rejection requires mandatory administrative feedback note.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/admin/kyc-queue/${reviewItem.driver_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: reviewAction,
          feedback_reason: reviewReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Driver KYC status updated to ${reviewAction === "APPROVE" ? "VERIFIED" : "REJECTED"}.`);
        setReviewItem(null);
        setReviewReason("");
        fetchKycQueue();
        fetchMetrics();
      } else {
        showToast("error", data.error?.message || "Failed to process review.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error processing KYC review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Execute User Suspension / Unsuspension
  const handleToggleSuspendUser = async () => {
    if (!suspendTargetUser || !token) return;

    if (!suspendTargetUser.is_suspended && !suspendReason.trim()) {
      showToast("error", "Reason is required to suspend user account.");
      return;
    }

    setSubmittingSuspend(true);
    try {
      const endpoint = suspendTargetUser.is_suspended
        ? `${API_BASE}/admin/users/${suspendTargetUser.user_id}/unsuspend`
        : `${API_BASE}/admin/users/${suspendTargetUser.user_id}/suspend`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: suspendTargetUser.is_suspended ? undefined : JSON.stringify({ reason: suspendReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          "success",
          `User account ${suspendTargetUser.is_suspended ? "reinstated" : "suspended"} successfully.`
        );
        setSuspendTargetUser(null);
        setSuspendReason("");
        fetchUsers();
        fetchMetrics();
      } else {
        showToast("error", data.error?.message || "Governance action failed.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error executing user governance.");
    } finally {
      setSubmittingSuspend(false);
    }
  };

  // Execute Route Base Price Update
  const handleUpdateRoutePrice = async () => {
    if (!editingRoute || !token) return;
    setSubmittingPrice(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pricing/${editingRoute.route_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fare_per_seat: Number(newRoutePrice) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Corridor base fare updated to Rs. ${newRoutePrice}/seat.`);
        setEditingRoute(null);
        fetchPricing();
        fetchMetrics();
      } else {
        showToast("error", data.error?.message || "Failed to update route price.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error updating corridor fare.");
    } finally {
      setSubmittingPrice(false);
    }
  };

  // Execute Commission Update
  const handleUpdateCommission = async () => {
    if (!token) return;
    setSubmittingCommission(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pricing/commission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fixed_fee_per_seat: Number(newCommissionFee),
          description: `Corridor NH 65 fixed fee set to Rs. ${newCommissionFee} per confirmed seat.`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Platform commission policy updated to Rs. ${newCommissionFee}/seat.`);
        setEditingCommission(false);
        fetchPricing();
        fetchMetrics();
      } else {
        showToast("error", data.error?.message || "Failed to update commission.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error updating commission rule.");
    } finally {
      setSubmittingCommission(false);
    }
  };

  // Phase 11: Acknowledge SOS Alert
  const handleAcknowledgeSos = async (alertId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/sos/${alertId}/acknowledge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Emergency incident acknowledged. Safety protocols active.");
        fetchDispatches();
      } else {
        showToast("error", data.error?.message || "Failed to acknowledge incident.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error acknowledging SOS alert.");
    }
  };

  // Phase 11: Resolve SOS Alert
  const handleResolveSos = async () => {
    if (!resolvingSosAlert || !token) return;
    if (!sosResolutionNotes.trim()) {
      showToast("error", "Resolution notes are required to resolve incident.");
      return;
    }
    setSubmittingSosResolution(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/sos/${resolvingSosAlert.alert_id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolution_notes: sosResolutionNotes.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Emergency SOS incident resolved and logged.");
        setResolvingSosAlert(null);
        setSosResolutionNotes("");
        fetchDispatches();
      } else {
        showToast("error", data.error?.message || "Failed to resolve incident.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error resolving SOS alert.");
    } finally {
      setSubmittingSosResolution(false);
    }
  };

  // Phase 11: Send Broadcast Advisory
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast("error", "Title and message are required for corridor broadcast.");
      return;
    }
    setSubmittingBroadcast(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          channels: broadcastChannels,
          target_audience: "ALL",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Corridor broadcast dispatched across selected channels.");
        setBroadcastTitle("");
        setBroadcastMessage("");
        fetchDispatches();
      } else {
        showToast("error", data.error?.message || "Failed to dispatch broadcast.");
      }
    } catch (e: any) {
      showToast("error", e.message || "Network error dispatching broadcast.");
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const activeSosCount = sosAlerts.filter((a) => a.status === "ACTIVE_EMERGENCY").length;
  const pendingPayoutsCount = payoutRequests.filter((r) => r.status === "PENDING_AUDIT").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm transition-all animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar - Matching Public Website White-Glass Aesthetic */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] text-slate-900 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <a href="http://localhost:3000" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
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
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Live Highway SOS Indicator */}
            {activeSosCount > 0 ? (
              <button
                onClick={() => setActiveTab("dispatches")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold animate-pulse cursor-pointer shadow-xs"
              >
                <LifeBuoy className="w-4 h-4 text-red-600" />
                <span>{activeSosCount} Highway SOS Active</span>
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-600 font-medium">NH 65: Active & Monitored</span>
              </div>
            )}

            {/* Cross Portal Links */}
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-slate-200 shadow-xs"
              title="Open Passenger Portal"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Passenger</span>
            </a>

            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-slate-200 shadow-xs"
              title="Open Driver Portal"
            >
              <Car className="w-3.5 h-3.5 text-blue-600" />
              <span>Driver</span>
            </a>

            <a
              href="http://localhost:3000"
              className="whitespace-nowrap hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
              title="Go to Public Website"
            >
              <span>Home</span>
            </a>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{user?.full_name}</div>
                  <div className="text-[10px] text-blue-600 font-mono">{user?.phone}</div>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl border border-slate-200 bg-white transition-all shadow-xs cursor-pointer"
                  title="Logout Administrator Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        {isAuthenticated && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-slate-50/60 py-1.5 flex overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Executive Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab("kyc")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "kyc"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Driver KYC Queue</span>
              {metrics?.pending_kyc_approvals ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {metrics.pending_kyc_approvals}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "payouts"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Driver Settlements (5-Min Auto)</span>
              {pendingPayoutsCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {pendingPayoutsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>User Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "pricing"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Route Pricing</span>
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "qr"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Platform Payment QR</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "audit"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Trail</span>
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span>Financial Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("dispatches")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === "dispatches"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 text-red-600" />
              <span>Highway SOS</span>
              {activeSosCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {activeSosCount}
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-800">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Restricted Administrator Console</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Authentication required. Platform administrative permissions are mandatory to view corridor metrics, conduct driver KYC verification, and govern platform policies.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Authenticate Operations Session</span>
            </button>
          </div>
        ) : (
          <div>
            {/* TAB 1: EXECUTIVE METRICS */}
            {activeTab === "metrics" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-sm text-slate-500">Live health, gross values, and operational KPI telemetry.</p>
                  </div>
                  <button
                    onClick={fetchMetrics}
                    disabled={metricsLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-sm transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Metrics</span>
                  </button>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Gross Booking Value</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      Rs. {metrics?.gross_booking_value != null ? metrics.gross_booking_value.toLocaleString("en-IN") : "0"}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>NH 65 Corridor Ticket Sales</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Platform Net Take</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      Rs. {metrics?.net_platform_commission != null ? metrics.net_platform_commission.toLocaleString("en-IN") : "0"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Fixed platform rate: Rs. 20 / seat
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Active Published Rides</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Car className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      {metrics?.active_published_rides ?? 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Confirmed Seats: <span className="font-semibold text-slate-800">{metrics?.confirmed_passenger_seats ?? 0}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Platform Identities</span>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      {metrics?.total_registered_users ?? 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                      <span className="text-blue-600 font-semibold">{metrics?.verified_drivers_count ?? 0} Drivers</span>
                      <span>•</span>
                      <span className="text-amber-600 font-semibold">{metrics?.pending_kyc_approvals ?? 0} Pending KYC</span>
                    </div>
                  </div>
                </div>

                {/* Corridor Operational Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Corridor Topology: Bidar (Karnataka) ⇄ Hyderabad (Telangana)</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Corridor Distance & Route
                      </div>
                      <div className="text-base font-bold text-slate-800">138 km via NH 65</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Standard travel time: ~3.0 - 3.5 hrs via Zahirabad & Sangareddy.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Fixed Tariff Benchmark
                      </div>
                      <div className="text-base font-bold text-slate-800">Rs. 310 / Seat</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Predictable flat pricing prevents surge exploitation and price gouging.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Safety & Compliance Standard
                      </div>
                      <div className="text-base font-bold text-emerald-700">100% KYC Mandatory</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Zero unverified drivers permitted to publish rides on highway corridors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DRIVER KYC REVIEW QUEUE */}
            {activeTab === "kyc" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver KYC Review Queue</h1>
                    <p className="text-sm text-slate-500">
                      Inspect driving licences, document records, and manage corridor verification.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
                      {(["ALL", "PENDING", "VERIFIED"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setKycFilter(filter);
                            fetchKycQueue(filter);
                          }}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${
                            kycFilter === filter ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchKycQueue()}
                      disabled={kycLoading}
                      className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-slate-700"
                    >
                      <RefreshCw className={`w-4 h-4 ${kycLoading ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {kycQueue.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-slate-800">Queue is clear</p>
                    <p className="text-xs text-slate-500 mt-1">No driver KYC applications match current filter.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3.5 px-4">Driver Profile</th>
                            <th className="py-3.5 px-4">Licence Number</th>
                            <th className="py-3.5 px-4">Document Proof</th>
                            <th className="py-3.5 px-4">Expiry Date</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {kycQueue.map((item) => (
                            <tr key={item.driver_id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-900">{item.driver_name}</div>
                                <div className="text-xs text-slate-500 font-mono">{item.phone}</div>
                              </td>
                              <td className="py-4 px-4 font-mono font-medium text-slate-800">
                                {item.licence_number}
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono">
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{item.licence_document_id || "doc_uploaded"}</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 text-xs font-mono text-slate-600">
                                {item.licence_expiry}
                              </td>
                              <td className="py-4 px-4">
                                {item.is_verified ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Pending Review</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!item.is_verified && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setReviewItem(item);
                                          setReviewAction("APPROVE");
                                          setReviewReason("");
                                        }}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReviewItem(item);
                                          setReviewAction("REJECT");
                                          setReviewReason("");
                                        }}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {item.is_verified && (
                                    <button
                                      onClick={() => {
                                        setReviewItem(item);
                                        setReviewAction("REJECT");
                                        setReviewReason("Document revoked during administrative re-inspection.");
                                      }}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: DRIVER SETTLEMENTS & 5-MIN AUTOMATED CLEARING */}
            {activeTab === "payouts" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Driver Settlements & 5-Min Automated Clearing
                    </h1>
                    <p className="text-sm text-slate-500">
                      Motor Vehicles Act Non-Commercial Ride Payouts. Admin audits driver KYC and passenger manifest. 5-Minute automated clearance engine releases funds via IMPS.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchPayoutRequests}
                      disabled={payoutLoading}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${payoutLoading ? "animate-spin text-blue-600" : ""}`} />
                      <span>Refresh Queue</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/payouts/process-automation`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          const d = await res.json();
                          showToast("success", d.data?.message || "Processed automated clearing batch.");
                          fetchPayoutRequests();
                        } catch (e) {
                          showToast("error", "Error triggering automation");
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-semibold cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Trigger Auto Clearing Batch</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review Queue</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{pendingPayoutsCount}</div>
                    <span className="text-[11px] text-slate-500">Awaiting 5-min auto clearing</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Settled Transfers</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {payoutRequests.filter(r => r.status === "SETTLED").length}
                    </div>
                    <span className="text-[11px] text-slate-500">Credited via IMPS / Bank UTR</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Statutory Hold Window</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">5 Minutes</div>
                    <span className="text-[11px] text-slate-500">Passenger dispute protection</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Fixed Corridor Split</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">INR 290 / 20</div>
                    <span className="text-[11px] text-slate-500">Driver: INR 290 | Platform: INR 20</span>
                  </div>
                </div>

                {/* Pending Payout Requests List */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Active Payout Requests (5-Minute Clearing Window)</h2>
                      <p className="text-xs text-slate-500">Inspect driver KYC and passenger manifest before funds disburse to bank.</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                      {pendingPayoutsCount} In Clearing Queue
                    </span>
                  </div>

                  {pendingPayoutsCount === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No active payout requests pending audit. When a driver completes a ride and requests payout, it will appear here with live countdown.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {payoutRequests.filter(r => r.status === "PENDING_AUDIT").map((req) => (
                        <div key={req.request_id || req.ride_id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Car className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-slate-900">{req.driver_name}</h3>
                                  <span className="text-[11px] text-slate-500 font-mono">({req.driver_phone})</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                    5-Min Safety Hold
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Vehicle: <span className="font-semibold text-slate-700">{req.vehicle}</span> &bull; Rating: {req.driver_rating}
                                </p>
                              </div>
                            </div>

                            {/* 5-Min Countdown Clock & IMPS Action */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                                  Auto Clear Countdown
                                </span>
                                <div className="text-lg font-mono font-black text-amber-900">
                                  {Math.floor((req.remaining_seconds || 300) / 60).toString().padStart(2, "0")}:
                                  {((req.remaining_seconds || 300) % 60).toString().padStart(2, "0")}
                                </div>
                              </div>

                              <button
                                onClick={() => handleApprovePayout(req.ride_id)}
                                disabled={payoutActionLoading === req.ride_id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{payoutActionLoading === req.ride_id ? "Transferring..." : "Approve & Transfer IMPS Now"}</span>
                              </button>

                              <button
                                onClick={() => handleHoldPayout(req.ride_id)}
                                disabled={payoutActionLoading === req.ride_id}
                                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Put On Hold</span>
                              </button>
                            </div>
                          </div>

                          {/* Detail Grid: Driver Bank Details + Financial Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Driver Bank Account & UPI
                              </span>
                              <p className="font-semibold text-slate-800">{req.bank_name}</p>
                              <p className="font-mono text-slate-600">A/C: {req.bank_account_masked}</p>
                              <p className="font-mono text-slate-600">IFSC: {req.ifsc_code} &bull; UPI: {req.upi_id}</p>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Route & Departure
                              </span>
                              <p className="font-semibold text-slate-800">{req.origin_city} &rarr; {req.destination_city}</p>
                              <p className="text-slate-600">Departure: {req.departure_time}</p>
                              <p className="text-slate-600">Passengers: {req.total_seats_booked} seats booked</p>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Financial Settlement Audit
                              </span>
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-slate-600">
                                  <span>Gross Collected:</span>
                                  <span className="font-semibold text-slate-900">INR {req.gross_amount}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>Platform Fee (INR 20/seat):</span>
                                  <span className="font-semibold text-red-600">-INR {req.commission_deducted}</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                                  <span>Net Driver Transfer:</span>
                                  <span>INR {req.net_payable}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Passenger Manifest Snapshot */}
                          {req.passengers && req.passengers.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                                Confirmed Passenger Manifest ({req.passengers.length} Bookings)
                              </span>
                              <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                                    <tr>
                                      <th className="py-2 px-3">Passenger</th>
                                      <th className="py-2 px-3">Phone</th>
                                      <th className="py-2 px-3">Pickup &rarr; Drop</th>
                                      <th className="py-2 px-3">Seats</th>
                                      <th className="py-2 px-3">Fare Paid</th>
                                      <th className="py-2 px-3">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {req.passengers.map((p: any, idx: number) => (
                                      <tr key={p.booking_id || idx} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-semibold text-slate-900">{p.passenger_name}</td>
                                        <td className="py-2 px-3 font-mono text-slate-600">{p.passenger_phone}</td>
                                        <td className="py-2 px-3 text-slate-600">{p.pickup_point} &rarr; {p.drop_point}</td>
                                        <td className="py-2 px-3 font-bold text-slate-800">{p.seats_booked}</td>
                                        <td className="py-2 px-3 font-semibold text-emerald-700">INR {p.fare_paid}</td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                            {p.boarding_status || "CONFIRMED"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settled History */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Historical Settled Disbursements</h2>
                      <p className="text-xs text-slate-500">Official IMPS transfers with verified Bank UTR reference tokens.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Settled At</th>
                          <th className="py-3 px-4">Driver</th>
                          <th className="py-3 px-4">Route</th>
                          <th className="py-3 px-4">Gross Fare</th>
                          <th className="py-3 px-4">Platform Fee</th>
                          <th className="py-3 px-4">Net IMPS Disbursed</th>
                          <th className="py-3 px-4">Bank UTR Reference</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payoutRequests.filter(r => r.status === "SETTLED").length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No settlements processed yet. Approved requests will be listed here.
                            </td>
                          </tr>
                        ) : (
                          payoutRequests.filter(r => r.status === "SETTLED").map((p) => (
                            <tr key={p.request_id || p.ride_id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                                {p.settled_at ? new Date(p.settled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Recently"}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">{p.driver_name}</td>
                              <td className="py-3 px-4 text-slate-600">{p.origin_city} &rarr; {p.destination_city}</td>
                              <td className="py-3 px-4 text-slate-700 font-medium">INR {p.gross_amount}</td>
                              <td className="py-3 px-4 text-red-600 font-medium">-INR {p.commission_deducted}</td>
                              <td className="py-3 px-4 font-bold text-emerald-700 text-sm">INR {p.net_payable}</td>
                              <td className="py-3 px-4 font-mono font-bold text-blue-700">{p.payout_reference_utr || "UTR_CONFIRMED"}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  IMPS SETTLED
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: USER GOVERNANCE & DIRECTORY */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Governance Directory</h1>
                    <p className="text-sm text-slate-500">
                      Audit platform users, manage access credentials, and enforce suspension protocols.
                    </p>
                  </div>
                  <button
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Directory</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search users by name, mobile number, or ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-medium text-slate-500 shrink-0">Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                      }}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="PASSENGER">Passengers</option>
                      <option value="DRIVER">Drivers</option>
                      <option value="ADMIN">Admins</option>
                    </select>
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                    >
                      Filter
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">User Information</th>
                          <th className="py-3.5 px-4">Phone Number</th>
                          <th className="py-3.5 px-4">Assigned Roles</th>
                          <th className="py-3.5 px-4">Account Status</th>
                          <th className="py-3.5 px-4 text-right">Governance Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersList.map((u) => (
                          <tr key={u.user_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900">{u.full_name}</div>
                              <div className="text-xs text-slate-400 font-mono">{u.user_id.slice(0, 8)}...</div>
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-700 text-xs">
                              {u.phone}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1.5">
                                {u.roles.map((r) => (
                                  <span
                                    key={r}
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                                      r === "ADMIN"
                                        ? "bg-purple-100 text-purple-800"
                                        : r === "DRIVER"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {u.is_suspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Suspended</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {u.is_admin ? (
                                <span className="text-xs text-slate-400 italic">Protected Admin</span>
                              ) : u.is_suspended ? (
                                <button
                                  onClick={() => {
                                    setSuspendTargetUser(u);
                                    setSuspendReason("");
                                  }}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSuspendTargetUser(u);
                                    setSuspendReason("Terms of service breach or reported non-compliance.");
                                  }}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  Suspend
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ROUTE PRICING & COMMISSION MATRIX */}
            {activeTab === "pricing" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Corridor Pricing & Commission</h1>
                    <p className="text-sm text-slate-500">
                      Standardized flat tariffs and platform monetization parameters.
                    </p>
                  </div>
                  <button
                    onClick={fetchPricing}
                    disabled={pricingLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pricingLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Policies</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Corridor Card */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          NH
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">Bidar ⇄ Hyderabad (NH 65)</h2>
                          <p className="text-xs text-slate-500">Corridor ID: route_bidar_hyderabad</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const route = pricingData?.routes?.[0];
                          if (route) {
                            setEditingRoute(route);
                            setNewRoutePrice(route.fare_per_seat);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Adjust Base Fare
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Active Base Fare</div>
                        <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                          Rs. {pricingData?.routes?.[0]?.fare_per_seat || 310}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Per passenger seat</div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Allowed Fare Band</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-2">
                          Rs. 250 – Rs. 450
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Regulated guardrails</div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Corridor Length</div>
                        <div className="text-base font-bold text-slate-800 mt-2">138 Kilometers</div>
                        <div className="text-[11px] text-slate-500 mt-1">Bidar Bus Stand to Miyapur/MGBS</div>
                      </div>
                    </div>

                    {/* Stoppages */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Supported Pickup & Drop Stoppages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(pricingData?.routes?.[0]?.pickup_points || [
                          "Bidar Central Bus Stand",
                          "Humnabad Circle",
                          "Zahirabad Bypass",
                          "Sangareddy X Roads",
                          "Miyapur Metro Station",
                          "MGBS Hyderabad",
                        ]).map((pt: string) => (
                          <span
                            key={pt}
                            className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5"
                          >
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>{pt}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Commission Configuration Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Platform Commission</h2>
                        <p className="text-xs text-slate-500">Fixed rate monetization rule</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCommission(true);
                          setNewCommissionFee(pricingData?.commission_rule?.fixed_fee_per_seat || 20);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Modify Fee
                      </button>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <div className="text-xs font-semibold text-emerald-800 uppercase">Fixed Fee Rate</div>
                      <div className="text-3xl font-bold text-emerald-900 font-mono mt-1">
                        Rs. {pricingData?.commission_rule?.fixed_fee_per_seat || 20}
                      </div>
                      <div className="text-xs text-emerald-700 mt-1">Deducted per confirmed passenger seat</div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pricingData?.commission_rule?.description ||
                        "Standard corridor commission applied universally to all scheduled rides between Bidar and Hyderabad."}
                    </p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Passenger Fare:</span>
                        <span className="font-semibold text-slate-800 font-mono">Rs. 310</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Commission:</span>
                        <span className="font-semibold text-emerald-700 font-mono">- Rs. 20</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                        <span>Driver Net Payout:</span>
                        <span className="text-blue-700 font-mono">Rs. 290</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PLATFORM PAYMENT QR MANAGEMENT */}
            {activeTab === "qr" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Collection UPI QR Code</h1>
                    <p className="text-sm text-slate-500">
                      Configure your administrative UPI QR code. All passenger bookings pay into this account directly before driver payouts are released.
                    </p>
                  </div>
                  <button
                    onClick={fetchQrConfig}
                    disabled={qrLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh QR Config</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Live Scannable Preview Card */}
                  <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                          <QrCode className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-wider">Active Platform QR</div>
                          <div className="text-[11px] text-slate-400">Live on Passenger Checkout</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Admin Escrow
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-fit text-center">
                      <img
                        src={
                          uploadedQrPreview ||
                          adminQrConfig?.qr_image_data ||
                          adminQrConfig?.qr_image_url ||
                          `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=${encodeURIComponent(
                            `upi://pay?pa=${editUpiId || "9986445390@upi"}&pn=${encodeURIComponent(
                              editPayeeName || "Shiva Bhalke"
                            )}&cu=INR&tn=BidarConnect`
                          )}`
                        }
                        alt="Platform Collection QR"
                        className="w-52 h-52 object-contain mx-auto rounded-lg"
                      />
                      <div className="mt-2 text-slate-800 font-mono font-bold text-xs flex items-center justify-center gap-1.5">
                        <span>{editUpiId || adminQrConfig?.upi_id || "9986445390@upi"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editUpiId || adminQrConfig?.upi_id || "9986445390@upi");
                            setQrCopied(true);
                            setTimeout(() => setQrCopied(false), 2000);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {qrCopied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Payee:</span>
                        <span className="font-bold text-white">{editPayeeName || adminQrConfig?.payee_name || "Shiva Bhalke"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Organization:</span>
                        <span className="font-bold text-white">{editBusinessName || adminQrConfig?.business_name || "Bidar Connect"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">QR Type:</span>
                        <span className="font-bold text-blue-400">
                          {uploadedQrPreview || adminQrConfig?.qr_image_data ? "Custom Uploaded Image" : "Dynamic Scannable QR"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-950/60 border border-blue-800/60 rounded-xl text-[11px] text-blue-300">
                      All passengers on the booking checkout page will scan this exact QR code to pay Rs. 310/seat. No passenger money ever goes directly to drivers.
                    </div>
                  </div>

                  {/* Right Column: Upload & Configuration Form */}
                  <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
                    <div className="pb-3 border-b border-slate-100">
                      <h2 className="text-base font-bold text-slate-900">Upload QR Image & Account Details</h2>
                      <p className="text-xs text-slate-500">
                        Upload your bank/GPay/PhonePe QR code screenshot or update your VPA details.
                      </p>
                    </div>

                    <form onSubmit={handleSaveQrConfig} className="space-y-4">
                      {/* Image Upload Area */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Upload Custom QR Code Image (Screenshot / Scanner)
                        </label>
                        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleQrImageUpload}
                            id="admin-qr-file-input"
                            className="hidden"
                          />
                          <label htmlFor="admin-qr-file-input" className="cursor-pointer block space-y-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                              <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              Click to browse and upload QR image
                            </div>
                            <p className="text-[11px] text-slate-500">
                              PNG, JPG, or WEBP (Max 5MB). Screenshot from Google Pay, PhonePe, Paytm, or Bank.
                            </p>
                          </label>

                          {uploadedQrPreview && (
                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Image loaded ready to save
                              </span>
                              <button
                                type="button"
                                onClick={() => setUploadedQrPreview(null)}
                                className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                              >
                                Remove custom image
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* UPI ID & Payee Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Your Personal/Business UPI ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 9986445390@upi"
                            value={editUpiId}
                            onChange={(e) => setEditUpiId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Payee Name (Shown to Riders) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shiva Bhalke"
                            value={editPayeeName}
                            onChange={(e) => setEditPayeeName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Business Name & Instructions */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Organization / Platform Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bidar Connect Escrow"
                          value={editBusinessName}
                          onChange={(e) => setEditBusinessName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Checkout Instructions for Riders
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Instructions displayed on checkout screen"
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Save Button */}
                      <button
                        type="submit"
                        disabled={qrSaving}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center space-x-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{qrSaving ? "Updating Platform QR..." : "Save & Publish QR to Passenger Checkout"}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT TRAIL */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail & Log Records</h1>
                    <p className="text-sm text-slate-500">
                      Immutable sequence of operational and administrative actions taken across the platform.
                    </p>
                  </div>
                  <button
                    onClick={fetchAuditLogs}
                    disabled={auditLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Audit Logs</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Timestamp</th>
                          <th className="py-3.5 px-4">Action</th>
                          <th className="py-3.5 px-4">Authorized Actor</th>
                          <th className="py-3.5 px-4">Target Entity</th>
                          <th className="py-3.5 px-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.map((log) => (
                          <tr key={log.log_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900 text-xs">
                              {log.actor_name}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                              {log.target_entity} ({log.target_id.slice(0, 10)})
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                              {log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: FINANCIAL LEDGER & ESCROW RECONCILIATION */}
            {activeTab === "ledger" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Financial Ledger & Escrow Reconciliation
                    </h1>
                    <p className="text-sm text-slate-500">
                      Immutable double-entry transaction journal and corridor escrow settlement tracking.
                    </p>
                  </div>
                  <button
                    onClick={fetchLedger}
                    disabled={ledgerLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Ledger</span>
                  </button>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Total Escrow Collected</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      Rs. {financeSummary?.total_collected_escrow?.toLocaleString("en-IN") || "0"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Passenger payments in clearing</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Driver Disbursements</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 font-mono">
                      Rs. {financeSummary?.total_disbursed_drivers?.toLocaleString("en-IN") || "0"}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">Settled to driver bank/UPI</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Platform Take Revenue</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 font-mono">
                      Rs. {financeSummary?.total_company_revenue?.toLocaleString("en-IN") || "0"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Fixed platform commission</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                      <span className="uppercase tracking-wider">Pending Escrow Reserve</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Receipt className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-700 font-mono">
                      Rs. {financeSummary?.pending_driver_escrow?.toLocaleString("en-IN") || "0"}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Awaiting trip completion & buffer</div>
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Double-Entry Journal Entries</h2>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        Append-Only Verified
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total records: <span className="font-semibold text-slate-800">{ledgerEntries.length}</span>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Recorded At</th>
                          <th className="py-3.5 px-4">Txn Code</th>
                          <th className="py-3.5 px-4">Debit Account</th>
                          <th className="py-3.5 px-4">Credit Account</th>
                          <th className="py-3.5 px-4 text-right">Amount (INR)</th>
                          <th className="py-3.5 px-4">Reference</th>
                          <th className="py-3.5 px-4">Operational Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledgerEntries.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {new Date(e.recorded_at).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {e.transaction_code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 font-mono">
                                {e.debit_account}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 font-mono">
                                {e.credit_account}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              Rs. {Number(e.amount).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                              {e.booking_id ? `BK:${e.booking_id.slice(0, 8)}` : e.payout_id ? `PO:${e.payout_id.slice(0, 8)}` : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                              {e.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: CORRIDOR DISPATCHES & SAFETY SOS */}
            {activeTab === "dispatches" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Corridor Dispatches & Highway Safety SOS
                    </h1>
                    <p className="text-sm text-slate-500">
                      Real-time emergency SOS incident monitoring and multi-channel message dispatch logs.
                    </p>
                  </div>
                  <button
                    onClick={fetchDispatches}
                    disabled={dispatchesLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-medium text-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dispatchesLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Refresh Operations</span>
                  </button>
                </div>

                {/* Sub-section 1: Highway Emergency SOS Incidents */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="w-5 h-5 text-red-400" />
                      <div>
                        <h2 className="text-sm font-bold">Highway Emergency SOS Operations Center</h2>
                        <p className="text-[11px] text-slate-300">Live corridor distress signals and emergency response tracking</p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-600/30 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-full font-bold">
                      {activeSosCount} Active Incidents
                    </span>
                  </div>

                  {sosAlerts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800">Zero Highway SOS Incidents</p>
                      <p className="text-xs text-slate-500 mt-1">Bidar ⇄ Hyderabad corridor operating normally with no active emergency distress signals.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3.5 px-4">Triggered At</th>
                            <th className="py-3.5 px-4">Passenger Information</th>
                            <th className="py-3.5 px-4">Corridor Location / Landmark</th>
                            <th className="py-3.5 px-4">Dispatched Contacts</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Emergency Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sosAlerts.map((alert) => (
                            <tr key={alert.alert_id} className={`transition-colors ${alert.status === "ACTIVE_EMERGENCY" ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-slate-50/60"}`}>
                              <td className="py-4 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                {new Date(alert.triggered_at).toLocaleString("en-IN", {
                                  dateStyle: "short",
                                  timeStyle: "medium",
                                })}
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-bold text-slate-900">{alert.passenger_name}</div>
                                <div className="text-xs font-mono text-slate-500">{alert.passenger_phone}</div>
                              </td>
                              <td className="py-4 px-4 text-xs font-medium text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  <span>{alert.location?.landmark || "NH 65 Highway Corridor"}</span>
                                </div>
                                {alert.emergency_notes && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">{alert.emergency_notes}</div>
                                )}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">{alert.dispatched_contacts_count}</span> SMS & WA alerts
                              </td>
                              <td className="py-4 px-4">
                                {alert.status === "ACTIVE_EMERGENCY" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse border border-red-300">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                    <span>Active Emergency</span>
                                  </span>
                                ) : alert.status === "ACKNOWLEDGED" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Acknowledged</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Resolved</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {alert.status === "ACTIVE_EMERGENCY" && (
                                    <button
                                      onClick={() => handleAcknowledgeSos(alert.alert_id)}
                                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                    >
                                      Acknowledge
                                    </button>
                                  )}
                                  {alert.status !== "RESOLVED" && (
                                    <button
                                      onClick={() => {
                                        setResolvingSosAlert(alert);
                                        setSosResolutionNotes("");
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                    >
                                      Mark Resolved
                                    </button>
                                  )}
                                  {alert.status === "RESOLVED" && (
                                    <span className="text-xs text-slate-400 italic">Closed</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sub-section 2: Corridor Broadcast Advisory Tool */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Broadcast Highway Corridor Advisory</h2>
                        <p className="text-xs text-slate-500">Dispatch weather, highway traffic, or emergency notices to all active users</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Advisory Headline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. NH 65 Monsoon Traffic Warning"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Message Body
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Heavy rainfall near Zahirabad. Expect +25 min delay; proceed cautiously."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                        <span className="text-slate-500 font-semibold">Channels:</span>
                        {["PUSH", "SMS", "WHATSAPP"].map((ch) => (
                          <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={broadcastChannels.includes(ch)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBroadcastChannels([...broadcastChannels, ch]);
                                } else {
                                  setBroadcastChannels(broadcastChannels.filter((c) => c !== ch));
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{ch}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={submittingBroadcast}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submittingBroadcast ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Dispatch Advisory</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Sub-section 3: External Notification Dispatches Inspection Log */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Multi-Channel Dispatches Audit Log</h2>
                      <p className="text-xs text-slate-500">Live delivery journal of transactional SMS, WhatsApp, and Push events</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total dispatches: <span className="font-semibold text-slate-800">{dispatchLogs.length}</span>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">Dispatched At</th>
                          <th className="py-3.5 px-4">Channel</th>
                          <th className="py-3.5 px-4">Recipient</th>
                          <th className="py-3.5 px-4">Event Type</th>
                          <th className="py-3.5 px-4">Provider</th>
                          <th className="py-3.5 px-4">Delivery Status</th>
                          <th className="py-3.5 px-4">Content Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dispatchLogs.map((log) => (
                          <tr key={log.dispatch_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {new Date(log.dispatched_at).toLocaleString("en-IN", {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                log.channel === "WHATSAPP"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.channel === "SMS"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.channel === "PUSH"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}>
                                {log.channel}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-800 font-semibold">
                              {log.recipient}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                              {log.event_type}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">
                              {log.provider}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{log.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                              {log.content_snippet}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* RESOLVE SOS ALERT MODAL */}
      {resolvingSosAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Resolve Highway Emergency Incident</h3>
              </div>
              <button
                onClick={() => setResolvingSosAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><span className="text-slate-500">Passenger:</span> <span className="font-bold text-slate-800">{resolvingSosAlert.passenger_name} ({resolvingSosAlert.passenger_phone})</span></div>
                <div><span className="text-slate-500">Location:</span> <span className="font-semibold text-slate-800">{resolvingSosAlert.location?.landmark || "NH 65"}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Resolution Notes & Findings (Required)
                </label>
                <textarea
                  rows={3}
                  value={sosResolutionNotes}
                  onChange={(e) => setSosResolutionNotes(e.target.value)}
                  placeholder="e.g. Highway assistance verified passenger safety, passenger boarded replacement ride."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingSosAlert(null)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveSos}
                  disabled={submittingSosResolution}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submittingSosResolution ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Resolution</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC REVIEW MODAL */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Review Driver Credentials</h3>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-800">{reviewItem.driver_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono text-slate-800">{reviewItem.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Licence Number:</span>
                  <span className="font-mono font-bold text-blue-700">{reviewItem.licence_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiry Date:</span>
                  <span className="font-mono text-slate-800">{reviewItem.licence_expiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Document ID:</span>
                  <span className="font-mono text-slate-800">{reviewItem.licence_document_id}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction("APPROVE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      reviewAction === "APPROVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction("REJECT")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      reviewAction === "REJECT"
                        ? "bg-red-50 border-red-500 text-red-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Reject Credentials</span>
                  </button>
                </div>
              </div>

              {reviewAction === "REJECT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Rejection Feedback Reason (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="e.g. Expired driving licence, blurred document, or mismatch in full legal name."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewKyc}
                  disabled={submittingReview}
                  className={`w-2/3 py-2.5 px-4 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submittingReview ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Submit Decision</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER SUSPEND MODAL */}
      {suspendTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {suspendTargetUser.is_suspended ? "Reactivate User Account" : "Enforce User Suspension"}
                </h3>
              </div>
              <button
                onClick={() => setSuspendTargetUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Target account: <span className="font-bold text-slate-900">{suspendTargetUser.full_name}</span> ({suspendTargetUser.phone})
              </p>

              {!suspendTargetUser.is_suspended && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Suspension Justification (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Specify policy violation, reported incident, or safety guideline breach..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendTargetUser(null)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleSuspendUser}
                  disabled={submittingSuspend}
                  className={`w-2/3 py-2.5 px-4 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    suspendTargetUser.is_suspended
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submittingSuspend ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{suspendTargetUser.is_suspended ? "Confirm Reactivation" : "Confirm Suspension"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROUTE PRICE MODAL */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Update Corridor Tariff</h3>
              </div>
              <button
                onClick={() => setEditingRoute(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Base Fare Per Seat (Rs.)
                </label>
                <input
                  type="number"
                  min={250}
                  max={450}
                  value={newRoutePrice}
                  onChange={(e) => setNewRoutePrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Corridor regulated fare range: Rs. 250 to Rs. 450 per seat.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRoutePrice}
                  disabled={submittingPrice}
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submittingPrice ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Base Fare</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COMMISSION MODAL */}
      {editingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Update Platform Commission</h3>
              </div>
              <button
                onClick={() => setEditingCommission(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fixed Fee Per Confirmed Seat (Rs.)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newCommissionFee}
                  onChange={(e) => setNewCommissionFee(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Applies directly upon confirmed booking reservation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCommission(false)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCommission}
                  disabled={submittingCommission}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submittingCommission ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Commission</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
