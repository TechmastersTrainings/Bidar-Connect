"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("bidar_cookie_consent_accepted");
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const handleAccept = () => {
    setVisible(false);
    try {
      localStorage.setItem("bidar_cookie_consent_accepted", "true");
    } catch {
      // Safe fallback
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 max-w-4xl mx-auto pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Essential & Safety Cookies Notice</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                DPDP Act Compliant
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              We use strictly necessary cookies to authenticate your session and local storage to cache your
              digital ticket pass for offline presentation in highway network dead-zones. Zero advertising trackers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <Link
            href="/cookie-policy"
            className="text-xs text-blue-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            Read Policy
          </Link>
          <button
            onClick={handleAccept}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            Accept Essential Cookies
          </button>
        </div>
      </div>
    </div>
  );
}

