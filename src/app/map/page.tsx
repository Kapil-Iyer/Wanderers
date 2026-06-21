"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMapOverlay } from "@/contexts/MapOverlayContext";

/**
 * /map route: redirect to home and open the map overlay
 * so the map appears as a card on top of the existing UI.
 */
export default function MapPage() {
  const router = useRouter();
  const mapOverlay = useMapOverlay();

  useEffect(() => {
    if (mapOverlay) {
      mapOverlay.openMap();
      router.replace(`/home${window.location.search}`);
    }
  }, [router, mapOverlay]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Opening map…</div>
    </div>
  );
}
