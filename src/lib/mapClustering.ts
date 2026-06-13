import type { Bubble } from "@/lib/mockData";

export type MapBubble = Bubble & {
  lat: number;
  lng: number;
  startTimeMs?: number;
  onCampus?: boolean;
};

export type MapCluster =
  | { type: "single"; bubble: MapBubble }
  | { type: "cluster"; bubbles: MapBubble[]; lat: number; lng: number };

const CLUSTER_PIXEL_THRESHOLD = 60;

function latLngToWorldPixel(
  projection: google.maps.Projection,
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const point = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
  if (!point) return { x: 0, y: 0 };
  const scale = Math.pow(2, zoom);
  return { x: point.x * scale, y: point.y * scale };
}

function pixelDistance(
  projection: google.maps.Projection,
  a: MapBubble,
  b: MapBubble,
  zoom: number
): number {
  const pa = latLngToWorldPixel(projection, a.lat, a.lng, zoom);
  const pb = latLngToWorldPixel(projection, b.lat, b.lng, zoom);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/** Cluster markers within ~60px on screen using Maps projection */
export function clusterMapBubblesByPixels(
  bubbles: MapBubble[],
  map: google.maps.Map,
  thresholdPx = CLUSTER_PIXEL_THRESHOLD
): MapCluster[] {
  if (bubbles.length <= 1) {
    return bubbles.map((bubble) => ({ type: "single", bubble }));
  }

  const projection = map.getProjection();
  const zoom = map.getZoom() ?? 16;
  if (!projection) {
    return bubbles.map((bubble) => ({ type: "single", bubble }));
  }

  const used = new Set<string>();
  const result: MapCluster[] = [];

  for (const b of bubbles) {
    if (used.has(b.id)) continue;

    const group = bubbles.filter(
      (other) =>
        !used.has(other.id) &&
        pixelDistance(projection, b, other, zoom) <= thresholdPx
    );

    if (group.length > 1) {
      group.forEach((g) => used.add(g.id));
      const lat = group.reduce((s, g) => s + g.lat, 0) / group.length;
      const lng = group.reduce((s, g) => s + g.lng, 0) / group.length;
      result.push({ type: "cluster", bubbles: group, lat, lng });
    } else {
      used.add(b.id);
      result.push({ type: "single", bubble: b });
    }
  }

  return result;
}

/** Fallback lat/lng clustering when map instance is unavailable */
export function clusterMapBubbles(bubbles: MapBubble[], zoom: number, clusterZoom = 15): MapCluster[] {
  if (zoom >= clusterZoom || bubbles.length <= 1) {
    return bubbles.map((bubble) => ({ type: "single", bubble }));
  }

  const threshold = 0.00035 * Math.pow(2, clusterZoom - zoom);
  const used = new Set<string>();
  const result: MapCluster[] = [];

  for (const b of bubbles) {
    if (used.has(b.id)) continue;

    const group = bubbles.filter(
      (other) =>
        !used.has(other.id) &&
        Math.abs(other.lat - b.lat) <= threshold &&
        Math.abs(other.lng - b.lng) <= threshold
    );

    if (group.length > 1) {
      group.forEach((g) => used.add(g.id));
      const lat = group.reduce((s, g) => s + g.lat, 0) / group.length;
      const lng = group.reduce((s, g) => s + g.lng, 0) / group.length;
      result.push({ type: "cluster", bubbles: group, lat, lng });
    } else {
      used.add(b.id);
      result.push({ type: "single", bubble: b });
    }
  }

  return result;
}
