"use client";

import { useEffect, useRef } from "react";
import {
  createCampusBoundaryPolygon,
  createCampusLabelMarker,
  getCampusLabelColor,
  getCampusPolygonStyle,
} from "@/lib/campusBounds";

type CampusBoundaryLayerProps = {
  map: google.maps.Map;
  theme: "dark" | "light";
  mapType: "roadmap" | "satellite";
};

export default function CampusBoundaryLayer({
  map,
  theme,
  mapType,
}: CampusBoundaryLayerProps) {
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const labelRef = useRef<google.maps.Marker | null>(null);
  const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    const style = getCampusPolygonStyle(theme, mapType);
    polygonRef.current = createCampusBoundaryPolygon(map, style);
    labelRef.current = createCampusLabelMarker(map, theme, mapType);

    const updateLabelVisibility = () => {
      const zoom = map.getZoom() ?? 0;
      labelRef.current?.setVisible(zoom >= 13);
    };
    updateLabelVisibility();
    zoomListenerRef.current = map.addListener("zoom_changed", updateLabelVisibility);

    return () => {
      zoomListenerRef.current?.remove();
      zoomListenerRef.current = null;
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      polygonRef.current?.setMap(null);
      labelRef.current?.setMap(null);
      polygonRef.current = null;
      labelRef.current = null;
    };
  }, [map, theme, mapType]);

  useEffect(() => {
    const style = getCampusPolygonStyle(theme, mapType);
    polygonRef.current?.setOptions({
      strokeColor: style.strokeColor,
      strokeWeight: style.strokeWeight,
      fillColor: style.fillColor,
      fillOpacity: style.fillOpacity,
      strokeOpacity: style.strokeOpacity,
    });

    const color = getCampusLabelColor(theme, mapType);
    labelRef.current?.setOptions({
      label: {
        text: "University of Waterloo",
        color,
        fontFamily: "Inter, sans-serif",
        fontSize: "11px",
        fontWeight: "600",
      },
    });
  }, [theme, mapType]);

  useEffect(() => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }

    const style = getCampusPolygonStyle(theme, mapType);
    const shouldPulse = theme === "dark" && mapType === "roadmap";

    if (!shouldPulse) {
      polygonRef.current?.setOptions({ strokeOpacity: style.strokeOpacity });
      return;
    }

    let opacity = 0.9;
    let direction = -1;
    pulseIntervalRef.current = setInterval(() => {
      opacity += direction * 0.015;
      if (opacity <= 0.5) direction = 1;
      if (opacity >= 0.9) direction = -1;
      polygonRef.current?.setOptions({ strokeOpacity: opacity });
    }, 50);

    return () => {
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    };
  }, [theme, mapType]);

  return null;
}
