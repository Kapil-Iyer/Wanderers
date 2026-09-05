/**
 * Premium cinematic dark map style — warm-plum ink canvas matching the app's
 * Ember Aurora palette, so the map recedes behind activity cards and markers.
 *
 * Detail parity with light mode is deliberate: streets, street names, building
 * footprints, parks and transit all stay visible so the map is navigable. What
 * stays hidden is only POI/transit *icons*, since Google's coloured glyphs
 * compete with the event markers that are meant to be the focal point.
 */
export const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f0a14" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a7597" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0710" }] },

  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#0f0a14" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2c1c33" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b199bf" }, { visibility: "on" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a7597" }, { visibility: "on" }],
  },

  // Building footprints — the blocks that make campus legible at high zoom.
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#181020" }, { visibility: "on" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a1c34" }, { visibility: "on" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: "#110c17" }],
  },

  {
    featureType: "poi",
    elementType: "geometry.fill",
    stylers: [{ color: "#1a1123" }, { visibility: "on" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b7898" }, { visibility: "on" }],
  },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#12211b" }, { visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#71947f" }],
  },
  {
    featureType: "poi.school",
    elementType: "geometry.fill",
    stylers: [{ color: "#1c1226" }],
  },

  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#241730" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0b0710" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9c88a9" }, { visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0b0710" }],
  },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#3a2442" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0b0710" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c0acca" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#2a1a35" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#1e1428" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b7898" }],
  },

  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#2b1d36" }, { visibility: "on" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#20152a" }, { visibility: "on" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7d6b8a" }],
  },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#0a1220" }],
  },
  {
    featureType: "water",
    elementType: "geometry.stroke",
    stylers: [{ color: "#16203a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4d6480" }],
  },
];

/** Ink base behind tiles — prevents a white flash before the first paint. */
export const MAP_BACKGROUND = "#0b0710";

/** Base options shared by both raster and vector (mapId) modes */
const MAP_OPTIONS_BASE: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  rotateControl: true,
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  clickableIcons: false,
  keyboardShortcuts: false,
  gestureHandling: "greedy",
  minZoom: 10,
  maxZoom: 20,
  tilt: 45,
  heading: 0,
  backgroundColor: MAP_BACKGROUND,
};

/**
 * A cloud `mapId` switches Maps to the vector renderer, which ignores the
 * `styles` array and themes from Google Cloud Console instead — that made the
 * map render in Google's default light palette. We keep the raster renderer so
 * DARK_MAP_STYLES always applies; set NEXT_PUBLIC_GOOGLE_MAPS_USE_CLOUD_STYLE
 * to "true" only once a dark style is published to that map ID.
 */
export function buildMapOptions(mapId?: string): google.maps.MapOptions {
  const useCloudStyle =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_USE_CLOUD_STYLE === "true";
  if (mapId && useCloudStyle) {
    return { ...MAP_OPTIONS_BASE, mapId };
  }
  return { ...MAP_OPTIONS_BASE, styles: DARK_MAP_STYLES };
}

// Kept for backwards-compat with any direct import; resolved at module load time
export const MAP_OPTIONS: google.maps.MapOptions = buildMapOptions(
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? undefined)
    : undefined
);

/** Apply dark custom styles or reset to default light Google Maps tiles. */
export function applyMapDisplayTheme(
  map: google.maps.Map,
  theme: "dark" | "light",
  _mapId?: string
) {
  map.setOptions({ styles: theme === "light" ? [] : DARK_MAP_STYLES });
}
