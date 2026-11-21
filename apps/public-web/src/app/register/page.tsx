"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login portal which handles unified sign in and registration
    if (typeof window !== "undefined") {
      const host = window.location.hostname || "localhost";
      window.location.href = `http://${host}:3001`;
    }
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-bold text-slate-800">Redirecting to Bidar Connect</h2>
        <p className="text-xs text-slate-500 mt-2">Connecting you to the unified passenger and driver portal...</p>
      </div>
    </div>
  );
}

