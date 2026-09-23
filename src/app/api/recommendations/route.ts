import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";
import { getMemberCounts } from "@/lib/memberCounts";

/** Map activity name to emoji for cards. */
function activityEmoji(activity: string): string {
  const a = (activity || "").toLowerCase();
  if (a.includes("basketball") || a.includes("sport")) return "🏀";
  if (a.includes("study") || a.includes("leetcode")) return "📚";
  if (a.includes("coffee") || a.includes("food")) return "☕";
  if (a.includes("game") || a.includes("gaming")) return "🎮";
  if (a.includes("hike") || a.includes("walk")) return "🥾";
  if (a.includes("movie")) return "🎬";
  return "🫧";
}

/** Format start_time to "X mins" / "X hr" for display. */
function formatStartingIn(startTime: string): string {
  const start = new Date(startTime);
  const now = Date.now();
  const diffMs = start.getTime() - now;
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 0) return "Soon";
  if (diffMins < 60) return `${diffMins} mins`;
  const hrs = Math.floor(diffMins / 60);
  if (hrs < 24) return `${hrs} hr`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/**
 * The ranker is a nice-to-have: if it is slow, the plain DB sort below is a
 * perfectly good answer. Without a deadline a hung service would hold the
 * function open until the platform timeout, so a stalled ranker would turn
 * into a stalled Home screen for everyone.
 */
const ML_TIMEOUT_MS = 2000;

export type RecommendedBubbleItem = {
  id: string;
  title: string;
  emoji: string;
  zone: string;
  start_time: string;
  startingIn: string;
  joined: number;
  maxPeople: number;
  recommendationReason?: string;
};

/**
 * GET /api/recommendations
 * Feeds the "Recommended for you" row on Home. Auth required - activity,
 * zone, and member counts are real student data.
 * - If RECOMMENDATIONS_API_URL is set: fetches bubbles from DB, POSTs to the
 *   FastAPI ranker's /recommend, maps the response to recommended_bubbles.
 * - Else, or if that call fails for any reason (unset, unreachable, cold
 *   start, slower than ML_TIMEOUT_MS): falls back to the plain DB sort below -
 *   real recommendations never silently disappear.
 */
/** Fallback: plain "starting soon" sort straight from the DB, no ML service involved. */
async function dbFallbackRecommendations() {
  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: bubbles, error } = await admin
      .from("bubbles")
      .select("id, activity, zone, start_time, duration_minutes, max_members, status")
      .in("status", ["open", "active"])
      .gt("expires_at", now)
      .order("start_time", { ascending: true })
      .limit(12);

    if (error) return NextResponse.json({ recommended_bubbles: [] });

    const rows = bubbles ?? [];
    const countById = await getMemberCounts(admin, rows.map((b) => b.id));

    const recommendations: RecommendedBubbleItem[] = rows.map((b) => ({
      id: b.id,
      title: b.activity || "Activity",
      emoji: activityEmoji(b.activity ?? ""),
      zone: b.zone ?? "",
      start_time: b.start_time ?? "",
      startingIn: formatStartingIn(b.start_time ?? ""),
      joined: countById.get(b.id) ?? 0,
      maxPeople: b.max_members ?? 8,
      recommendationReason: "Starting soon",
    }));

    return NextResponse.json({ recommended_bubbles: recommendations });
  } catch {
    return NextResponse.json({ recommended_bubbles: [] });
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated", recommended_bubbles: [] }, { status: 401 });
  }

  const apiBase = process.env.RECOMMENDATIONS_API_URL?.replace(/\/$/, "");
  const recommendUrl = apiBase ? `${apiBase}/recommend` : null;

  if (recommendUrl) {
    try {
      const admin = getSupabaseAdmin();
      const now = new Date().toISOString();
      const { data: bubbles, error } = await admin
        .from("bubbles")
        .select("id, activity, zone, start_time, duration_minutes, max_members")
        .in("status", ["open", "active"])
        .gt("expires_at", now)
        .order("start_time", { ascending: true })
        .limit(20);

      if (error) return dbFallbackRecommendations();
      if (!bubbles?.length) return NextResponse.json({ recommended_bubbles: [] });

      const countById = await getMemberCounts(admin, bubbles.map((b) => b.id));

      const withCount = bubbles.map((b) => ({
        id: b.id,
        title: b.activity || "Activity",
        emoji: activityEmoji(b.activity ?? ""),
        category: "Casual",
        joined: countById.get(b.id) ?? 0,
        maxPeople: b.max_members ?? 8,
        startingIn: formatStartingIn(b.start_time ?? ""),
        distance: "0.5 km",
        description: "",
        creator: "?",
        creatorAvatar: "?",
        zone: b.zone ?? "",
        start_time: b.start_time ?? "",
      }));

      const res = await fetch(recommendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The authenticated user, not a query param - otherwise anyone can
          // ask for anyone else's personalised ranking.
          user_id: user.id,
          activities: withCount.map(({ zone, start_time, ...rest }) => rest),
          top_k: 12,
        }),
        signal: AbortSignal.timeout(ML_TIMEOUT_MS),
      });
      if (!res.ok) return dbFallbackRecommendations();
      const data = await res.json();
      const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];

      const byId = new Map(withCount.map((b) => [b.id, b]));
      const recommended_bubbles: RecommendedBubbleItem[] = recs.map((r: { id: string; title?: string; emoji?: string; joined?: number; maxPeople?: number; startingIn?: string; recommendationReason?: string }) => {
        const row = byId.get(r.id);
        return {
          id: r.id,
          title: r.title ?? row?.title ?? "Activity",
          emoji: r.emoji ?? row?.emoji ?? "🫧",
          zone: row?.zone ?? "",
          start_time: row?.start_time ?? "",
          startingIn: r.startingIn ?? (row ? formatStartingIn(row.start_time) : "Soon"),
          joined: r.joined ?? row?.joined ?? 0,
          maxPeople: r.maxPeople ?? row?.maxPeople ?? 8,
          recommendationReason: r.recommendationReason ?? "For you",
        };
      });

      return NextResponse.json({ recommended_bubbles });
    } catch {
      // ML service unreachable/erroring (e.g. Render cold-start failure) - fall
      // back to the plain DB sort instead of leaving the user with nothing.
      return dbFallbackRecommendations();
    }
  }

  return dbFallbackRecommendations();
}
