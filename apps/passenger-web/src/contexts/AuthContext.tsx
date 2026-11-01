"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, ApiResponse, AuthTokenResponse } from "@bidar/shared-types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://127.0.0.1:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("bidar_auth_token");
      const storedUser = localStorage.getItem("bidar_auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore session from localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestOtp = async (phone: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/otp/request`, {
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

  const verifyOtp = async (phone: string, otp: string, fullName?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, full_name: fullName }),
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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bidar_auth_token");
    localStorage.removeItem("bidar_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        requestOtp,
        verifyOtp,
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
