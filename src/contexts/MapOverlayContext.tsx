"use client";

/**
 * =============================================================================
 * MAP OVERLAY CONTEXT
 * =============================================================================
 * Manages: whether the map overlay (activities on map) is open/closed.
 * No API integration needed - pure UI state.
 * =============================================================================
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * Where the map should land when it opens. `bubbleId` focuses a specific event
 * (bubble cards); `zone` centres a building for things that have a location
 * but no coordinates, like campus events.
 */
export type MapFocusTarget = {
  bubbleId?: string;
  zone?: string;
};

type MapOverlayContextValue = {
  isOpen: boolean;
  focusTarget: MapFocusTarget | null;
  openMap: (target?: MapFocusTarget) => void;
  closeMap: () => void;
};

const MapOverlayContext = createContext<MapOverlayContextValue | null>(null);

export function MapOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);

  const openMap = useCallback((target?: MapFocusTarget) => {
    setFocusTarget(target ?? null);
    setIsOpen(true);
  }, []);
  const closeMap = useCallback(() => {
    setIsOpen(false);
    setFocusTarget(null);
  }, []);

  return (
    <MapOverlayContext.Provider value={{ isOpen, focusTarget, openMap, closeMap }}>
      {children}
    </MapOverlayContext.Provider>
  );
}

export function useMapOverlay(): MapOverlayContextValue | null {
  return useContext(MapOverlayContext);
}
