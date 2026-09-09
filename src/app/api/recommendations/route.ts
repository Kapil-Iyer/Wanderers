import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

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
 *
 * Despite the name there is no model here: this returns the soonest-starting
 * open bubbles. An earlier version POSTed to an external FastAPI ranker when
 * RECOMMENDATIONS_API_URL was set, but no such service was ever deployed, so
 * that branch was dead in every environment and has been removed.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated", recommended_bubbles: [] }, { status: 401 });
  }

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

    const withCount: RecommendedBubbleItem[] = await Promise.all(
      (bubbles ?? []).map(async (b) => {
        const { count } = await admin
          .from("bubble_members")
          .select("user_id", { count: "exact", head: true })
          .eq("bubble_id", b.id);
        const joined = count ?? 0;
        const maxPeople = b.max_members ?? 8;
        return {
          id: b.id,
          title: b.activity || "Activity",
          emoji: activityEmoji(b.activity ?? ""),
          zone: b.zone ?? "",
          start_time: b.start_time ?? "",
          startingIn: formatStartingIn(b.start_time ?? ""),
          joined,
          maxPeople,
          recommendationReason: "Starting soon",
        };
      })
    );

    return NextResponse.json({ recommended_bubbles: withCount });
  } catch {
    return NextResponse.json({ recommended_bubbles: [] });
  }
}
