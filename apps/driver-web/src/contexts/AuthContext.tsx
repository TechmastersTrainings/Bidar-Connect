"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, ApiResponse, AuthTokenResponse } from "@bidar/shared-types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, fullName?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
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

  // Restore stored session on mount or from cross-portal SSO handoff
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("auth_token");
        const urlUser = params.get("auth_user");
        if (urlToken && urlUser) {
          try {
            const parsed = JSON.parse(decodeURIComponent(urlUser));
            localStorage.setItem("bidar_driver_token", urlToken);
            localStorage.setItem("bidar_driver_user", JSON.stringify(parsed));
            setToken(urlToken);
            setUser(parsed);
            params.delete("auth_token");
            params.delete("auth_user");
            const newSearch = params.toString() ? `?${params.toString()}` : "";
            window.history.replaceState({}, document.title, window.location.pathname + newSearch);
            setIsLoading(false);
            return;
          } catch (err) {
            console.error("Failed to parse SSO params in driver portal", err);
          }
        }
      }

      const storedToken = localStorage.getItem("bidar_driver_token") || localStorage.getItem("bidar_auth_token");
      const storedUser = localStorage.getItem("bidar_driver_user") || localStorage.getItem("bidar_auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore driver session from localStorage", e);
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
        return { success: false, error: data.error?.message || "Invalid or expired OTP" };
      }

      const receivedToken = data.data.access_token;
      const receivedUser = data.data.user;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem("bidar_driver_token", receivedToken);
      localStorage.setItem("bidar_driver_user", JSON.stringify(receivedUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error verifying OTP" };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<AuthUser> = await res.json();
      if (res.ok && data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("bidar_driver_user", JSON.stringify(data.data));
      }
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bidar_driver_token");
    localStorage.removeItem("bidar_driver_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        requestOtp,
        verifyOtp,
        refreshUser,
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

