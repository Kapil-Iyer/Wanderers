"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CampusMode } from "@/lib/campusBounds";

const STORAGE_KEY = "wanderers-campus-mode";

type CampusModeContextValue = {
  campusMode: CampusMode | null;
  setCampusMode: (mode: CampusMode) => void;
  resetCampusMode: () => void;
};

const CampusModeContext = createContext<CampusModeContextValue | null>(null);

export function CampusModeProvider({ children }: { children: React.ReactNode }) {
  // Always prompt on map open; choice resets when overlay closes
  const [campusMode, setCampusModeState] = useState<CampusMode | null>(null);

  const setCampusMode = useCallback((mode: CampusMode) => {
    sessionStorage.setItem(STORAGE_KEY, mode);
    setCampusModeState(mode);
  }, []);

  const resetCampusMode = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setCampusModeState(null);
  }, []);

  const value = useMemo(
    () => ({ campusMode, setCampusMode, resetCampusMode }),
    [campusMode, setCampusMode, resetCampusMode]
  );

  return <CampusModeContext.Provider value={value}>{children}</CampusModeContext.Provider>;
}

export function useCampusMode() {
  const ctx = useContext(CampusModeContext);
  if (!ctx) throw new Error("useCampusMode must be used within CampusModeProvider");
  return ctx;
}
