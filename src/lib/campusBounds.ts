/** UW campus lock bounds — SW / NE corners */
export const UW_BOUNDS_SW = { lat: 43.4660, lng: -80.5560 };
export const UW_BOUNDS_NE = { lat: 43.4780, lng: -80.5330 };

/** Real UW campus perimeter tracing King St / Columbia St / University Ave */
export const UW_CAMPUS_BOUNDARY = [
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

/** @deprecated Use UW_CAMPUS_BOUNDARY */
export const UW_CAMPUS_POLYGON = UW_CAMPUS_BOUNDARY;

export const UW_CAMPUS_LABEL_CENTER = { lat: 43.4718, lng: -80.5449 };

export type CampusPolygonStyle = {
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  fillColor: string;
  fillOpacity: number;
};

export function getCampusPolygonStyle(
  theme: "dark" | "light",
  mapType: "roadmap" | "satellite"
): CampusPolygonStyle {
  if (mapType === "satellite") {
    return {
      strokeColor: "#a5b4fc",
      strokeOpacity: 1.0,
      strokeWeight: 3,
      fillColor: "#a5b4fc",
      fillOpacity: 0.04,
    };
  }
  if (theme === "light") {
    return {
      strokeColor: "#4f46e5",
      strokeOpacity: 0.85,
      strokeWeight: 2.5,
      fillColor: "#4f46e5",
      fillOpacity: 0.04,
    };
  }
  return {
    strokeColor: "#6366f1",
    strokeOpacity: 0.9,
    strokeWeight: 2.5,
    fillColor: "#6366f1",
    fillOpacity: 0.04,
  };
}

export function getCampusLabelColor(
  theme: "dark" | "light",
  mapType: "roadmap" | "satellite"
): string {
  if (mapType === "satellite") return "#c7d2fe";
  if (theme === "light") return "#4f46e5";
  return "#6366f1";
}

export const CAMPUS_MODE_CENTER = { lat: 43.4723, lng: -80.5449 };
export const CAMPUS_MODE_ZOOM = 15;
export const EXPLORE_MODE_CENTER = { lat: 43.4516, lng: -80.4985 };
export const EXPLORE_MODE_ZOOM = 13;

export type CampusMode = "campus" | "explore";

/** True when coordinates fall inside the UW campus bounding box. */
export function isOnCampus(lat: number, lng: number): boolean {
  return (
    lat >= UW_BOUNDS_SW.lat &&
    lat <= UW_BOUNDS_NE.lat &&
    lng >= UW_BOUNDS_SW.lng &&
    lng <= UW_BOUNDS_NE.lng
  );
}

export function getUwBounds(): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(UW_BOUNDS_SW, UW_BOUNDS_NE);
}

export function applyCampusModeToMap(map: google.maps.Map, mode: CampusMode): void {
  if (mode === "campus") {
    map.setOptions({
      restriction: {
        latLngBounds: getUwBounds(),
        strictBounds: false,
      },
      minZoom: 12,
    });
    map.setCenter(CAMPUS_MODE_CENTER);
    map.setZoom(CAMPUS_MODE_ZOOM);
  } else {
    map.setOptions({
      restriction: null,
      minZoom: 11,
    });
    map.setCenter(EXPLORE_MODE_CENTER);
    map.setZoom(EXPLORE_MODE_ZOOM);
  }
}

export function createCampusBoundaryPolygon(
  map: google.maps.Map,
  style: CampusPolygonStyle
): google.maps.Polygon {
  return new google.maps.Polygon({
    paths: UW_CAMPUS_BOUNDARY,
    strokeColor: style.strokeColor,
    strokeOpacity: style.strokeOpacity,
    strokeWeight: style.strokeWeight,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
    map,
    clickable: false,
    zIndex: 1,
  });
}

export function createCampusLabelMarker(
  map: google.maps.Map,
  theme: "dark" | "light",
  mapType: "roadmap" | "satellite"
): google.maps.Marker {
  const color = getCampusLabelColor(theme, mapType);
  return new google.maps.Marker({
    position: UW_CAMPUS_LABEL_CENTER,
    map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 0,
    },
    label: {
      text: "University of Waterloo",
      color,
      fontFamily: "Inter, sans-serif",
      fontSize: "11px",
      fontWeight: "600",
    },
    clickable: false,
    zIndex: 2,
  });
}
