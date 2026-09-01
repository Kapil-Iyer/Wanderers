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
 * Returns bubbles recommended for the user. Auth required - real bubble
 * activity, zone, and member counts are real student data.
 * - If RECOMMENDATIONS_API_URL is set: fetches bubbles from DB, POSTs to FastAPI /recommend, maps response to recommended_bubbles.
 * - Else: fallback from DB (open/active, non-expired), same shape for "Recommended for you" section.
 */
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

      if (error || !bubbles?.length) return NextResponse.json({ recommended_bubbles: [] });

      const withCount = await Promise.all(
        bubbles.map(async (b) => {
          const { count } = await admin
            .from("bubble_members")
            .select("user_id", { count: "exact", head: true })
            .eq("bubble_id", b.id);
          return {
            id: b.id,
            title: b.activity || "Activity",
            emoji: activityEmoji(b.activity ?? ""),
            category: "Casual",
            joined: count ?? 0,
            maxPeople: b.max_members ?? 8,
            startingIn: formatStartingIn(b.start_time ?? ""),
            distance: "0.5 km",
            description: "",
            creator: "?",
            creatorAvatar: "?",
            zone: b.zone ?? "",
            start_time: b.start_time ?? "",
          };
        })
      );

      const url = new URL(request.url);
      const userId = url.searchParams.get("user_id");
      const res = await fetch(recommendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || undefined,
          activities: withCount.map(({ zone, start_time, ...rest }) => rest),
          top_k: 12,
        }),
      });
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
          startingIn: r.startingIn ?? row ? formatStartingIn(row.start_time) : "Soon",
          joined: r.joined ?? row?.joined ?? 0,
          maxPeople: r.maxPeople ?? row?.maxPeople ?? 8,
          recommendationReason: r.recommendationReason ?? "For you",
        };
      });

      return NextResponse.json({ recommended_bubbles });
    } catch {
      return NextResponse.json({ recommended_bubbles: [] });
    }
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
