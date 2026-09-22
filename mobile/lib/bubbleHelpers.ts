/**
 * Real bubbles from the API have `activity` text and `start_time`/
 * `duration_minutes`, not the demo data's `category`/`startingIn` strings -
 * these helpers derive equivalent values so Explore/Messages/Profile/Map can
 * treat real and demo bubbles uniformly. inferCategory mirrors the pattern
 * of src/app/api/recommendations/route.ts's activityEmoji() on web.
 */

export function inferCategory(activity: string | null | undefined): string {
  const a = (activity ?? "").toLowerCase();
  if (/basketball|soccer|volleyball|sport|gym|workout|swim/.test(a)) return "Sports";
  if (/study|leetcode|homework|exam|midterm|class/.test(a)) return "Study";
  if (/game|gaming|smash|valorant|league/.test(a)) return "Gaming";
  if (/music|concert|mic|band|karaoke/.test(a)) return "Music";
  if (/hike|walk|trail|outdoor/.test(a)) return "Outdoors";
  return "Casual";
}

export type TimingBucket = "now" | "soon" | "past" | "unknown";

export function timingBucket(
  startTime: string | null | undefined,
  durationMinutes: number | null | undefined
): TimingBucket {
  if (!startTime) return "unknown";
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const durationMs = (durationMinutes ?? 60) * 60_000;
  if (now < start) return "soon";
  if (now <= start + durationMs) return "now";
  return "past";
}

/** Port of web's recommendations route formatStartingIn(). */
export function formatStartingIn(startTime: string | null | undefined): string {
  if (!startTime) return "";
  const start = new Date(startTime).getTime();
  const diffMs = start - Date.now();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 0) return "Soon";
  if (diffMins < 60) return `${diffMins} mins`;
  const hrs = Math.floor(diffMins / 60);
  if (hrs < 24) return `${hrs} hr`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
