import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * PATCH /api/profile
 * Updates the current user's own `users` row - vibe, interests, and
 * personality_traits columns already exist in the schema but were never
 * wired up on the web app (onboarding/profile there only show static mock
 * data). Body: { vibe?, interests?, personality_traits? } - all optional,
 * only provided fields are updated.
 */

const MAX_LIST_LEN = 20;
const MAX_ITEM_LEN = 60;

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().slice(0, MAX_ITEM_LEN))
    .slice(0, MAX_LIST_LEN);
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const update: { vibe?: string | null; interests?: string[]; personality_traits?: string[] } = {};

    if (typeof body?.vibe === "string" || body?.vibe === null) {
      update.vibe = body.vibe;
    }
    const interests = cleanStringArray(body?.interests);
    if (interests) update.interests = interests;
    const traits = cleanStringArray(body?.personality_traits);
    if (traits) update.personality_traits = traits;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("users").update(update).eq("id", user.id).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
