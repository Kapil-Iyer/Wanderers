"use client";

/**
 * One source of real bubbles for the screens that list them.
 *
 * Home, Explore, and the map overlay all render the same thing - bubbles that
 * exist right now - so they share one fetch and one row-to-card mapping here
 * rather than each growing their own copy.
 *
 * Guests never reach the network: guest mode is served entirely from
 * src/lib/demoData.ts, and the "demo-" id prefix keeps that content from ever
 * being mistaken for a real bubble (see BubbleCard's UUID check).
 *
 * When a signed-in user has no bubbles to see, that is a real answer, not a
 * failure - callers should render an empty state rather than falling back to
 * mock content. A thin database should read as an invitation to start
 * something, not be papered over with filler.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useGuest } from "@/contexts/GuestContext";
import { DEMO_BUBBLES } from "@/lib/demoData";
import { activityEmoji, inferCategory } from "@/lib/eventCategories";
import type { Bubble } from "@/lib/mockData";

/** A row as GET /api/bubbles/list returns it. */
export type CampusBubbleRow = {
  id: string;
  creator_id: string;
  activity: string;
  zone: string | null;
  exact_location: string | null;
  emoji: string | null;
  description: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  max_members: number | null;
  status: string | null;
  lat: number | null;
  lng: number | null;
  creator_name: string | null;
  members_count: number;
};

/** "Starting now" / "In 20 mins" / "In 2 hrs" - matches the map's phrasing. */
function formatStartingIn(startTime: string | null): string {
  if (!startTime) return "Soon";
  const ms = new Date(startTime).getTime();
  if (Number.isNaN(ms)) return "Soon";
  const diffMin = Math.round((ms - Date.now()) / 60_000);
  if (diffMin <= 0) return "Starting now";
  if (diffMin < 60) return `In ${diffMin} mins`;
  const hrs = Math.round(diffMin / 60);
  return `In ${hrs} hr${hrs !== 1 ? "s" : ""}`;
}

function formatDuration(minutes: number | null): string {
  const m = minutes ?? 60;
  if (m < 60) return `${m} min`;
  const hrs = m / 60;
  return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} hr`;
}

function initials(name: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Map an API row onto the shape BubbleCard and the filter chips expect. */
export function toDisplayBubble(row: CampusBubbleRow): Bubble {
  const category = inferCategory(row.activity);
  const creator = row.creator_name?.trim() || "Wanderer";
  return {
    id: row.id,
    emoji: row.emoji?.trim() || activityEmoji(row.activity, category),
    title: row.activity,
    category,
    zone: row.zone?.trim() || row.exact_location?.trim() || "Campus",
    joined: row.members_count ?? 0,
    maxPeople: row.max_members ?? 8,
    startingIn: formatStartingIn(row.start_time),
    duration: formatDuration(row.duration_minutes),
    // BubbleCard falls back to `distance` only when `zone` is absent, and we
    // always have a zone. Real distance needs the user's position, which the
    // map overlay computes and the card grids do not.
    distance: "",
    description: row.description?.trim() || "",
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    creator,
    creatorAvatar: initials(row.creator_name),
  };
}

export type CampusBubblesState = {
  bubbles: Bubble[];
  loading: boolean;
  /** Set only when the fetch itself failed - an empty result is not an error. */
  error: string | null;
  reload: () => void;
};

/**
 * Fetches the live bubble list for the signed-in user. Guests get the demo
 * set without touching the network.
 */
export function useCampusBubbles(): CampusBubblesState {
  const { isGuest, guestResolved } = useGuest();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!guestResolved) return;

    if (isGuest) {
      setBubbles(DEMO_BUBBLES);
      setError(null);
      setLoading(false);
      return;
    }

    // Guards every state write below: without it a slow response from a
    // previous render can land after a newer one and show stale bubbles.
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (cancelled) return;
        if (!token) {
          setBubbles([]);
          setError(null);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/bubbles/list", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || !json?.success || !Array.isArray(json.data)) {
          setError(json?.error ?? "Could not load bubbles");
          setBubbles([]);
        } else {
          setBubbles((json.data as CampusBubbleRow[]).map(toDisplayBubble));
          setError(null);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setError("Could not load bubbles");
        setBubbles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isGuest, guestResolved, nonce]);

  return { bubbles, loading, error, reload };
}
