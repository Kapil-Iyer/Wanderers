import type { MapBubble } from "@/lib/mapClustering";
import { haversineDistance } from "@/lib/distance";

/** Parse human-readable "startingIn" strings into minutes for sorting. */
export function parseStartingInMinutes(startingIn: string): number {
  const minMatch = startingIn.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  const hrMatch = startingIn.match(/(\d+)\s*hr/i);
  if (hrMatch) return parseInt(hrMatch[1], 10) * 60;
  if (/today|now|soon/i.test(startingIn)) return 0;
  return 500;
}

export function bubbleSortMinutes(bubble: MapBubble): number {
  if (bubble.startTimeMs != null) {
    return Math.max(0, bubble.startTimeMs - Date.now());
  }
  return parseStartingInMinutes(bubble.startingIn) * 60_000;
}

export function sortBubblesBySoonest(bubbles: MapBubble[]): MapBubble[] {
  return [...bubbles].sort((a, b) => bubbleSortMinutes(a) - bubbleSortMinutes(b));
}

export function sortBubblesByNearest(
  bubbles: MapBubble[],
  origin: { lat: number; lng: number }
): MapBubble[] {
  return [...bubbles].sort(
    (a, b) =>
      haversineDistance(origin.lat, origin.lng, a.lat, a.lng) -
      haversineDistance(origin.lat, origin.lng, b.lat, b.lng)
  );
}
