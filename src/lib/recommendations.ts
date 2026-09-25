/**
 * "Recommended for you" scoring. Pure - no DB access - so the route
 * (src/app/api/recommendations/route.ts) gathers the inputs and this ranks.
 *
 * Each candidate bubble gets points from independent signals; the highest
 * totals win, and the card's reason is the most persuasive signal present
 * (friend > interest > history > timing):
 *   - interest match (vibe/interests from onboarding)   +40
 *   - history match (categories they've joined before)  up to +25
 *   - a connection has already joined                    +30
 *   - starting soon (now → 24h out, linear)              up to +20
 *   - filling up (members / capacity)                    up to +10
 * A user with no profile/history/connections just gets soonest-first plus a
 * popularity nudge - never worse than a plain "starting soon" sort.
 */

import { inferCategory } from "@/lib/eventCategories";

export type CandidateBubble = {
  id: string;
  creator_id: string | null;
  activity: string;
  start_time: string | null;
  max_members: number | null;
  members_count: number;
  /** Members of this bubble who are the user or one of their friends. */
  known_member_ids: string[];
};

export type RecommendationContext = {
  userId: string;
  vibe: string | null;
  interests: string[];
  /** Categories (inferCategory output) of bubbles the user joined before. */
  historyCategories: string[];
  /** Accepted connections: user id → display name. */
  friends: Map<string, string>;
  blockedIds: Set<string>;
  now: number;
};

export type ScoredBubble = {
  id: string;
  score: number;
  category: string;
  reason: string;
};

const VIBE_CATEGORIES: Record<string, string[]> = {
  late_night_grinder: ["Study"],
  coffee_regular: ["Food"],
  sports: ["Sports"],
  study_buddy: ["Study"],
  explorer: ["Social", "Music"],
};

// Keywords inside onboarding interest tags (e.g. "🏀 Basketball").
const INTEREST_CATEGORIES: [string, string][] = [
  ["basketball", "Sports"],
  ["soccer", "Sports"],
  ["running", "Sports"],
  ["swimming", "Sports"],
  ["hiking", "Sports"],
  ["studying", "Study"],
  ["coding", "Study"],
  ["coffee", "Food"],
  ["board games", "Gaming"],
  ["gaming", "Gaming"],
  ["music", "Music"],
  ["theater", "Social"],
  ["arts", "Social"],
  ["photography", "Social"],
];

const DEFAULT_CAPACITY = 8;
const SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export function likedCategories(vibe: string | null, interests: string[]): Set<string> {
  const liked = new Set<string>(vibe ? VIBE_CATEGORIES[vibe] ?? [] : []);
  for (const tag of interests) {
    const t = tag.toLowerCase();
    for (const [keyword, category] of INTEREST_CATEGORIES) {
      if (t.includes(keyword)) liked.add(category);
    }
  }
  return liked;
}

function startingInLabel(msUntil: number): string {
  const mins = Math.round(msUntil / 60_000);
  if (mins <= 0) return "Happening now";
  if (mins < 60) return `Starting in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `Starting in ${hrs} hr` : "Coming up";
}

export function rankBubbles(
  candidates: CandidateBubble[],
  ctx: RecommendationContext,
  limit = 12
): ScoredBubble[] {
  const liked = likedCategories(ctx.vibe, ctx.interests);
  const historyCounts = new Map<string, number>();
  for (const c of ctx.historyCategories) historyCounts.set(c, (historyCounts.get(c) ?? 0) + 1);

  const scored: (ScoredBubble & { start: number })[] = [];

  for (const b of candidates) {
    if (b.known_member_ids.includes(ctx.userId)) continue;
    if (b.creator_id && ctx.blockedIds.has(b.creator_id)) continue;
    if (b.max_members != null && b.members_count >= b.max_members) continue;

    const category = inferCategory(b.activity);
    const start = b.start_time ? new Date(b.start_time).getTime() : ctx.now;
    const msUntil = start - ctx.now;

    const interest = liked.has(category) ? 40 : 0;
    const history = Math.min(25, (historyCounts.get(category) ?? 0) * 10);
    const friendsGoing = b.known_member_ids.filter((id) => ctx.friends.has(id));
    const friend = friendsGoing.length > 0 ? 30 : 0;
    const soon = 20 * Math.max(0, 1 - Math.max(0, msUntil) / SOON_WINDOW_MS);
    const capacity = b.max_members ?? DEFAULT_CAPACITY;
    const popularity = 10 * Math.min(1, b.members_count / capacity);

    // Reason: most persuasive personal signal first, then timing.
    let reason: string;
    if (friend) {
      const name = ctx.friends.get(friendsGoing[0]) || "A friend";
      reason = friendsGoing.length > 1 ? `${name} +${friendsGoing.length - 1} going` : `${name} is going`;
    } else if (interest) {
      reason = `Because you like ${category}`;
    } else if (history) {
      reason = `You've joined ${category} before`;
    } else {
      reason = startingInLabel(msUntil);
    }

    scored.push({
      id: b.id,
      score: interest + history + friend + soon + popularity,
      category,
      reason,
      start,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.start - b.start);
  return scored.slice(0, limit).map(({ start: _start, ...rest }) => rest);
}
