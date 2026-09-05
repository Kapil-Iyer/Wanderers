/** UW campus lock bounds - SW / NE corners */
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
  _theme: "dark" | "light",
  _mapType: "roadmap" | "satellite"
): CampusPolygonStyle {
  // Ember Aurora boundary — brand magenta frame, not a debug overlay.
  // Google Maps needs hex colors plus separate opacity; rgba() floods the shape.
  return {
    strokeColor: "#E0339E",
    strokeOpacity: 0.6,
    strokeWeight: 1.5,
    fillColor: "#E0339E",
    fillOpacity: 0.05,
  };
}

export function getCampusLabelColor(
  _theme: "dark" | "light",
  _mapType: "roadmap" | "satellite"
): string {
  return "#E0339E";
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
