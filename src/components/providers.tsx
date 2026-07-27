"use client";

/**
 * PROVIDERS - App-wide context providers
 * -----------------------------------------------------------------------------
 * Order: QueryClient > Tooltip > Conversations > Connections > ProfileOverlay > MapOverlay
 * All data contexts wrap the app. See each context file for API integration notes.
 * -----------------------------------------------------------------------------
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MapOverlayProvider } from "@/contexts/MapOverlayContext";
import { ConversationsProvider } from "@/contexts/ConversationsContext";
import { ProfileOverlayProvider } from "@/contexts/ProfileOverlayContext";
import { ConnectionsProvider } from "@/contexts/ConnectionsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import MapOverlayClient from "./MapOverlayClient";
import ProfileOverlayClient from "./ProfileOverlayClient";
import CursorGlow from "@/components/motion/CursorGlow";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
        <ConversationsProvider>
        <ConnectionsProvider>
        <ProfileOverlayProvider>
        <MapOverlayProvider>
          {children}
          <CursorGlow />
          <MapOverlayClient />
          <Toaster />
          <Sonner />
        </MapOverlayProvider>
        <ProfileOverlayClient />
        </ProfileOverlayProvider>
        </ConnectionsProvider>
        </ConversationsProvider>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
