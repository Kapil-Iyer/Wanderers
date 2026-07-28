/** University of Waterloo - centered on main campus quad */
export const DEFAULT_MAP_CENTER = { lat: 43.4722, lng: -80.5454 };
export const DEFAULT_MAP_ZOOM = 16;
/**
 * Initial fit-bounds for the map view.
 * Covers UW main campus + the surrounding Waterloo neighbourhood
 * (Columbia St to the north, King/Erb corridor to the east, uptown Waterloo).
 */
export const CAMPUS_BOUNDS = {
  north: 43.484,
  south: 43.460,
  east:  -80.522,
  west:  -80.563,
} as const;
export const FOCUS_MAP_ZOOM = 17;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Smooth pan + zoom; returns cancel function. Prefers moveCamera when available. */
export function animateMapCamera(
  map: google.maps.Map,
  center: google.maps.LatLngLiteral,
  zoom: number,
  durationMs = 400
): () => void {
  const moveCamera = (
    map as google.maps.Map & { moveCamera?: (opts: google.maps.CameraOptions) => void }
  ).moveCamera;

  if (typeof moveCamera === "function") {
    moveCamera.call(map, { center, zoom });
    return () => {};
  }

  let cancelled = false;
  const startCenter = map.getCenter();
  const startLat = startCenter?.lat() ?? center.lat;
  const startLng = startCenter?.lng() ?? center.lng;
  const startZoom = map.getZoom() ?? DEFAULT_MAP_ZOOM;
  const startTime = performance.now();

  const tick = (now: number) => {
    if (cancelled) return;
    const t = Math.min((now - startTime) / durationMs, 1);
    const eased = easeOutCubic(t);
    map.setCenter({
      lat: startLat + (center.lat - startLat) * eased,
      lng: startLng + (center.lng - startLng) * eased,
    });
    map.setZoom(startZoom + (zoom - startZoom) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
  };
}

/** Fit the map to show all given event markers. */
export function fitMapToBubbles(
  map: google.maps.Map,
  bubbles: Array<{ lat: number; lng: number }>,
  padding: number | google.maps.Padding = 80
): void {
  if (bubbles.length === 0) return;
  if (bubbles.length === 1) {
    animateMapCamera(map, { lat: bubbles[0].lat, lng: bubbles[0].lng }, 14);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  for (const b of bubbles) bounds.extend({ lat: b.lat, lng: b.lng });
  map.fitBounds(bounds, padding);
}

/** Wider view for off-campus events (campus + uptown Waterloo). */
export function applyOffCampusMapView(
  map: google.maps.Map,
  bubbles: Array<{ lat: number; lng: number }>
): void {
  map.setOptions({ restriction: null, minZoom: 11 });
  const withCampusAnchor = [
    ...bubbles,
    { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng },
  ];
  if (bubbles.length > 0) {
    fitMapToBubbles(map, withCampusAnchor, 80);
    return;
  }
  const bounds = new google.maps.LatLngBounds(
    { lat: CAMPUS_BOUNDS.south, lng: CAMPUS_BOUNDS.west },
    { lat: CAMPUS_BOUNDS.north, lng: CAMPUS_BOUNDS.east }
  );
  map.fitBounds(bounds, 60);
}

export function isMapViewAtDefault(
  map: google.maps.Map,
  tolerance = 0.0008
): boolean {
  const c = map.getCenter();
  if (!c) return true;
  const z = map.getZoom() ?? DEFAULT_MAP_ZOOM;
  return (
    Math.abs(c.lat() - DEFAULT_MAP_CENTER.lat) < tolerance &&
    Math.abs(c.lng() - DEFAULT_MAP_CENTER.lng) < tolerance &&
    Math.abs(z - DEFAULT_MAP_ZOOM) < 0.5
  );
}
