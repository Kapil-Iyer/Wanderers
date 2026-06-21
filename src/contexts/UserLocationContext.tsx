"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "wanderers-user-location";

export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "blocked";

export type UserCoords = { lat: number; lng: number };

type UserLocationContextValue = {
  userLocation: UserCoords | null;
  locationStatus: LocationStatus;
  requestLocation: () => void;
};

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

function readStoredLocation(): UserCoords | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const [latStr, lngStr] = raw.split(",");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

async function isGeolocationBlocked(): Promise<boolean> {
  if (!navigator.permissions?.query) return false;
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state === "denied";
  } catch {
    return false;
  }
}

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const requestedRef = useRef(false);

  const applyPosition = useCallback((lat: number, lng: number) => {
    const coords = { lat, lng };
    setUserLocation(coords);
    setLocationStatus("granted");
    sessionStorage.setItem(STORAGE_KEY, `${lat},${lng}`);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude);
      },
      async () => {
        const blocked = await isGeolocationBlocked();
        setLocationStatus(blocked ? "blocked" : "denied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [applyPosition]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    const stored = readStoredLocation();
    if (stored) {
      setUserLocation(stored);
      setLocationStatus("granted");
      return;
    }

    requestLocation();
  }, [requestLocation]);

  const value = useMemo(
    () => ({ userLocation, locationStatus, requestLocation }),
    [userLocation, locationStatus, requestLocation]
  );

  return (
    <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error("useUserLocation must be used within UserLocationProvider");
  return ctx;
}
