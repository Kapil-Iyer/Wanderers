/**
 * Ensure auth user exists in public.users and is a member of the bubble.
 * Auto-joins open/active non-expired bubbles (idempotent).
 * Used by messages GET/POST so send/history never 403 after a soft join.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { ensureUserInPublic } from "@/lib/ensureUser";
import type { Database } from "@/lib/database.types";

/** join_bubble()'s refusal codes → the status/message this helper reports. */
const ERRORS: Record<string, { status: number; error: string }> = {
  not_found: { status: 404, error: "Bubble not found" },
  expired: { status: 400, error: "Bubble expired" },
  full: { status: 400, error: "Bubble full" },
};

export async function ensureBubbleMembership(
  admin: SupabaseClient<Database>,
  user: User,
  bubbleId: string
): Promise<{ ok: true; members_count: number } | { ok: false; status: number; error: string }> {
  const { error: ensureError } = await ensureUserInPublic(admin, user);
  if (ensureError) {
    return { ok: false, status: 500, error: `Could not ensure user: ${ensureError}` };
  }

  // Delegates to the same atomic function as POST /api/bubbles/join. This used
  // to be five sequential queries doing membership lookup, bubble fetch, count,
  // insert, and status flip - which carried the same capacity race the join
  // route had: two callers could both read a count below max_members and both
  // insert. join_bubble() locks the bubble row, so they serialize.
  const { data, error } = await admin.rpc("join_bubble", {
    p_bubble_id: bubbleId,
    p_user_id: user.id,
  });

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  const result = (data ?? {}) as {
    ok?: boolean;
    code?: string;
    members_count?: number;
  };

  if (result.ok !== true) {
    const mapped = ERRORS[result.code ?? ""] ?? {
      status: 400,
      error: "Could not join bubble",
    };
    return { ok: false, status: mapped.status, error: mapped.error };
  }

  return { ok: true, members_count: result.members_count ?? 1 };
}
