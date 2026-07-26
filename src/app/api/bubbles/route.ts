import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureUserInPublic } from "@/lib/ensureUser";

/**
 * POST /api/bubbles
 * Create a bubble and auto-join the creator.
 *
 * Body: { activity, zone, start_time?, duration_minutes?, max_members?, description?, emoji? }
 * Required: activity, zone. (start_time defaults to now, duration to 60.)
 *
 * Schema (live): bubbles(id, creator_id, activity, zone, exact_location, time_window,
 *   expires_at, status, created_at, max_members, start_time, duration_minutes, emoji,
 *   description, lat, lng). member_count is NOT a column — derived from bubble_members.
 *
 * Notes:
 * - expires_at is calculated manually (start_time + duration_minutes); it is NOT auto-generated.
 * - time_window is NOT NULL and must be set.
 * - No SQL transaction available client-side, so creator auto-join is best-effort with
 *   rollback: if the bubble_members insert fails, the just-created bubble is deleted.
 * - Double-tap dedupe: same creator + same activity within 10s returns the existing bubble.
 */

const MAX_ACTIVITY_LEN = 100;
const MAX_DESCRIPTION_LEN = 500;
const DEFAULT_DURATION_MIN = 60;
const DEDUPE_WINDOW_MS = 10_000;

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Ensure creator has a public.users row (FK target for creator_id / bubble_members).
    const { error: ensureError } = await ensureUserInPublic(admin, user);
    if (ensureError) {
      return NextResponse.json(
        { success: false, error: `Could not ensure user: ${ensureError}` },
        { status: 500 }
      );
    }

    // 2. Parse + validate
    const body = await request.json().catch(() => ({}));
    const { activity, zone, start_time, duration_minutes, max_members, description, emoji } = body ?? {};

    const activityClean = typeof activity === "string" ? activity.trim() : "";
    const zoneClean = typeof zone === "string" ? zone.trim() : "";

    if (!activityClean || !zoneClean) {
      return NextResponse.json(
        { success: false, error: "activity and zone are required" },
        { status: 400 }
      );
    }
    if (activityClean.length > MAX_ACTIVITY_LEN) {
      return NextResponse.json(
        { success: false, error: `activity must be ${MAX_ACTIVITY_LEN} characters or fewer` },
        { status: 400 }
      );
    }

    const descriptionClean =
      typeof description === "string" && description.trim() ? description.trim() : null;
    if (descriptionClean && descriptionClean.length > MAX_DESCRIPTION_LEN) {
      return NextResponse.json(
        { success: false, error: `description must be ${MAX_DESCRIPTION_LEN} characters or fewer` },
        { status: 400 }
      );
    }

    // start_time defaults to now; reject only if an explicit past time was given.
    const startDate = start_time != null ? new Date(start_time) : new Date();
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid start_time" }, { status: 400 });
    }
    if (start_time != null && startDate.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { success: false, error: "start_time cannot be in the past" },
        { status: 400 }
      );
    }

    const duration = Number(duration_minutes);
    const durationClean = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : DEFAULT_DURATION_MIN;

    // expires_at = start_time + duration_minutes (manual — not auto-generated)
    const expiresAt = new Date(startDate.getTime() + durationClean * 60 * 1000);
    const timeWindow = durationClean >= 60 ? `${Math.floor(durationClean / 60)} hr` : `${durationClean} min`;

    const maxMembersClean =
      max_members != null && Number.isFinite(Number(max_members)) ? Math.floor(Number(max_members)) : null;
    const emojiClean = typeof emoji === "string" && emoji.trim() ? emoji.trim().slice(0, 8) : null;

    // 3. Double-tap dedupe — same creator + activity created in the last 10s → return existing
    const dedupeSince = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { data: recent } = await admin
      .from("bubbles")
      .select("*")
      .eq("creator_id", user.id)
      .eq("activity", activityClean)
      .gte("created_at", dedupeSince)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      return NextResponse.json({ success: true, data: recent, deduped: true });
    }

    // 4. Insert bubble
    const { data: bubble, error: insertError } = await admin
      .from("bubbles")
      .insert({
        creator_id: user.id,
        activity: activityClean,
        zone: zoneClean,
        time_window: timeWindow,
        start_time: startDate.toISOString(),
        duration_minutes: durationClean,
        max_members: maxMembersClean,
        description: descriptionClean,
        emoji: emojiClean,
        expires_at: expiresAt.toISOString(),
        status: "open",
      })
      .select()
      .single();

    if (insertError || !bubble) {
      return NextResponse.json(
        { success: false, error: insertError?.message ?? "Failed to create bubble" },
        { status: 400 }
      );
    }

    // 5. Auto-join creator (best-effort transaction: roll back the bubble if this fails)
    const { error: memberError } = await admin
      .from("bubble_members")
      .insert({ bubble_id: bubble.id, user_id: user.id });

    if (memberError) {
      await admin.from("bubbles").delete().eq("id", bubble.id);
      return NextResponse.json(
        { success: false, error: "Failed to add creator to bubble" },
        { status: 500 }
      );
    }

    // 6. Return full bubble (member_count is 1 — just the creator)
    return NextResponse.json({ success: true, data: { ...bubble, members_count: 1 } });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
