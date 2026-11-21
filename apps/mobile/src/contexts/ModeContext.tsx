import React, { createContext, useContext, useState, useEffect } from "react";
import { AppMode } from "../types";

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isPassenger: boolean;
  isDriver: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("PASSENGER");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bidar_mobile_mode");
      if (stored === "PASSENGER" || stored === "DRIVER") {
        setModeState(stored);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("bidar_mobile_mode", newMode);
    } catch {
      // Safe fallback
    }
  };

  const toggleMode = () => {
    const next = mode === "PASSENGER" ? "DRIVER" : "PASSENGER";
    setMode(next);
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isPassenger: mode === "PASSENGER",
        isDriver: mode === "DRIVER",
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}

