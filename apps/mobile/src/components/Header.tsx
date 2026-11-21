import React from "react";
import {
  Car,
  ShieldAlert,
  Wifi,
  WifiOff,
  Bell,
  ArrowRightLeft,
  Sparkles,
  QrCode,
} from "lucide-react";
import { useMode } from "../contexts/ModeContext";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onOpenSOS: () => void;
  onOpenOfflineVault: () => void;
  onOpenAuth: () => void;
  isOffline?: boolean;
}

export function Header({
  onOpenSOS,
  onOpenOfflineVault,
  onOpenAuth,
  isOffline = false,
}: HeaderProps) {
  const { mode, toggleMode, isPassenger, isDriver } = useMode();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white pt-3 pb-3 px-4 shadow-lg border-b border-slate-800 sticky top-0 z-40">
      {/* Top Status & Brand Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight block leading-none">
              Bidar Connect
            </span>
            <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider block mt-0.5">
              NH 65 Mobile
            </span>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2">
          {/* Offline Ticket Vault Button */}
          <button
            onClick={onOpenOfflineVault}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
            title="Access Offline Ticket Pass"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Offline Pass</span>
          </button>

          {/* SOS Emergency Button */}
          <button
            onClick={onOpenSOS}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[11px] font-bold shadow-md shadow-red-600/30 transition-all animate-pulse"
            title="Highway Emergency SOS"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Toggle Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => toggleMode()}
            className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isPassenger
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Passenger Mode</span>
          </button>

          <button
            onClick={() => toggleMode()}
            className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isDriver
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Driver Mode</span>
          </button>
        </div>

        {/* Auth / Profile Trigger */}
        <div className="shrink-0 pl-1 border-l border-slate-800">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 text-xs px-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] text-slate-300 font-medium max-w-[80px] truncate">
                {user.full_name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="text-[10px] text-slate-500 hover:text-red-400 ml-1 underline"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

