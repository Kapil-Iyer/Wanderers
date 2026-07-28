/**
 * Professional dark map style for Waterloo, ON.
 * Roads are legible, parks and schools visible, business clutter hidden.
 * Palette: deep navy base, slate road labels, teal-tinted accent on highways.
 */
export const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // ── Base geometry ──────────────────────────────────────────────
  { elementType: "geometry", stylers: [{ color: "#0d1018" }] },

  // ── Labels: icons off, text subtle by default ──────────────────
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3d4560" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d14" }] },

  // ── Administrative ─────────────────────────────────────────────
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#181c28" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.province", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Show city name (e.g. "Waterloo") at low zoom
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#6b7a9e" }] },

  // ── Landscape ──────────────────────────────────────────────────
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#10131e" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#121620" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#0c1016" }] },
  { featureType: "landscape", elementType: "labels", stylers: [{ visibility: "off" }] },

  // ── POI - mostly hidden; parks & schools shown ─────────────────
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  // Parks: dark green fill + subtle label
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#0d1d13" }] },
  { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "on" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3a6349" }] },
  // Schools/university: dark indigo fill + slate label (UW buildings show up nicely)
  { featureType: "poi.school", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#131826" }] },
  { featureType: "poi.school", elementType: "labels.text", stylers: [{ visibility: "on" }] },
  { featureType: "poi.school", elementType: "labels.text.fill", stylers: [{ color: "#4d5e8e" }] },

  // ── Roads ──────────────────────────────────────────────────────
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#181e2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#10141e" }] },
  // Local roads - visible but dim; you can read street names
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#3a4460" }] },
  // Arterials (University Ave, King St, Columbia St) - more prominent
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#1c2538" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#5a6b90" }] },
  // Highways - brightest roads
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#212e44" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#162034" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#7a90b8" }] },

  // ── Transit - lines visible, station labels on ─────────────────
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#1a2440" }] },
  { featureType: "transit.station", elementType: "labels.text", stylers: [{ visibility: "on" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#49587e" }] },

  // ── Water ──────────────────────────────────────────────────────
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#07090f" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#18233a" }] },
];

/** Base options shared by both raster and vector (mapId) modes */
const MAP_OPTIONS_BASE: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  rotateControl: true,        // lets users orbit the 3D view
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
};

/**
 * When NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID is set the map uses Google's vector
 * renderer which gives real 3D building extrusions. The `styles` array is
 * ignored in vector mode - use Google Cloud Console Map Style to theme it.
 *
 * When no mapId is present we fall back to the raster renderer + dark styles.
 */
export function buildMapOptions(mapId?: string): google.maps.MapOptions {
  if (mapId) {
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
  mapId?: string
) {
  if (theme === "light") {
    map.setOptions({ styles: [] });
  } else if (!mapId) {
    map.setOptions({ styles: DARK_MAP_STYLES });
  }
}
