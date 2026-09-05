"use client";

import dynamic from "next/dynamic";
import { useMapOverlay } from "@/contexts/MapOverlayContext";

const CHUNK_RETRY_KEY = "wanderers-map-chunk-retry";

function isStaleChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("is not a function") ||
    error.message.includes("MODULE_NOT_FOUND")
  );
}

function importMapOverlay() {
  return import("./MapOverlay").catch((error: unknown) => {
    if (isStaleChunkError(error) && typeof window !== "undefined" && !sessionStorage.getItem(CHUNK_RETRY_KEY)) {
      sessionStorage.setItem(CHUNK_RETRY_KEY, "1");
      window.location.reload();
      return new Promise<typeof import("./MapOverlay")>(() => {});
    }
    sessionStorage.removeItem(CHUNK_RETRY_KEY);
    throw error;
  });
}

const MapOverlay = dynamic(() => importMapOverlay(), { ssr: false });

export default function MapOverlayClient() {
  const ctx = useMapOverlay();
  if (!ctx || !ctx.isOpen) return null;
  return <MapOverlay onClose={ctx.closeMap} focusTarget={ctx.focusTarget} />;
}
