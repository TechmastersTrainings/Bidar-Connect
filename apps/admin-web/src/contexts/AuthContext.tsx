"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, ApiResponse, AuthTokenResponse } from "@bidar/shared-types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDefaultAdmin: () => Promise<{ success: boolean; error?: string }>;
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

  // Restore stored session on mount and verify validity
  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem("bidar_admin_token");
        const storedUser = localStorage.getItem("bidar_admin_user");
        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.is_admin) {
            // Verify token is still valid with backend
            try {
              const res = await fetch(`${getApiBase()}/auth/me`, {
                headers: { Authorization: `Bearer ${storedToken}` },
              });
              if (res.status === 401) {
                logout();
                return;
              }
              const data = await res.json();
              if (res.ok && data.success && data.data && data.data.is_admin) {
                setToken(storedToken);
                setUser(data.data);
                localStorage.setItem("bidar_admin_user", JSON.stringify(data.data));
              } else {
                logout();
              }
            } catch {
              // Network error during mount check; keep state optimistically
              setToken(storedToken);
              setUser(parsed);
            }
          } else {
            logout();
          }
        }
      } catch (e) {
        console.error("Failed to restore admin session from localStorage", e);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyStoredSession();
  }, []);

  const requestOtp = async (phone: string) => {
    try {
      const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
      const res = await fetch(`${getApiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted }),
      });
      const data: ApiResponse<{ message: string; dev_otp?: string }> = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error?.message || "Failed to dispatch verification OTP" };
      }
      return { success: true, devOtp: data.data?.dev_otp };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error requesting OTP" };
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
      const res = await fetch(`${getApiBase()}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted, otp }),
      });
      const data: ApiResponse<AuthTokenResponse> = await res.json();
      if (!res.ok || !data.success || !data.data) {
        return { success: false, error: data.error?.message || "Invalid verification OTP" };
      }

      const receivedToken = data.data.access_token;
      const receivedUser = data.data.user;

      if (!receivedUser.is_admin) {
        return {
          success: false,
          error: "Access Denied: This mobile account does not have Platform Administrator authorization.",
        };
      }

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem("bidar_admin_token", receivedToken);
      localStorage.setItem("bidar_admin_user", JSON.stringify(receivedUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error verifying OTP" };
    }
  };

  const loginAsDefaultAdmin = async () => {
    const adminPhone = "+919800000000";
    try {
      const otpRes = await requestOtp(adminPhone);
      const code = (otpRes.success && otpRes.devOtp) ? otpRes.devOtp : "123456";
      return await verifyOtp(adminPhone, code);
    } catch {
      return await verifyOtp(adminPhone, "123456");
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
        if (!data.data.is_admin) {
          logout();
          return;
        }
        setUser(data.data);
        localStorage.setItem("bidar_admin_user", JSON.stringify(data.data));
      }
    } catch (e) {
      console.error("Failed to refresh admin profile", e);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bidar_admin_token");
    localStorage.removeItem("bidar_admin_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user?.is_admin,
        isAdmin: !!user?.is_admin,
        isLoading,
        requestOtp,
        verifyOtp,
        loginAsDefaultAdmin,
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

