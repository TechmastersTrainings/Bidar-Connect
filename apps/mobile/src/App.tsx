import React, { useState } from "react";
import {
  Search,
  PlusCircle,
  Calendar,
  Users,
  Bell,
  User,
  QrCode,
  ShieldAlert,
  Car,
  Banknote,
} from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModeProvider, useMode } from "./contexts/ModeContext";
import { Header } from "./components/Header";
import { EmergencySOSModal } from "./components/EmergencySOSModal";
import { OfflineTicketVaultModal } from "./components/OfflineTicketVaultModal";
import { AuthModal } from "./components/AuthModal";

// Modular Screens
import { PassengerHomeScreen } from "./modules/passenger/PassengerHomeScreen";
import { BookingsTab } from "./modules/passenger/BookingsTab";
import { DriverHomeScreen } from "./modules/driver/DriverHomeScreen";
import { DriverPayoutsTab } from "./modules/driver/DriverPayoutsTab";
import { InboxScreen } from "./modules/shared/InboxScreen";
import { AccountScreen } from "./modules/shared/AccountScreen";

type ActiveTab = "MAIN" | "TRIPS" | "INBOX" | "ACCOUNT";

function MobileAppContent() {
  const { mode, isPassenger, isDriver } = useMode();
  const [activeTab, setActiveTab] = useState<ActiveTab>("MAIN");
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [offlineVaultOpen, setOfflineVaultOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 max-w-md mx-auto relative shadow-2xl overflow-x-hidden font-sans">
      {/* Native Mobile Header */}
      <Header
        onOpenSOS={() => setSosModalOpen(true)}
        onOpenOfflineVault={() => setOfflineVaultOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Screen Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "MAIN" && (
          isPassenger ? (
            <PassengerHomeScreen
              onOpenOfflineTicket={() => setOfflineVaultOpen(true)}
              onOpenSOS={() => setSosModalOpen(true)}
            />
          ) : (
            <DriverHomeScreen />
          )
        )}

        {activeTab === "TRIPS" && (
          isPassenger ? (
            <BookingsTab onOpenOfflineVault={() => setOfflineVaultOpen(true)} />
          ) : (
            <DriverPayoutsTab />
          )
        )}

        {activeTab === "INBOX" && <InboxScreen />}

        {activeTab === "ACCOUNT" && <AccountScreen />}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-between z-40 shadow-lg">
        <button
          onClick={() => setActiveTab("MAIN")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
            activeTab === "MAIN" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {isPassenger ? <Search className="w-5 h-5" /> : <Car className="w-5 h-5" />}
          <span>{isPassenger ? "Find Rides" : "Publish Commute"}</span>
        </button>

        <button
          onClick={() => setActiveTab("TRIPS")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
            activeTab === "TRIPS" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {isPassenger ? <Calendar className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
          <span>{isPassenger ? "My Trips" : "Payouts"}</span>
        </button>

        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
            activeTab === "INBOX" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("ACCOUNT")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
            activeTab === "ACCOUNT" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </button>
      </nav>

      {/* Modal Containers */}
      <EmergencySOSModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
      <OfflineTicketVaultModal isOpen={offlineVaultOpen} onClose={() => setOfflineVaultOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModeProvider>
        <MobileAppContent />
      </ModeProvider>
    </AuthProvider>
  );
}

