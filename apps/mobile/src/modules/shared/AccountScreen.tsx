import React from "react";
import {
  User,
  Phone,
  ShieldCheck,
  LifeBuoy,
  Bell,
  ArrowRightLeft,
  FileText,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMode } from "../../contexts/ModeContext";

export function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode, isPassenger } = useMode();

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-lg font-bold text-slate-900 px-1">My Account & Safety</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
            {user ? user.full_name.charAt(0) : "G"}
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">
              {user ? user.full_name : "Guest Commuter"}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {user ? user.phone : "Not Signed In"}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Current App Mode:</span>
          <button
            onClick={toggleMode}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to {isPassenger ? "Driver Mode" : "Passenger Mode"}</span>
          </button>
        </div>
      </div>

      {/* Safety & Emergency Contacts */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Safety & Emergency Dispatch
        </h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <div className="font-bold text-slate-900">24/7 Highway Patrol Helpline</div>
              <div className="text-slate-500 text-[11px]">Direct emergency incident dispatch</div>
            </div>
            <span className="font-mono font-bold text-blue-600">+91 8482 112 112</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <div className="font-bold text-slate-900">Family Emergency Contact</div>
              <div className="text-slate-500 text-[11px]">Auto-alerted upon SOS broadcast</div>
            </div>
            <span className="font-mono text-slate-700">+91 98450 12345</span>
          </div>
        </div>
      </div>

      {/* Legal & Policy Links */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Legal & Compliance
        </h2>

        <a
          href="http://localhost:3000/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-2 border-b border-slate-100 text-slate-700 hover:text-blue-600"
        >
          <span>Privacy Policy (DPDP Act, 2023)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <a
          href="http://localhost:3000/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-2 border-b border-slate-100 text-slate-700 hover:text-blue-600"
        >
          <span>Terms of Service (Motor Vehicles Act)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <a
          href="http://localhost:3000/refund-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-2 border-b border-slate-100 text-slate-700 hover:text-blue-600"
        >
          <span>Cancellation & Refund Policy</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <a
          href="http://localhost:3000/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-2 text-slate-700 hover:text-blue-600"
        >
          <span>Nodal Grievance Officer (IT Rules, 2021)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Logout Action */}
      {isAuthenticated && (
        <button
          onClick={logout}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-2xl border border-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Mobile Session</span>
        </button>
      )}
    </div>
  );
}

