import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_MESSAGE_LENGTH = 500;

/**
 * GET /api/bubbles/[id]/messages
 * List messages for a bubble. Auth required; caller must be a member.
 * Returns: { success, data: [{ id, bubble_id, user_id, content, created_at }] }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { id: bubbleId } = await context.params;
    if (!bubbleId) {
      return NextResponse.json(
        { success: false, error: "Bubble id required" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: membership } = await admin
      .from("bubble_members")
      .select("user_id")
      .eq("bubble_id", bubbleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    const { data: messages, error } = await admin
      .from("messages")
      .select("id, bubble_id, user_id, content, created_at")
      .eq("bubble_id", bubbleId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = messages ?? [];

    // Join sender name + avatar initial (batched — one query for all senders).
    const senderIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
    const nameById = new Map<string, string | null>();
    if (senderIds.length > 0) {
      const { data: senders } = await admin.from("users").select("id, name").in("id", senderIds);
      for (const s of senders ?? []) nameById.set(s.id, s.name);
    }

    const avatarInitial = (name: string | null | undefined, id: string): string => {
      const base = (name ?? "").trim();
      if (base) {
        const parts = base.split(/\s+/);
        return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
      }
      return id.slice(0, 2).toUpperCase();
    };

    const enriched = rows.map((m) => ({
      ...m,
      sender_name: nameById.get(m.user_id) ?? "Wanderer",
      sender_avatar: avatarInitial(nameById.get(m.user_id), m.user_id),
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * POST /api/bubbles/[id]/messages
 * Send a message. Caller must be authenticated and a member of the bubble.
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { id: bubbleId } = await context.params;
    if (!bubbleId) {
      return NextResponse.json(
        { success: false, error: "Bubble id required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const rawContent = body?.content;
    if (rawContent == null || String(rawContent).trim() === "") {
      return NextResponse.json(
        { success: false, error: "content required" },
        { status: 400 }
      );
    }

    const content = String(rawContent).trim();
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: membership } = await admin
      .from("bubble_members")
      .select("user_id")
      .eq("bubble_id", bubbleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    const { data: message, error } = await admin
      .from("messages")
      .insert({
        bubble_id: bubbleId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
