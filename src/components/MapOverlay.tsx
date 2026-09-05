"use client";

/**
 * MAP OVERLAY - Dark discovery: glass pills on map + horizontal activity cards
 * Join/chat logic unchanged from prior implementation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Layers, LayoutGrid, Map as MapIcon, Moon, Sun } from "lucide-react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useConversations } from "@/contexts/ConversationsContext";
import { MapFilterProvider, useMapFilter } from "@/contexts/MapFilterContext";
import { MapDiscoveryProvider, useMapDiscovery } from "@/contexts/MapDiscoveryContext";
import { MapThemeProvider, useMapTheme } from "@/contexts/MapThemeContext";
import { CampusModeProvider, useCampusMode } from "@/contexts/CampusModeContext";
import {
  applyMapDisplayTheme,
  buildMapOptions,
  DARK_MAP_STYLES,
  MAP_BACKGROUND,
} from "@/lib/mapStyles";
import { applyCampusModeToMap, isOnCampus } from "@/lib/campusBounds";
import {
  applyOffCampusMapView,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  fitMapToBubbles,
} from "@/lib/mapCamera";
import { getUwBounds } from "@/lib/campusBounds";
import { sortBubblesBySoonest, sortBubblesByNearest } from "@/lib/eventSort";
import { formatDistance, haversineDistance } from "@/lib/distance";
import {
  DEFAULT_TIME_FILTER,
  isTimeFilterActive,
  matchesTimeFilter,
  type MapTimeFilter,
} from "@/lib/mapTimeFilter";
import { UserLocationProvider, useUserLocation } from "@/contexts/UserLocationContext";
import {
  activityEmoji,
  categoryMatchesFilter,
  inferCategory,
  type CategoryFilterId,
} from "@/lib/eventCategories";
import { clusterMapBubbles, clusterMapBubblesByPixels, type MapBubble, type MapCluster } from "@/lib/mapClustering";
import { MOCK_MAP_EVENTS, MOCK_EVENT_IDS, getMockEventById } from "@/lib/mockMapEvents";
import EventPill from "@/components/map/EventPill";
import ClusterPill from "@/components/map/ClusterPill";
import ActivityCard from "@/components/map/ActivityCard";
import MapFilterBar from "@/components/map/MapFilterBar";
import OffCampusFilterToast from "@/components/map/OffCampusFilterToast";
import ActiveFilterSummary from "@/components/map/ActiveFilterSummary";
import NearbyFocusHeader from "@/components/map/NearbyFocusHeader";
import {
  readCampusFilterFromUrl,
  writeMapFiltersToUrl,
  type CampusFilterId,
} from "@/lib/mapFilterUrl";
import { matchesCampusFilter, resolveOnCampus } from "@/lib/campus";
import CampusModeModal from "@/components/map/CampusModeModal";
import OffCampusWarningDialog from "@/components/map/OffCampusWarningDialog";
import UserLocationMarker from "@/components/map/UserLocationMarker";
import CampusBoundaryLayer from "@/components/map/CampusBoundaryLayer";
import CreateBubbleModal from "@/components/ui/CreateBubbleModal";
import MapsAuthNotice from "@/components/map/MapsAuthNotice";
import { useMapsAuthFailure } from "@/hooks/useMapsAuthFailure";
import { useGuest } from "@/contexts/GuestContext";
import { DEMO_MAP_MARKERS as GUEST_DEMO_MARKERS } from "@/lib/demoData";

const DEMO_BUBBLES = MOCK_MAP_EVENTS;

/** "Now" / "15 min" / "1 hr" -> minutes from now. */
function parseMinutesFromNow(startingIn: string): number {
  if (/^now$/i.test(startingIn.trim())) return 0;
  const hrs = startingIn.match(/([\d.]+)\s*hr/i);
  const mins = startingIn.match(/(\d+)\s*min/i);
  return (hrs ? Number(hrs[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

/** "2 hr" / "45 min" / "1.5 hr" -> minutes. */
function parseDurationToMinutes(duration: string): number {
  const hrs = duration.match(/([\d.]+)\s*hr/i);
  const mins = duration.match(/(\d+)\s*min/i);
  return (hrs ? Number(hrs[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0) || 60;
}

/**
 * Guest-mode map data: converts the same curated demo bubbles shown on Home
 * (src/lib/demoData.ts) into the ApiBubble shape this file already knows how
 * to render/cluster - no real /api/bubbles/list call ever happens for a
 * guest, this is purely local data reshaped to fit the existing pipeline.
 */
function buildGuestApiBubbles(): ApiBubble[] {
  const now = Date.now();
  return GUEST_DEMO_MARKERS.map((b) => ({
    id: b.id,
    activity: b.title,
    zone: b.zone ?? "",
    start_time: new Date(now + parseMinutesFromNow(b.startingIn) * 60_000).toISOString(),
    duration_minutes: parseDurationToMinutes(b.duration),
    max_members: b.maxPeople,
    members_count: b.joined,
  }));
}

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  // ── Academic / indoor ──────────────────────────────────────────────────
  PAC:                        { lat: 43.4738, lng: -80.5468 },
  "PAC Courts":               { lat: 43.4736, lng: -80.5470 },
  "PAC Pool":                 { lat: 43.4740, lng: -80.5465 },
  "PAC Gym":                  { lat: 43.4738, lng: -80.5468 },
  SLC:                        { lat: 43.4718, lng: -80.5442 },
  "SLC Atrium":               { lat: 43.4720, lng: -80.5438 },
  "SLC Game Room":            { lat: 43.4718, lng: -80.5442 },
  "SLC Turnkey Desk":         { lat: 43.4717, lng: -80.5444 },
  "Bomber Bar (SLC)":         { lat: 43.4716, lng: -80.5446 },
  DC:                         { lat: 43.4725, lng: -80.5430 },
  "DC Library 2nd Floor":     { lat: 43.4725, lng: -80.5430 },
  "Dana Porter Library":      { lat: 43.4709, lng: -80.5430 },
  MC:                         { lat: 43.4724, lng: -80.5421 },
  "MC Study Hall":            { lat: 43.4724, lng: -80.5421 },
  EV3:                        { lat: 43.4729, lng: -80.5418 },
  "EV3 Atrium":               { lat: 43.4729, lng: -80.5418 },
  // ── Outdoor campus ────────────────────────────────────────────────────
  "Peter Russell Rock Garden":{ lat: 43.4672, lng: -80.5415 },
  "Columbia Fields":          { lat: 43.4755, lng: -80.5480 },
  "Columbia Lake":            { lat: 43.4700, lng: -80.5558 },
  "REV Quad":                 { lat: 43.4699, lng: -80.5537 },
  "Village 1 Rec Room":       { lat: 43.4700, lng: -80.5492 },
  // ── Off-campus / uptown ───────────────────────────────────────────────
  "Chatime Waterloo":         { lat: 43.4730, lng: -80.5395 },
  "Pizza Nova Uptown":        { lat: 43.4660, lng: -80.5222 },
  "Waterloo Park Entrance":   { lat: 43.4677, lng: -80.5218 },
  "Conestoga Mall":           { lat: 43.4990, lng: -80.5225 },
  "Uptown Waterloo":          { lat: 43.4645, lng: -80.5180 },
  "Laurel Creek":             { lat: 43.4700, lng: -80.5500 },
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const MAP_TYPE_STORAGE_KEY = "wanderers-map-type";

/** Radius for the "near this event" list shown after a pin is selected. */
const NEARBY_RADIUS_M = 800;
const NEARBY_RADIUS_LABEL = "800 m";

type MapTypeId = "roadmap" | "satellite";

function readStoredMapType(): MapTypeId {
  if (typeof window === "undefined") return "roadmap";
  return sessionStorage.getItem(MAP_TYPE_STORAGE_KEY) === "satellite" ? "satellite" : "roadmap";
}

function formatStartTime(startTime: string): { startingIn: string; startTimeMs: number } {
  const ms = new Date(startTime).getTime();
  const diffMin = Math.round((ms - Date.now()) / 60_000);
  if (Number.isNaN(ms)) return { startingIn: "Soon", startTimeMs: Date.now() };
  if (diffMin <= 0) return { startingIn: "Starting now", startTimeMs: ms };
  if (diffMin < 60) return { startingIn: `In ${diffMin} mins`, startTimeMs: ms };
  const hrs = Math.round(diffMin / 60);
  return { startingIn: `In ${hrs} hr${hrs !== 1 ? "s" : ""}`, startTimeMs: ms };
}

type ApiBubble = {
  id: string;
  activity: string;
  zone: string;
  start_time: string;
  duration_minutes: number;
  max_members: number | null;
  members_count: number;
};

function toBubbleForContext(b: ApiBubble, lat: number, lng: number): MapBubble {
  const category = inferCategory(b.activity);
  const maxPeople = b.max_members ?? 8;
  const joined = b.members_count ?? 0;
  const { startingIn, startTimeMs } = formatStartTime(b.start_time);
  return {
    id: b.id,
    title: b.activity,
    emoji: activityEmoji(b.activity, category),
    category,
    zone: b.zone,
    joined,
    maxPeople,
    startingIn,
    startTimeMs,
    duration: `${b.duration_minutes} min`,
    distance: "-",
    description: "",
    lat,
    lng,
    creator: "?",
    creatorAvatar: "?",
    onCampus: resolveOnCampus(lat, lng),
  };
}

type ViewMode = "map" | "list";
type SortMode = "soonest" | "nearest";

type MapOverlayProps = {
  onClose: () => void;
};

function MapDiscoveryContent({
  onClose,
  sortedBubbles,
  filteredBubbles,
  filteredCount,
  mapZoom,
  setMapZoom,
  joinedIds,
  myBubbleIds,
  joiningId,
  seeding,
  viewMode,
  setViewMode,
  handleJoin,
  handleOpenChat,
  handleSeedDemo,
  mapRef,
  mapOptions,
  zoomToCluster,
  withOffCampusCheck,
  sortMode,
  setSortMode,
  campusFilter,
  onCampusFilterChange,
  onClearFilters,
  showOffCampusToast,
  onDismissOffCampusToast,
  categoryFilter,
  timeFilter,
  onTimeFilterChange,
  hasActiveFilters,
  isLoading,
  onStartSomething,
  authFailed,
  mapsErrorCode,
}: {
  onClose: () => void;
  sortedBubbles: MapBubble[];
  filteredBubbles: MapBubble[];
  filteredCount: number;
  mapZoom: number;
  setMapZoom: (z: number) => void;
  joinedIds: Set<string>;
  myBubbleIds: Set<string>;
  joiningId: string | null;
  seeding: boolean;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  handleJoin: (id: string) => void;
  handleOpenChat: (id: string) => void;
  handleSeedDemo: () => void;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mapOptions: google.maps.MapOptions;
  zoomToCluster: (lat: number, lng: number) => void;
  withOffCampusCheck: (id: string, action: () => void) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  campusFilter: CampusFilterId;
  onCampusFilterChange: (id: CampusFilterId) => void;
  onClearFilters: () => void;
  showOffCampusToast: boolean;
  onDismissOffCampusToast: () => void;
  categoryFilter: CategoryFilterId;
  timeFilter: MapTimeFilter;
  onTimeFilterChange: (next: MapTimeFilter) => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  onStartSomething: () => void;
  authFailed: boolean;
  mapsErrorCode: string | null;
}) {
  const {
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
  } = useMapDiscovery();

  const { theme, toggleTheme } = useMapTheme();
  const { campusMode, resetCampusMode } = useCampusMode();
  const { userLocation, locationStatus } = useUserLocation();
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? undefined;
  const [mapType, setMapType] = useState<MapTypeId>(readStoredMapType);
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  /** The pin the user tapped - drives the "near this event" list. */
  const focusedBubble = useMemo(
    () => (lockedEventId ? filteredBubbles.find((b) => b.id === lockedEventId) ?? null : null),
    [lockedEventId, filteredBubbles]
  );

  const nearbyToFocused = useMemo(() => {
    if (!focusedBubble) return [];
    return filteredBubbles
      .filter((b) => b.id !== focusedBubble.id)
      .map((b) => ({
        bubble: b,
        metres: haversineDistance(focusedBubble.lat, focusedBubble.lng, b.lat, b.lng),
      }))
      .sort((a, b) => a.metres - b.metres);
  }, [focusedBubble, filteredBubbles]);

  const nearbyWithinRadius = useMemo(
    () => nearbyToFocused.filter((n) => n.metres <= NEARBY_RADIUS_M).length,
    [nearbyToFocused]
  );

  // Selecting a pin re-tops the list so the selected event is what you land on.
  useEffect(() => {
    if (focusedBubble) listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [focusedBubble]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyMapDisplayTheme(map, theme, mapId);
  }, [theme, mapId, mapRef]);

  const filteredBubbleKey = useMemo(
    () => filteredBubbles.map((b) => b.id).join(","),
    [filteredBubbles]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !campusMode) return;

    if (campusFilter === "off") {
      applyOffCampusMapView(map, filteredBubbles);
      return;
    }

    if (campusFilter === "on") {
      if (campusMode === "campus") {
        map.setOptions({
          restriction: { latLngBounds: getUwBounds(), strictBounds: false },
          minZoom: 12,
        });
      } else {
        map.setOptions({ restriction: null, minZoom: 11 });
      }
      if (filteredBubbles.length > 0) {
        fitMapToBubbles(map, filteredBubbles, 60);
      } else {
        applyCampusModeToMap(map, campusMode);
      }
      return;
    }

    applyCampusModeToMap(map, campusMode);
  }, [campusFilter, campusMode, filteredBubbleKey, mapRef, filteredBubbles]);

  const toggleMapType = useCallback(() => {
    const next: MapTypeId = mapType === "roadmap" ? "satellite" : "roadmap";
    setMapType(next);
    sessionStorage.setItem(MAP_TYPE_STORAGE_KEY, next);
    mapRef.current?.setMapTypeId(next);
  }, [mapType, mapRef]);

  const recomputeClusters = useCallback(() => {
    const map = mapRef.current;
    if (map && filteredBubbles.length > 0) {
      setClusters(clusterMapBubblesByPixels(filteredBubbles, map));
    } else if (filteredBubbles.length > 0) {
      setClusters(filteredBubbles.map((bubble) => ({ type: "single" as const, bubble })));
    } else {
      setClusters([]);
    }
  }, [filteredBubbles, mapRef]);

  useEffect(() => {
    unlockEvent();
    recomputeClusters();
  }, [recomputeClusters, campusFilter, filteredBubbleKey, unlockEvent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listener = map.addListener("idle", recomputeClusters);
    return () => listener.remove();
  }, [mapRef, recomputeClusters]);

  const themeClass = theme === "light" ? "theme-light" : "theme-dark";

  const renderActivityCard = (bubble: MapBubble, index: number, distanceLabel?: string) => {
    const isAlreadyMember = joinedIds.has(bubble.id) || myBubbleIds.has(bubble.id);
    return (
      <ActivityCard
        key={bubble.id}
        bubble={bubble}
        index={index}
        layout="vertical"
        distanceLabel={distanceLabel}
        isHovered={hoveredEventId === bubble.id}
        isActive={activeEventId === bubble.id || lockedEventId === bubble.id}
        isJoining={joiningId === bubble.id}
        isAlreadyMember={isAlreadyMember}
        onHover={() => setHoveredEventId(bubble.id)}
        onLeave={clearHover}
        onCardClick={() =>
          withOffCampusCheck(bubble.id, () => {
            setViewMode("map");
            focusEvent(bubble.id, { fromClick: true });
          })
        }
        onViewOnMap={() =>
          withOffCampusCheck(bubble.id, () => {
            setViewMode("map");
            focusEvent(bubble.id, { fromClick: true });
          })
        }
        onJoin={() =>
          isAlreadyMember
            ? handleOpenChat(bubble.id)
            : withOffCampusCheck(bubble.id, () => handleJoin(bubble.id))
        }
      />
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${themeClass}`}
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <header
        className="relative z-30 flex shrink-0 items-center justify-between border-b px-4 h-14"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bar-bg)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Discover
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCampusMode}
            className="text-[11px] transition hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            Change
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="map-header-btn"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMapType}
              className={`map-header-btn gap-1.5 px-2.5 text-xs font-medium ${
                mapType === "satellite" ? "map-header-btn--satellite-active" : ""
              }`}
              style={{ width: 90 }}
              aria-label={mapType === "satellite" ? "Switch to map view" : "Switch to satellite view"}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              {mapType === "satellite" ? "Map" : "Satellite"}
            </button>
          </div>

          <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: "var(--border-color)" }} />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`map-header-btn ${viewMode === "map" ? "map-header-btn--active" : ""}`}
              style={{ color: viewMode === "map" ? "var(--text-primary)" : "var(--text-muted)" }}
              aria-label="Map view"
            >
              <MapIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`map-header-btn ${viewMode === "list" ? "map-header-btn--active" : ""}`}
              style={{ color: viewMode === "list" ? "var(--text-primary)" : "var(--text-muted)" }}
              aria-label="List view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <MapFilterBar
        campusFilter={campusFilter}
        onCampusFilterChange={onCampusFilterChange}
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        resultCount={filteredCount}
      />

      {/* Desktop: activities sidebar on the left, map on the right (row-reverse
          keeps the map first on mobile, where it stacks above the list). */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row-reverse">
        {/* Map pane */}
        <div
          ref={registerMapContainer}
          className={`relative shrink-0 overflow-hidden map-dark-controls h-[45vh] md:h-[55vh] lg:h-full lg:w-[72%] ${
            viewMode === "list" ? "hidden lg:block" : "block"
          }${process.env.NODE_ENV === "development" ? " map-hide-dev-watermark" : ""}${
            authFailed && theme === "dark" && mapType === "roadmap"
              ? " map-tiles-fallback-dark"
              : ""
          }`}
          style={{ backgroundColor: theme === "light" ? "#f1f5f9" : MAP_BACKGROUND }}
        >
          {authFailed && <MapsAuthNotice errorCode={mapsErrorCode} />}

          <OffCampusFilterToast
            visible={showOffCampusToast}
            onDismiss={onDismissOffCampusToast}
          />

          {campusMode === "explore" && (
            <div
              className="absolute inset-x-0 z-20 px-3 pt-2 pointer-events-none"
              style={{ top: showOffCampusToast ? 36 : 0 }}
            >
              <div
                className="rounded-lg border border-l-[3px] !border-l-amber-400 px-3 py-2 text-xs shadow-sm"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-muted)",
                  borderColor: "var(--border-color)",
                }}
              >
                🌍 Exploring beyond campus · Some events may require travel
              </div>
            </div>
          )}

          <AnimatePresence>
            {isViewChanged && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={resetView}
                className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl transition hover:opacity-90"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bar-btn-bg)",
                  color: "var(--text-muted)",
                }}
                aria-label="Reset map view"
              >
                <Compass className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            mapTypeId={mapType}
            options={mapOptions}
            onClick={() => unlockEvent()}
            onLoad={(map) => {
              mapRef.current = map;
              setMapInstance(map);
              registerMap(map);
              const stored = sessionStorage.getItem(MAP_TYPE_STORAGE_KEY);
              if (stored === "satellite") {
                map.setMapTypeId("satellite");
              }
              applyMapDisplayTheme(map, theme, mapId);
              if (campusMode) {
                if (campusFilter === "off") {
                  applyOffCampusMapView(map, filteredBubbles);
                } else if (campusFilter === "on" && filteredBubbles.length > 0) {
                  if (campusMode === "campus") {
                    map.setOptions({
                      restriction: { latLngBounds: getUwBounds(), strictBounds: false },
                      minZoom: 12,
                    });
                  }
                  fitMapToBubbles(map, filteredBubbles, 60);
                } else {
                  applyCampusModeToMap(map, campusMode);
                }
              }
              google.maps.event.addListenerOnce(map, "idle", () => {
                map.setTilt(45);
              });
              const z = map.getZoom();
              if (z != null) setMapZoom(z);
              recomputeClusters();
            }}
            onZoomChanged={() => {
              const z = mapRef.current?.getZoom();
              if (z != null) setMapZoom(z);
              recomputeClusters();
            }}
          >
            {clusters.map((item, idx) => {
              if (item.type === "cluster") {
                return (
                  <OverlayView
                    key={`${campusFilter}-cluster-${idx}-${item.bubbles.map((b) => b.id).join("-")}`}
                    position={{ lat: item.lat, lng: item.lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(width, height) => ({
                      x: -(width / 2),
                      y: -(height / 2),
                    })}
                  >
                    <div className="map-marker-anchor">
                      <ClusterPill
                        count={item.bubbles.length}
                        onClick={() => zoomToCluster(item.lat, item.lng)}
                      />
                    </div>
                  </OverlayView>
                );
              }

              const bubble = item.bubble;
              const isAlreadyMember = joinedIds.has(bubble.id) || myBubbleIds.has(bubble.id);
              const isLocked = lockedEventId === bubble.id;
              const isExpanded = isLocked || hoveredEventId === bubble.id;

              return (
                <OverlayView
                  key={`${campusFilter}-${bubble.id}`}
                  position={{ lat: bubble.lat, lng: bubble.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(width, height) => ({
                      x: -(width / 2),
                      y: -(height / 2),
                    })}
                  >
                    <div className="map-marker-anchor">
                      <EventPill
                      emoji={bubble.emoji}
                      title={bubble.title}
                      category={bubble.category}
                      zone={bubble.zone ?? "Campus"}
                      lat={bubble.lat}
                      lng={bubble.lng}
                      startingIn={bubble.startingIn}
                      joined={bubble.joined}
                      maxPeople={bubble.maxPeople}
                      floatDelay={(idx % 5) * 0.4}
                      isExpanded={isExpanded}
                      isLocked={isLocked}
                      isHovered={hoveredEventId === bubble.id}
                      isActive={activeEventId === bubble.id}
                      isJoining={joiningId === bubble.id}
                      isAlreadyMember={isAlreadyMember}
                      onHoverStart={() => setHoveredEventId(bubble.id)}
                      onHoverEnd={clearHover}
                      onClose={unlockEvent}
                      onSelect={() =>
                        withOffCampusCheck(bubble.id, () =>
                          focusEvent(bubble.id, { fromClick: true })
                        )
                      }
                      onJoin={() =>
                        isAlreadyMember
                          ? handleOpenChat(bubble.id)
                          : withOffCampusCheck(bubble.id, () => handleJoin(bubble.id))
                      }
                    />
                  </div>
                </OverlayView>
              );
            })}
            {locationStatus === "granted" && userLocation && (
              <UserLocationMarker position={userLocation} />
            )}
          </GoogleMap>

          <AnimatePresence>
            {viewMode === "map" && hasActiveFilters && filteredCount === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4"
              >
                <div
                  className="rounded-full px-4 py-2 text-xs backdrop-blur-md"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-muted)",
                  }}
                >
                  No events match your filters
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {mapInstance && (
            <CampusBoundaryLayer
              map={mapInstance}
              theme={theme}
              mapType={mapType}
            />
          )}
        </div>

        {/* List pane - always visible below map on mobile; left sidebar on desktop */}
        <div
          className="flex min-h-0 flex-1 flex-col border-t lg:w-[28%] lg:min-w-[280px] lg:border-r lg:border-t-0"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-page)" }}
        >
          <div className="px-4 pt-3 pb-1">
            {focusedBubble ? (
              <NearbyFocusHeader
                emoji={focusedBubble.emoji}
                title={focusedBubble.title}
                zone={focusedBubble.zone ?? "Campus"}
                withinCount={nearbyWithinRadius}
                radiusLabel={NEARBY_RADIUS_LABEL}
                onBack={unlockEvent}
              />
            ) : (
              <>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Nearby activities
                </h2>
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  {filteredCount} {filteredCount === 1 ? "event" : "events"}
                  {hasActiveFilters ? " matching filters" : " nearby"} ·{" "}
                  <span style={{ color: "var(--text-faint)" }}>Waterloo, ON</span>
                </p>
                <ActiveFilterSummary
                  campusFilter={campusFilter}
                  categoryFilter={categoryFilter}
                  timeFilter={timeFilter}
                  onClear={onClearFilters}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Sort by:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortMode("soonest")}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: sortMode === "soonest" ? "var(--btn-active-bg)" : "var(--bg-page)",
                      color: sortMode === "soonest" ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    ⏰ Soonest
                  </button>
                  <button
                    type="button"
                    onClick={() => locationStatus === "granted" && setSortMode("nearest")}
                    title={
                      locationStatus !== "granted"
                        ? "Enable location to sort by distance"
                        : undefined
                    }
                    disabled={locationStatus !== "granted"}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: sortMode === "nearest" ? "var(--btn-active-bg)" : "var(--bg-page)",
                      color: sortMode === "nearest" ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    📍 Nearest
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            ref={listScrollRef}
            className="map-events-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-2"
          >
            {isLoading ? (
              <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2 lg:grid-cols-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[150px] animate-pulse rounded-xl"
                    style={{
                      background: "var(--panel-card-bg)",
                      backdropFilter: "var(--panel-card-blur)",
                      border: "1px solid var(--panel-card-border)",
                      borderLeft: "2px solid var(--panel-card-accent)",
                    }}
                  />
                ))}
              </div>
            ) : sortedBubbles.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <span className="text-5xl" aria-hidden>
                  🫧
                </span>
                <p
                  className="font-display mt-4 text-xl font-bold sm:text-2xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {hasActiveFilters
                    ? "No events match your filters"
                    : "Nothing happening nearby right now"}
                </p>
                <p
                  className="mt-2 max-w-xs text-[13px]"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {hasActiveFilters
                    ? "Try loosening your filters or start something new."
                    : "Be the first — start a bubble and others can join."}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onStartSomething}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
                    style={{
                      background: "linear-gradient(135deg, #FF5A36, #E0339E 60%, #8b5cf6)",
                      color: "#ffffff",
                      boxShadow: "0 8px 24px rgba(224,51,158,0.3)",
                    }}
                  >
                    Start Something
                  </button>
                </div>
              </div>
            ) : focusedBubble ? (
              <div className="pb-2">
                {renderActivityCard(focusedBubble, 0)}

                {nearbyToFocused.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pb-1.5 pt-3">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Also nearby
                      </span>
                      <span
                        className="h-px flex-1"
                        style={{ backgroundColor: "var(--border-color)" }}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      {nearbyToFocused.map(({ bubble, metres }, index) =>
                        renderActivityCard(bubble, index, formatDistance(metres))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2 lg:grid-cols-1">
                {sortedBubbles.map((bubble, index) => renderActivityCard(bubble, index))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapDiscoveryUI({ onClose }: MapOverlayProps) {
  const router = useRouter();
  const { filter, setFilter } = useMapFilter();
  const [campusFilter, setCampusFilter] = useState<CampusFilterId>("all");
  const [showOffCampusToast, setShowOffCampusToast] = useState(false);
  const hasShownOffCampusToast = useRef(false);
  const { theme } = useMapTheme();
  const { campusMode, setCampusMode, resetCampusMode } = useCampusMode();
  const { userLocation, locationStatus } = useUserLocation();
  const [sortMode, setSortMode] = useState<SortMode>("soonest");
  const [timeFilter, setTimeFilter] = useState<MapTimeFilter>(DEFAULT_TIME_FILTER);

  const handleClose = useCallback(() => {
    resetCampusMode();
    onClose();
  }, [resetCampusMode, onClose]);
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? undefined;
  const [offCampusWarning, setOffCampusWarning] = useState<{
    title: string;
    zone: string;
    onConfirm: () => void;
  } | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [apiBubbles, setApiBubbles] = useState<ApiBubble[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [myBubbleIds, setMyBubbleIds] = useState<Set<string>>(new Set());
  const [refreshList, setRefreshList] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [listFetched, setListFetched] = useState(false);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [createOpen, setCreateOpen] = useState(false);
  const autoSeedDone = useRef(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { addBubbleConversation } = useConversations();
  const { isGuest, guestResolved } = useGuest();

  useEffect(() => {
    setCampusFilter(readCampusFilterFromUrl());
  }, []);

  const handleCampusFilterChange = useCallback(
    (id: CampusFilterId) => {
      setCampusFilter(id);
      writeMapFiltersToUrl(id, filter);

      if (id === "off") {
        if (!hasShownOffCampusToast.current) {
          setShowOffCampusToast(true);
          hasShownOffCampusToast.current = true;
        }
      } else {
        setShowOffCampusToast(false);
      }
    },
    [filter]
  );

  const handleClearFilters = useCallback(() => {
    setCampusFilter("all");
    setFilter("all");
    setTimeFilter(DEFAULT_TIME_FILTER);
    setShowOffCampusToast(false);
    writeMapFiltersToUrl("all", "all");
  }, [setFilter]);

  const handleDismissOffCampusToast = useCallback(() => {
    setShowOffCampusToast(false);
  }, []);

  useEffect(() => {
    if (!guestResolved) return;
    setListFetched(false);

    // Guests never hit a real Supabase-backed route - the map shows the same
    // curated demo bubbles as Home, reshaped locally (see buildGuestApiBubbles
    // above). No /api/bubbles/list or /api/bubbles/mine call happens at all.
    if (isGuest) {
      setApiBubbles(buildGuestApiBubbles());
      setMyBubbleIds(new Set());
      setListFetched(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token;
      fetch("/api/bubbles/list", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
        .then((r) => r.json())
        .then((d: { success?: boolean; data?: ApiBubble[] }) => {
          if (d?.success && Array.isArray(d.data)) setApiBubbles(d.data);
          setListFetched(true);
        })
        .catch(() => setListFetched(true));

      if (!token) return;
      fetch("/api/bubbles/mine", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: { success?: boolean; data?: { id: string }[] }) => {
          if (d?.success && Array.isArray(d.data)) setMyBubbleIds(new Set(d.data.map((b) => b.id)));
        })
        .catch(() => {});
    });
  }, [refreshList, isGuest, guestResolved]);

  useEffect(() => {
    if (isGuest || !listFetched || apiBubbles.length > 0 || autoSeedDone.current) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token;
      if (cancelled || !token) return;
      autoSeedDone.current = true;
      fetch("/api/seed-demo-bubbles", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;
          if (json?.success) setRefreshList((r) => r + 1);
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [listFetched, apiBubbles.length, isGuest]);

  const mapOptions = useMemo(() => {
    const base = buildMapOptions(mapId);
    const minZoom =
      campusFilter === "off" || campusMode === "explore" ? 11 : 12;
    const withZoom = { ...base, minZoom, backgroundColor: MAP_BACKGROUND };
    // Keep cinematic dark styles unless explicitly in light theme without a cloud mapId
    if (theme === "light" && !mapId) {
      return {
        ...withZoom,
        backgroundColor: "#f1f5f9",
        styles: [] as google.maps.MapTypeStyle[],
      };
    }
    if (!mapId) {
      return { ...withZoom, styles: base.styles ?? DARK_MAP_STYLES };
    }
    return withZoom;
  }, [theme, mapId, campusMode, campusFilter]);

  const { authFailed, errorCode: mapsErrorCode } = useMapsAuthFailure();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const bubblesWithCoords = useMemo(() => {
    const tagOnCampus = (b: MapBubble): MapBubble => ({
      ...b,
      onCampus: resolveOnCampus(b.lat, b.lng, b.onCampus),
    });

    const real =
      apiBubbles.length > 0
        ? apiBubbles
            .map((b) => {
              const coords = ZONE_COORDS[b.zone] ?? DEFAULT_MAP_CENTER;
              return toBubbleForContext(b, coords.lat, coords.lng);
            })
            .filter((b): b is MapBubble => b.lat != null && b.lng != null)
            .map(tagOnCampus)
        : [];
    // Guests only ever see their curated demo set - never padded out with
    // the generic MOCK_MAP_EVENTS filler real users get when the DB is thin.
    if (isGuest) return real;
    if (real.length === 0) return MOCK_MAP_EVENTS.map(tagOnCampus);
    if (real.length >= 10) return real;
    const realIds = new Set(real.map((b) => b.id));
    const extras = MOCK_MAP_EVENTS.filter((m) => !realIds.has(m.id)).map(tagOnCampus);
    return [...real, ...extras].slice(0, Math.max(10, real.length));
  }, [apiBubbles, isGuest]);

  const filteredBubbles = useMemo(
    () =>
      bubblesWithCoords
        .filter((b) => categoryMatchesFilter(b.category, filter))
        .filter((b) => matchesCampusFilter(b.lat, b.lng, campusFilter, b.onCampus))
        .filter((b) => matchesTimeFilter(b, timeFilter)),
    [bubblesWithCoords, filter, campusFilter, timeFilter]
  );

  const hasActiveFilters =
    campusFilter !== "all" || filter !== "all" || isTimeFilterActive(timeFilter);

  const showOffCampusToastEffective =
    showOffCampusToast && campusMode !== "explore";

  const sortedBubbles = useMemo(() => {
    if (sortMode === "nearest" && userLocation && locationStatus === "granted") {
      return sortBubblesByNearest(filteredBubbles, userLocation);
    }
    return sortBubblesBySoonest(filteredBubbles);
  }, [sortMode, filteredBubbles, userLocation, locationStatus]);

  const withOffCampusCheck = useCallback(
    (id: string, action: () => void) => {
      if (campusMode !== "campus") {
        action();
        return;
      }
      const bubble =
        filteredBubbles.find((b) => b.id === id) ??
        bubblesWithCoords.find((b) => b.id === id);
      if (!bubble || isOnCampus(bubble.lat, bubble.lng)) {
        action();
        return;
      }
      setOffCampusWarning({
        title: bubble.title,
        zone: bubble.zone ?? "Off campus",
        onConfirm: () => {
          setOffCampusWarning(null);
          action();
        },
      });
    },
    [campusMode, filteredBubbles, bubblesWithCoords]
  );

  const handleJoin = useCallback(
    async (id: string) => {
      if (isGuest) {
        toast("Create a free account to start your own bubble", {
          action: { label: "Sign Up", onClick: () => router.push("/login") },
        });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        toast.error("Sign in to join a bubble");
        return;
      }

      let realBubbleId = id;
      let bubbleForContext: MapBubble;

      if (MOCK_EVENT_IDS.has(id)) {
        const mockBubble = getMockEventById(id);
        if (!mockBubble) return;
        if (mockBubble.joined >= mockBubble.maxPeople) {
          toast.error("This bubble is full");
          return;
        }
        setJoiningId(id);
        try {
          const seedRes = await fetch("/api/seed-demo-bubbles", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const seedJson = await seedRes.json().catch(() => ({}));
          if (!seedRes.ok || !seedJson.success || !Array.isArray(seedJson.bubble_ids)) {
            toast.error(seedJson.error ?? "Could not create bubbles");
            return;
          }
          const mockIndex = MOCK_MAP_EVENTS.findIndex((m) => m.id === id);
          realBubbleId = (seedJson.bubble_ids[mockIndex] ?? seedJson.bubble_ids[0]) ?? "";
          if (!realBubbleId || typeof realBubbleId !== "string") {
            toast.error("Could not create bubble. Try again.");
            return;
          }
          bubbleForContext = { ...mockBubble, id: realBubbleId, joined: mockBubble.joined + 1 };
          addBubbleConversation(bubbleForContext);
          onClose();
          router.push("/messages");
          router.push(`/chat/bubble-${realBubbleId}`);
        } catch {
          toast.error("Something went wrong");
        } finally {
          setJoiningId(null);
        }
        return;
      }

      if (id.startsWith("demo-")) {
        const demoIndex = parseInt(id.replace("demo-", ""), 10);
        if (isNaN(demoIndex) || demoIndex < 0 || demoIndex >= DEMO_BUBBLES.length) return;
        const demoBubble = DEMO_BUBBLES[demoIndex];
        if (!demoBubble) return;
        setJoiningId(id);
        try {
          const seedRes = await fetch("/api/seed-demo-bubbles", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const seedJson = await seedRes.json().catch(() => ({}));
          if (!seedRes.ok || !seedJson.success || !Array.isArray(seedJson.bubble_ids)) {
            toast.error(seedJson.error ?? "Could not create bubbles");
            return;
          }
          realBubbleId = (seedJson.bubble_ids[demoIndex] ?? seedJson.bubble_ids[0]) ?? "";
          if (!realBubbleId || typeof realBubbleId !== "string") {
            toast.error("Could not create bubble. Try again.");
            return;
          }
          bubbleForContext = { ...demoBubble, id: realBubbleId, joined: 2 };
          addBubbleConversation(bubbleForContext);
          onClose();
          router.push("/messages");
          router.push(`/chat/bubble-${realBubbleId}`);
        } catch {
          toast.error("Something went wrong");
        } finally {
          setJoiningId(null);
        }
        return;
      }

      const bubble = apiBubbles.find((b) => b.id === id);
      if (!bubble) return;
      setJoiningId(id);
      try {
        const res = await fetch("/api/bubbles/join", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bubble_id: id }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error ?? "Could not join");
          return;
        }
        const membersCount =
          typeof data?.data?.members_count === "number"
            ? data.data.members_count
            : (bubble.members_count ?? 0) + 1;
        const coords = ZONE_COORDS[bubble.zone] ?? DEFAULT_MAP_CENTER;
        bubbleForContext = toBubbleForContext(
          { ...bubble, members_count: membersCount },
          coords.lat,
          coords.lng
        );
        addBubbleConversation(bubbleForContext);
        setJoinedIds((prev) => new Set(prev).add(id));
        onClose();
        router.push("/messages");
        router.push(`/chat/bubble-${id}`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setJoiningId(null);
      }
    },
    [apiBubbles, addBubbleConversation, onClose, router, isGuest]
  );

  const handleOpenChat = useCallback(
    (id: string) => {
      if (isGuest) {
        toast("Create a free account to start your own bubble", {
          action: { label: "Sign Up", onClick: () => router.push("/login") },
        });
        return;
      }
      const mockBubble = getMockEventById(id);
      if (mockBubble) {
        addBubbleConversation(mockBubble);
        onClose();
        router.push("/messages");
        router.push(`/chat/bubble-${id}`);
        return;
      }
      const apiBubble = apiBubbles.find((b) => b.id === id);
      if (!apiBubble) return;
      const coords = ZONE_COORDS[apiBubble.zone] ?? DEFAULT_MAP_CENTER;
      const bubbleForContext = toBubbleForContext(apiBubble, coords.lat, coords.lng);
      addBubbleConversation(bubbleForContext);
      onClose();
      router.push("/messages");
      router.push(`/chat/bubble-${id}`);
    },
    [apiBubbles, addBubbleConversation, onClose, router, isGuest]
  );

  const handleSeedDemo = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      toast.error("Sign in to create sample bubbles");
      return;
    }
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-demo-bubbles", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to create sample bubbles");
        return;
      }
      toast.success("Sample bubbles created. Refreshing…");
      setRefreshList((r) => r + 1);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSeeding(false);
    }
  }, []);

  const zoomToCluster = useCallback((lat: number, lng: number) => {
    mapRef.current?.panTo({ lat, lng });
    const next = Math.min((mapRef.current?.getZoom() ?? mapZoom) + 2, 18);
    mapRef.current?.setZoom(next);
    setMapZoom(next);
  }, [mapZoom]);

  const themeClass = theme === "light" ? "theme-light" : "theme-dark";

  if (loadError) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${themeClass}`}
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div
          className="max-w-md rounded-2xl border p-8 text-center backdrop-blur-xl"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <p className="font-medium text-red-400">Error loading map</p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {loadError.message ||
              "Could not load the Google Maps script. Confirm NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, billing is enabled on the Cloud project, and the Maps JavaScript API is turned on."}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-page)" }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!campusMode) {
    return <CampusModeModal onSelect={setCampusMode} themeClass={themeClass} />;
  }

  if (!isLoaded) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${themeClass}`}
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>
          Loading map…
        </div>
      </div>
    );
  }

  return (
    <MapDiscoveryProvider bubbles={filteredBubbles} onZoomChanged={setMapZoom}>
      <MapDiscoveryContent
        onClose={handleClose}
        sortedBubbles={sortedBubbles}
        filteredBubbles={filteredBubbles}
        filteredCount={filteredBubbles.length}
        mapZoom={mapZoom}
        setMapZoom={setMapZoom}
        joinedIds={joinedIds}
        myBubbleIds={myBubbleIds}
        joiningId={joiningId}
        seeding={seeding}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleJoin={handleJoin}
        handleOpenChat={handleOpenChat}
        handleSeedDemo={handleSeedDemo}
        mapRef={mapRef}
        mapOptions={mapOptions}
        zoomToCluster={zoomToCluster}
        withOffCampusCheck={withOffCampusCheck}
        sortMode={sortMode}
        setSortMode={setSortMode}
        campusFilter={campusFilter}
        onCampusFilterChange={handleCampusFilterChange}
        onClearFilters={handleClearFilters}
        showOffCampusToast={showOffCampusToastEffective}
        onDismissOffCampusToast={handleDismissOffCampusToast}
        categoryFilter={filter}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        hasActiveFilters={hasActiveFilters}
        authFailed={authFailed}
        mapsErrorCode={mapsErrorCode}
        isLoading={!listFetched}
        onStartSomething={() => {
          if (isGuest) {
            toast("Create a free account to start your own bubble", {
              action: { label: "Sign Up", onClick: () => router.push("/login") },
            });
            return;
          }
          setCreateOpen(true);
        }}
      />
      <OffCampusWarningDialog
        open={!!offCampusWarning}
        title={offCampusWarning?.title ?? ""}
        zone={offCampusWarning?.zone ?? ""}
        themeClass={themeClass}
        onConfirm={() => offCampusWarning?.onConfirm()}
        onCancel={() => setOffCampusWarning(null)}
      />
      <CreateBubbleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setRefreshList((r) => r + 1);
        }}
      />
    </MapDiscoveryProvider>
  );
}

function MapOverlayInner(props: MapOverlayProps) {
  return <MapDiscoveryUI {...props} />;
}

export default function MapOverlay(props: MapOverlayProps) {
  return (
    <MapThemeProvider>
      <CampusModeProvider>
        <UserLocationProvider>
          <MapFilterProvider>
            <MapOverlayInner {...props} />
          </MapFilterProvider>
        </UserLocationProvider>
      </CampusModeProvider>
    </MapThemeProvider>
  );
}
