"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animateMapCamera,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FOCUS_MAP_ZOOM,
  isMapViewAtDefault,
} from "@/lib/mapCamera";
import type { MapBubble } from "@/lib/mapClustering";

type MapDiscoveryContextValue = {
  hoveredEventId: string | null;
  activeEventId: string | null;
  lockedEventId: string | null;
  isViewChanged: boolean;
  registerMap: (map: google.maps.Map | null) => void;
  registerMapContainer: (el: HTMLDivElement | null) => void;
  setHoveredEventId: (id: string | null) => void;
  focusEvent: (id: string, opts?: { fromClick?: boolean }) => void;
  clearHover: () => void;
  unlockEvent: () => void;
  resetView: () => void;
  getBubbleById: (id: string) => MapBubble | undefined;
};

const MapDiscoveryContext = createContext<MapDiscoveryContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  bubbles: MapBubble[];
  onZoomChanged?: (zoom: number) => void;
};

export function MapDiscoveryProvider({ children, bubbles, onZoomChanged }: ProviderProps) {
  const [hoveredEventId, setHoveredEventIdState] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [lockedEventId, setLockedEventId] = useState<string | null>(null);
  const [isViewChanged, setIsViewChanged] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const bubbleMapRef = useRef<Map<string, MapBubble>>(new Map());
  const cameraCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bubbleMapRef.current = new Map(bubbles.map((b) => [b.id, b]));
  }, [bubbles]);

  const updateViewChanged = useCallback(() => {
    const map = mapRef.current;
    if (map) setIsViewChanged(!isMapViewAtDefault(map));
  }, []);

  const registerMap = useCallback(
    (map: google.maps.Map | null) => {
      mapRef.current = map;
      if (map) {
        updateViewChanged();
        map.addListener("idle", updateViewChanged);
      }
    },
    [updateViewChanged]
  );

  const registerMapContainer = useCallback((el: HTMLDivElement | null) => {
    mapContainerRef.current = el;
  }, []);

  const getBubbleById = useCallback((id: string) => bubbleMapRef.current.get(id), []);

  const flyToBubble = useCallback(
    (bubble: MapBubble, zoom = FOCUS_MAP_ZOOM) => {
      const map = mapRef.current;
      if (!map || bubble.lat == null || bubble.lng == null) return;

      cameraCancelRef.current?.();
      cameraCancelRef.current = animateMapCamera(
        map,
        { lat: bubble.lat, lng: bubble.lng },
        zoom
      );
      onZoomChanged?.(zoom);
      setIsViewChanged(true);
    },
    [onZoomChanged]
  );

  const unlockEvent = useCallback(() => {
    setLockedEventId(null);
    setActiveEventId(null);
    setHoveredEventIdState(null);
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setHoveredEventIdState(null);
    setActiveEventId(null);
    setLockedEventId(null);

    cameraCancelRef.current?.();
    cameraCancelRef.current = animateMapCamera(map, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    onZoomChanged?.(DEFAULT_MAP_ZOOM);

    window.setTimeout(updateViewChanged, 450);
  }, [onZoomChanged, updateViewChanged]);

  const setHoveredEventId = useCallback((id: string | null) => {
    setHoveredEventIdState(id);
  }, []);

  const clearHover = useCallback(() => {
    setHoveredEventIdState(null);
  }, []);

  const focusEvent = useCallback(
    (id: string, opts?: { fromClick?: boolean }) => {
      const bubble = bubbleMapRef.current.get(id);
      if (!bubble) return;

      if (opts?.fromClick) {
        setLockedEventId(id);
        setActiveEventId(id);
        setHoveredEventIdState(id);
        flyToBubble(bubble);
        mapContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setHoveredEventIdState(id);
      }
    },
    [flyToBubble]
  );

  useEffect(() => {
    return () => {
      cameraCancelRef.current?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      hoveredEventId,
      activeEventId,
      lockedEventId,
      isViewChanged,
      registerMap,
      registerMapContainer,
      setHoveredEventId,
      focusEvent,
      clearHover,
      unlockEvent,
      resetView,
      getBubbleById,
    }),
    [
      hoveredEventId,
      activeEventId,
      lockedEventId,
      isViewChanged,
      registerMap,
      registerMapContainer,
      setHoveredEventId,
      focusEvent,
      clearHover,
      unlockEvent,
      resetView,
      getBubbleById,
    ]
  );

  return <MapDiscoveryContext.Provider value={value}>{children}</MapDiscoveryContext.Provider>;
}

export function useMapDiscovery() {
  const ctx = useContext(MapDiscoveryContext);
  if (!ctx) throw new Error("useMapDiscovery must be used within MapDiscoveryProvider");
  return ctx;
}
