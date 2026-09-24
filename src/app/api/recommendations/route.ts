import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";
import { inferCategory } from "@/lib/eventCategories";
import { rankBubbles, type CandidateBubble } from "@/lib/recommendations";
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

const CANDIDATE_LIMIT = 100;
const HISTORY_LIMIT = 50;

/**
 * GET /api/recommendations
 * Feeds the "Recommended for you" row on Home (web + mobile). Auth required.
 * Scores open bubbles for the caller from their onboarding vibe/interests,
 * the categories they've joined before, which connections are going,
 * start time, and fill level - see src/lib/recommendations.ts. Excludes
 * bubbles they're already in, full ones, and ones created by users they've
 * blocked. Returns the top 12 as { recommended_bubbles: [...] }.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated", recommended_bubbles: [] }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const now = new Date();

    const [candidatesRes, profileRes, connectionsRes, blocksRes, myMembershipsRes] = await Promise.all([
      admin
        .from("bubbles")
        .select("id, creator_id, activity, emoji, zone, start_time, max_members")
        .in("status", ["open", "active"])
        .gt("expires_at", now.toISOString())
        .order("start_time", { ascending: true })
        .limit(CANDIDATE_LIMIT),
      admin.from("users").select("vibe, interests").eq("id", user.id).maybeSingle(),
      admin
        .from("connections")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
      admin.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      admin
        .from("bubble_members")
        .select("bubble_id")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(HISTORY_LIMIT),
    ]);

    if (candidatesRes.error) throw candidatesRes.error;
    const bubbles = candidatesRes.data ?? [];
    if (bubbles.length === 0) return NextResponse.json({ recommended_bubbles: [] });

    const friendIds = (connectionsRes.data ?? []).map((c) =>
      c.requester_id === user.id ? c.receiver_id : c.requester_id
    );
    const historyBubbleIds = (myMembershipsRes.data ?? []).map((m) => m.bubble_id);

    // Counts come from the bubble_member_counts RPC (one row per bubble).
    // Individual memberships are only needed for the user and their friends,
    // which keeps that query small instead of loading every member of every
    // candidate bubble into PostgREST's 1000-row cap.
    const bubbleIds = bubbles.map((b) => b.id);
    const [countById, knownMembersRes, friendNamesRes, historyRes] = await Promise.all([
      getMemberCounts(admin, bubbleIds),
      admin
        .from("bubble_members")
        .select("bubble_id, user_id")
        .in("bubble_id", bubbleIds)
        .in("user_id", [user.id, ...friendIds]),
      friendIds.length
        ? admin.from("users").select("id, name").in("id", friendIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
      historyBubbleIds.length
        ? admin.from("bubbles").select("activity").in("id", historyBubbleIds)
        : Promise.resolve({ data: [] as { activity: string }[] }),
    ]);
    if (knownMembersRes.error) throw knownMembersRes.error;

    const knownByBubble = new Map<string, string[]>();
    for (const m of knownMembersRes.data ?? []) {
      const list = knownByBubble.get(m.bubble_id) ?? [];
      list.push(m.user_id);
      knownByBubble.set(m.bubble_id, list);
    }

    const friends = new Map<string, string>(friendIds.map((id) => [id, ""]));
    for (const f of friendNamesRes.data ?? []) {
      friends.set(f.id, f.name?.trim().split(/\s+/)[0] ?? "");
    }

    const candidates: CandidateBubble[] = bubbles.map((b) => ({
      id: b.id,
      creator_id: b.creator_id,
      activity: b.activity ?? "",
      start_time: b.start_time,
      max_members: b.max_members,
      members_count: countById.get(b.id) ?? 0,
      known_member_ids: knownByBubble.get(b.id) ?? [],
    }));

    const ranked = rankBubbles(candidates, {
      userId: user.id,
      vibe: profileRes.data?.vibe ?? null,
      interests: profileRes.data?.interests ?? [],
      historyCategories: (historyRes.data ?? []).map((h) => inferCategory(h.activity ?? "")),
      friends,
      blockedIds: new Set((blocksRes.data ?? []).map((b) => b.blocked_id)),
      now: now.getTime(),
    });

    const byId = new Map(bubbles.map((b) => [b.id, b]));
    const recommended_bubbles: RecommendedBubbleItem[] = ranked.map((r) => {
      const b = byId.get(r.id)!;
      return {
        id: b.id,
        title: b.activity || "Activity",
        emoji: b.emoji || activityEmoji(b.activity ?? ""),
        zone: b.zone ?? "",
        start_time: b.start_time ?? "",
        startingIn: formatStartingIn(b.start_time ?? ""),
        joined: countById.get(b.id) ?? 0,
        maxPeople: b.max_members ?? 8,
        recommendationReason: r.reason,
      };
    });

    return NextResponse.json({ recommended_bubbles });
  } catch (err) {
    console.error("[recommendations]", err);
    return NextResponse.json({ recommended_bubbles: [] });
  }
}
