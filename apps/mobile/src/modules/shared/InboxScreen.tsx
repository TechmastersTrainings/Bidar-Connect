import React from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import { MobileNotification } from "../../types";

export function InboxScreen() {
  const notifications: MobileNotification[] = [
    {
      id: "notif_001",
      title: "Booking Confirmed on NH 65",
      message: "Your seat with driver Prakash Biradar (Ertiga KA 38 M 4120) is confirmed for 07:30 AM departure.",
      channel: "PUSH",
      timestamp: "10 mins ago",
      read: false,
      event_type: "BOOKING_CONFIRMED",
    },
    {
      id: "notif_002",
      title: "NH 65 Highway Advisory",
      message: "Normal traffic flow between Zaheerabad and Sangareddy. Toll plaza transit operating smoothly.",
      channel: "IN_APP",
      timestamp: "1 hour ago",
      read: true,
      event_type: "CORRIDOR_ADVISORY",
    },
    {
      id: "notif_003",
      title: "Payment Captured & Escrow Held",
      message: "INR 310 payment captured securely. Regulated escrow ledger held until trip completion.",
      channel: "SMS",
      timestamp: "Yesterday",
      read: true,
      event_type: "PAYMENT_CAPTURED",
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold text-slate-900">Alerts & Dispatches</h1>
        <span className="text-xs text-blue-600 font-semibold">Mark all read</span>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 shadow-xs space-y-2 transition-colors ${
              n.read ? "bg-white border-slate-200" : "bg-blue-50/40 border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    n.event_type === "CORRIDOR_ADVISORY"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {n.event_type === "CORRIDOR_ADVISORY" ? (
                    <Megaphone className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
              </div>

              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                {n.timestamp}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-9">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

