import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ConnectionRow = {
  id: string | null;
  requester_id: string;
  receiver_id: string;
  status: string | null;
  created_at: string | null;
};

function initialsFromName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * GET /api/connections
 * Returns the current user's accepted connections and incoming pending requests.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("connections")
    .select("id, requester_id, receiver_id, status, created_at")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const connectionRows = (rows ?? []) as ConnectionRow[];

  const otherUserIds = [
    ...new Set(
      connectionRows.map((r) => (r.requester_id === user.id ? r.receiver_id : r.requester_id))
    ),
  ];

  const usersById = new Map<string, { name: string | null }>();
  if (otherUserIds.length > 0) {
    const { data: users } = await admin.from("users").select("id, name").in("id", otherUserIds);
    for (const u of users ?? []) usersById.set(u.id, { name: u.name });
  }

  const accepted = connectionRows
    .filter((r) => r.status === "accepted")
    .map((r) => {
      const otherId = r.requester_id === user.id ? r.receiver_id : r.requester_id;
      const name = usersById.get(otherId)?.name ?? "Wanderer";
      return {
        id: r.id,
        user_id: otherId,
        name,
        avatar: initialsFromName(name),
      };
    });

  // Only requests where the current user is the receiver are "incoming" -
  // requests the current user sent themselves show up as accepted/pending
  // from their own perspective but shouldn't prompt them to accept/decline.
  const pending = connectionRows
    .filter((r) => r.status === "pending" && r.receiver_id === user.id)
    .map((r) => {
      const name = usersById.get(r.requester_id)?.name ?? "Wanderer";
      return {
        id: r.id,
        user_id: r.requester_id,
        name,
        avatar: initialsFromName(name),
        created_at: r.created_at,
      };
    });

  // Requests the current user sent themselves, still awaiting the other
  // side's response - not shown in a request list, but needed so the
  // "Connect" button can show a disabled "Pending" state.
  const outgoingPending = connectionRows
    .filter((r) => r.status === "pending" && r.requester_id === user.id)
    .map((r) => r.receiver_id);

  return NextResponse.json({
    success: true,
    data: { connections: accepted, pending_requests: pending, outgoing_pending_user_ids: outgoingPending },
  });
}

/**
 * POST /api/connections
 * Body: { receiver_id: string }
 * Sends a "Wanna Wander?" connection request.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const receiver_id = (body?.receiver_id ?? "").toString().trim();
  if (!receiver_id) {
    return NextResponse.json({ success: false, error: "receiver_id required" }, { status: 400 });
  }
  if (receiver_id === user.id) {
    return NextResponse.json({ success: false, error: "Cannot connect with yourself" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  // No ensureUserInPublic() here - by the time a request is authenticated,
  // the user's public.users row already exists (created at signup via
  // /api/auth/ensure-profile). Calling ensureUserInPublic again would
  // upsert name back to user_metadata.name ?? null, silently clobbering
  // whatever real name the user has set since (see the profile/onboarding
  // flow, which writes name directly to public.users, not to auth metadata).

  const { data: existing } = await admin
    .from("connections")
    .select("requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},receiver_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: "Connection already exists", data: { status: existing.status } },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();
  const { data: created, error: insertError } = await admin
    .from("connections")
    .insert({ id, requester_id: user.id, receiver_id, status: "pending" })
    .select("id, requester_id, receiver_id, status, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: created });
}

/**
 * PATCH /api/connections
 * Body: { connection_id: string, action: "accept" | "decline" }
 * Only the receiver of a pending request may accept/decline it.
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const connection_id = (body?.connection_id ?? "").toString().trim();
  const action = (body?.action ?? "").toString().trim();
  if (!connection_id || (action !== "accept" && action !== "decline")) {
    return NextResponse.json(
      { success: false, error: "connection_id and action ('accept' | 'decline') required" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: connection, error: fetchError } = await admin
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .eq("id", connection_id)
    .maybeSingle();

  if (fetchError || !connection) {
    return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
  }

  if (connection.receiver_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Only the request recipient can accept or decline it" },
      { status: 403 }
    );
  }

  const nextStatus = action === "accept" ? "accepted" : "declined";
  const { data: updated, error: updateError } = await admin
    .from("connections")
    .update({ status: nextStatus })
    .eq("id", connection_id)
    .select("id, requester_id, receiver_id, status, created_at")
    .single();

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updated });
}
