"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, ApiResponse, AuthTokenResponse } from "@bidar/shared-types";

export type AppMode = "PASSENGER" | "DRIVER";

export interface DriverOnboardPayload {
  licence_number: string;
  licence_expiry: string;
  licence_document_id?: string;
  payout_upi_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  fuel_type?: string;
  passenger_capacity?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, fullName?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  onboardDriver: (payload: DriverOnboardPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return "http://127.0.0.1:8000/api/v1";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveModeState] = useState<AppMode>("PASSENGER");

  // Switch mode and persist in localStorage
  const setActiveMode = useCallback((mode: AppMode) => {
    setActiveModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("bidar_app_mode", mode);
    }
  }, []);

  // Refresh user profile from /auth/me
  const refreshUser = useCallback(async () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("bidar_auth_token") : null);
    if (!currentToken) return;

    try {
      const res = await fetch(`${getApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data: ApiResponse<AuthUser> = await res.json();
      if (res.ok && data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("bidar_auth_user", JSON.stringify(data.data));
      }
    } catch (err) {
      console.warn("Failed to refresh user profile", err);
    }
  }, [token]);

  // Restore stored session on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Restore active mode preference
        const storedMode = localStorage.getItem("bidar_app_mode") as AppMode;
        if (storedMode === "DRIVER" || storedMode === "PASSENGER") {
          setActiveModeState(storedMode);
        }

        // Restore token & user
        const storedToken =
          localStorage.getItem("bidar_auth_token") ||
          localStorage.getItem("bidar_jwt_token") ||
          localStorage.getItem("bidar_driver_token");
        const storedUser =
          localStorage.getItem("bidar_auth_user") ||
          localStorage.getItem("bidar_app_user") ||
          localStorage.getItem("bidar_driver_user");

        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsed);
          // Sync canonical storage keys
          localStorage.setItem("bidar_auth_token", storedToken);
          localStorage.setItem("bidar_auth_user", storedUser);
        }
      }
    } catch (e) {
      console.error("Failed to restore session from localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestOtp = async (phone: string) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data: ApiResponse<{ message: string; dev_otp?: string }> = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error?.message || "Failed to dispatch OTP" };
      }
      return { success: true, devOtp: data.data?.dev_otp };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error requesting OTP" };
    }
  };

  const verifyOtp = async (phone: string, otp: string, fullName?: string, email?: string) => {
    try {
      const res = await fetch(`${getApiBase()}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, full_name: fullName, email }),
      });
      const data: ApiResponse<AuthTokenResponse> = await res.json();
      if (!res.ok || !data.success || !data.data) {
        return { success: false, error: data.error?.message || "Invalid OTP code" };
      }

      const receivedToken = data.data.access_token;
      const receivedUser = data.data.user;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem("bidar_auth_token", receivedToken);
      localStorage.setItem("bidar_auth_user", JSON.stringify(receivedUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error verifying OTP" };
    }
  };

  // One-click upgrade from Passenger to verified Driver Partner
  const onboardDriver = async (payload: DriverOnboardPayload) => {
    if (!token) {
      return { success: false, error: "Authentication required to activate Driver mode." };
    }

    try {
      // 1. Submit driving licence credentials
      const res = await fetch(`${getApiBase()}/auth/driver-onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          licence_number: payload.licence_number,
          licence_expiry: payload.licence_expiry,
          licence_document_id: payload.licence_document_id || "doc_licence_default",
          payout_upi_id: payload.payout_upi_id || null,
        }),
      });

      const data: ApiResponse<AuthUser> = await res.json();
      if (!res.ok || !data.success || !data.data) {
        return { success: false, error: data.error?.message || "Failed to activate driver profile." };
      }

      // 2. Register initial vehicle if provided
      if (payload.vehicle_reg && payload.vehicle_make && payload.vehicle_model) {
        try {
          await fetch(`${getApiBase()}/driver/vehicles`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              make: payload.vehicle_make,
              model: payload.vehicle_model,
              registration_number: payload.vehicle_reg.toUpperCase(),
              color: "White",
              year: 2023,
              fuel_type: payload.fuel_type || "DIESEL",
              passenger_capacity: payload.passenger_capacity || 4,
            }),
          });
        } catch (vehErr) {
          console.warn("Initial vehicle registration error", vehErr);
        }
      }

      // 3. Update local user state
      setUser(data.data);
      localStorage.setItem("bidar_auth_user", JSON.stringify(data.data));
      setActiveMode("DRIVER");

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error activating driver mode." };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bidar_auth_token");
    localStorage.removeItem("bidar_auth_user");
    localStorage.removeItem("bidar_jwt_token");
    localStorage.removeItem("bidar_app_user");
    localStorage.removeItem("bidar_driver_token");
    localStorage.removeItem("bidar_driver_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        activeMode,
        setActiveMode,
        requestOtp,
        verifyOtp,
        refreshUser,
        onboardDriver,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
