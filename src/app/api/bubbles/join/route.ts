import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureUserInPublic } from "@/lib/ensureUser";

/** Maps join_bubble()'s refusal codes onto HTTP responses. */
const ERRORS: Record<string, [string, 400 | 404]> = {
  not_found: ["Bubble not found", 404],
  expired: ["Bubble is no longer open", 400],
  full: ["Bubble full", 400],
};

/**
 * POST /api/bubbles/join
 * Join a bubble. Expired/full return 400 with a message; an existing member is
 * a success with already_member set.
 *
 * Delegates to the join_bubble() Postgres function so the capacity check and
 * the insert are atomic (see
 * supabase/migrations/20260922_indexes_realtime_cron_and_atomic_join.sql).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const { error: ensureError } = await ensureUserInPublic(admin, user);
    if (ensureError) {
      return NextResponse.json(
        { success: false, error: `Could not ensure user: ${ensureError}` },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const bubble_id = (body?.bubble_id ?? body?.bubbleId ?? "").toString().trim();
    if (!bubble_id) {
      return NextResponse.json(
        { success: false, error: "bubble_id required" },
        { status: 400 }
      );
    }

    // Capacity check and insert happen inside one locked statement. Doing it
    // here as count-then-insert let two users racing for the last seat both
    // read the same count and both get in.
    const { data, error: rpcError } = await admin.rpc("join_bubble", {
      p_bubble_id: bubble_id,
      p_user_id: user.id,
    });

    if (rpcError) {
      return NextResponse.json(
        { success: false, error: rpcError.message },
        { status: 500 }
      );
    }

    const result = (data ?? {}) as {
      ok?: boolean;
      code?: string;
      already_member?: boolean;
      members_count?: number;
    };

    if (result.ok !== true) {
      const [message, status] = ERRORS[result.code ?? ""] ?? [
        "Could not join bubble",
        400 as const,
      ];
      return NextResponse.json({ success: false, error: message }, { status });
    }

    return NextResponse.json({
      success: true,
      data: {
        members_count: result.members_count ?? 1,
        ...(result.already_member ? { already_member: true } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
