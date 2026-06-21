"use client";

import { OverlayView } from "@react-google-maps/api";
import type { UserCoords } from "@/contexts/UserLocationContext";

type UserLocationMarkerProps = {
  position: UserCoords;
};

export default function UserLocationMarker({ position }: UserLocationMarkerProps) {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_LAYER}
      getPixelPositionOffset={() => ({ x: -12, y: -12 })}
    >
      <div className="user-location-marker pointer-events-none" aria-hidden>
        <span className="user-location-marker__ping" />
        <span className="user-location-marker__dot" />
      </div>
    </OverlayView>
  );
}
