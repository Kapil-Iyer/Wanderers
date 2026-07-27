import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureBubbleMembership } from "@/lib/ensureBubbleMembership";

const MAX_MESSAGE_LENGTH = 500;

/**
 * GET /api/bubbles/[id]/messages
 * Auth required. Auto-joins open bubbles if needed, then returns full history.
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
    const membership = await ensureBubbleMembership(admin, user, bubbleId);
    if (membership.ok === false) {
      return NextResponse.json(
        { success: false, error: membership.error },
        { status: membership.status }
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
    const senderIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
    const nameById = new Map<string, string>();
    if (senderIds.length > 0) {
      const { data: senders } = await admin
        .from("users")
        .select("id, name, email")
        .in("id", senderIds);

      const found = new Set<string>();
      for (const s of senders ?? []) {
        const name = (s.name && String(s.name).trim()) || "";
        const email = (s.email && String(s.email).trim()) || "";
        const resolved =
          name ||
          (email.includes("@") ? email.split("@")[0] : email) ||
          "";
        if (resolved) {
          nameById.set(s.id, resolved);
          found.add(s.id);
        }
      }

      // Auth metadata fallback when users.name is empty
      const missing = senderIds.filter((id) => !found.has(id));
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data } = await admin.auth.admin.getUserById(id);
            const u = data?.user;
            const meta =
              (typeof u?.user_metadata?.name === "string" && u.user_metadata.name.trim()) ||
              (typeof u?.user_metadata?.full_name === "string" && u.user_metadata.full_name.trim()) ||
              "";
            const emailLocal = u?.email?.split("@")[0]?.trim() || "";
            const resolved = meta || emailLocal;
            if (resolved) nameById.set(id, resolved);
          } catch {
            /* ignore */
          }
        })
      );
    }

    const avatarInitial = (name: string | null | undefined, id: string): string => {
      const base = (name ?? "").trim();
      if (base) {
        const parts = base.split(/\s+/);
        return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
      }
      return id.slice(0, 2).toUpperCase();
    };

    const enriched = rows.map((m) => {
      const senderName = nameById.get(m.user_id) ?? "Wanderer";
      return {
        ...m,
        sender_name: senderName,
        sender_avatar: avatarInitial(senderName, m.user_id),
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      members_count: membership.members_count,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * POST /api/bubbles/[id]/messages
 * Auth required. Auto-joins if needed, then inserts the message.
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
    const membership = await ensureBubbleMembership(admin, user, bubbleId);
    if (membership.ok === false) {
      return NextResponse.json(
        { success: false, error: membership.error },
        { status: membership.status }
      );
    }

    const { data: message, error } = await admin
      .from("messages")
      .insert({
        bubble_id: bubbleId,
        user_id: user.id,
        content,
      })
      .select("id, bubble_id, user_id, content, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const { data: profile } = await admin
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();
    const senderName =
      (profile?.name && String(profile.name).trim()) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
      (profile?.email && String(profile.email).split("@")[0]) ||
      user.email?.split("@")[0] ||
      "Wanderer";

    return NextResponse.json({
      success: true,
      data: { ...message, sender_name: senderName },
      members_count: membership.members_count,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
