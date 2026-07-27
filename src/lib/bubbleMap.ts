/**
 * Maps a Supabase `bubbles` row (as returned by /api/bubbles/list or a Realtime
 * payload) into the UI `Bubble` shape that BubbleCard expects. The DB has no
 * `category` column, so we derive one from the activity for the card's theming.
 */
import type { Bubble } from "@/lib/mockData";

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/basket|soccer|volley|swim|run|gym|sport|frisbee|tennis|climb|hoop/i, "Sports"],
  [/stud|leetcode|cs\s?\d|math|midterm|exam|library|assignment|lab|review/i, "Study"],
  [/game|smash|valorant|chess|board|catan|poker|mario|among/i, "Gaming"],
  [/music|jam|open\s?mic|sing|concert|band|karaoke/i, "Music"],
  [/hike|trail|walk|outdoor|park|bike|explore/i, "Outdoors"],
  [/coffee|lunch|dinner|food|chat|hang|boba|tea|brunch/i, "Casual"],
];

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: "🏀",
  Study: "📚",
  Gaming: "🎮",
  Casual: "☕",
  Music: "🎵",
  Outdoors: "🥾",
};

export function deriveCategory(activity: string): string {
  for (const [re, cat] of CATEGORY_KEYWORDS) if (re.test(activity)) return cat;
  return "Casual";
}

export function deriveEmoji(activity: string, existing?: string | null): string {
  if (existing && existing.trim()) return existing.trim();
  return CATEGORY_EMOJI[deriveCategory(activity)] ?? "🫧";
}

export function humanStartingIn(iso?: string | null): string {
  if (!iso) return "Now";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) return "Now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"}`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr${hrs === 1 ? "" : "s"}`;
}

function initials(name?: string | null): string {
  const base = (name ?? "").trim();
  if (!base) return "🫧";
  const parts = base.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Shape of a bubble as it comes back from the API or a Realtime payload. */
export type ApiBubble = {
  id: string;
  activity: string;
  zone?: string | null;
  emoji?: string | null;
  description?: string | null;
  start_time?: string | null;
  duration_minutes?: number | null;
  time_window?: string | null;
  max_members?: number | null;
  members_count?: number | null;
  creator_name?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: string | null;
};

export function apiBubbleToUi(b: ApiBubble): Bubble {
  const activity = b.activity ?? "Activity";
  const category = deriveCategory(activity);
  return {
    id: b.id,
    emoji: deriveEmoji(activity, b.emoji),
    title: activity,
    category,
    zone: b.zone ?? undefined,
    joined: b.members_count ?? 1,
    maxPeople: b.max_members ?? 8,
    startingIn: humanStartingIn(b.start_time),
    duration: b.time_window ?? (b.duration_minutes ? `${b.duration_minutes} min` : "—"),
    distance: b.zone ?? "Campus",
    description: b.description ?? "",
    lat: b.lat ?? undefined,
    lng: b.lng ?? undefined,
    creator: b.creator_name?.trim() || "Wanderer",
    creatorAvatar: initials(b.creator_name),
  };
}
