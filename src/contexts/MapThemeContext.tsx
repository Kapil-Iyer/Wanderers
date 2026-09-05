"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type MapTheme = "dark" | "light";

// v2 key: resets anyone stuck on a previously stored "light" preference so the
// map always opens in its dark cinematic default.
const STORAGE_KEY = "wanderers-map-theme-v2";

function readStoredTheme(): MapTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

type MapThemeContextValue = {
  theme: MapTheme;
  toggleTheme: () => void;
};

const MapThemeContext = createContext<MapThemeContextValue | null>(null);

export function MapThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<MapTheme>(readStoredTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: MapTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <MapThemeContext.Provider value={value}>{children}</MapThemeContext.Provider>;
}

export function useMapTheme() {
  const ctx = useContext(MapThemeContext);
  if (!ctx) throw new Error("useMapTheme must be used within MapThemeProvider");
  return ctx;
}
