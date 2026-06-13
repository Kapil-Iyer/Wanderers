const UW_CAMPUS_BOUNDARY = [
  { lat: 43.4792, lng: -80.5566 },
  { lat: 43.4792, lng: -80.5432 },
  { lat: 43.4778, lng: -80.5332 },
  { lat: 43.4730, lng: -80.5310 },
  { lat: 43.4685, lng: -80.5322 },
  { lat: 43.4658, lng: -80.5360 },
  { lat: 43.4650, lng: -80.5430 },
  { lat: 43.4652, lng: -80.5510 },
  { lat: 43.4670, lng: -80.5566 },
  { lat: 43.4740, lng: -80.5580 },
  { lat: 43.4792, lng: -80.5566 },
];

export function isOnCampus(lat: number, lng: number): boolean {
  const polygon = UW_CAMPUS_BOUNDARY;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type CampusFilterId = "all" | "on" | "off";

/** Resolve onCampus from tag or coordinates. */
export function resolveOnCampus(
  lat: number,
  lng: number,
  onCampus?: boolean
): boolean {
  return onCampus ?? isOnCampus(lat, lng);
}

export function matchesCampusFilter(
  lat: number,
  lng: number,
  campusFilter: CampusFilterId,
  onCampus?: boolean
): boolean {
  if (campusFilter === "all") return true;
  const onCampusVal = resolveOnCampus(lat, lng, onCampus);
  return campusFilter === "on" ? onCampusVal : !onCampusVal;
}
