import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const TARGET_TYPES = new Set(["message", "photo", "user"]);
const MAX_REASON_LENGTH = 500;

/**
 * POST /api/reports
 * Body: { target_type: "message"|"photo"|"user", target_id: string, reason?: string }
 * Insert-only - reports are reviewed via the service-role client, never
 * exposed back to regular users (no GET here). Rate-limited to keep a
 * single bad actor from flooding the queue.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  if (!(await checkRateLimit("report-create", user.id, 20, 60 * 60))) {
    return rateLimitResponse();
  }

  const body = await request.json().catch(() => ({}));
  const target_type = (body?.target_type ?? "").toString().trim();
  const target_id = (body?.target_id ?? "").toString().trim();
  const reason = body?.reason == null ? null : String(body.reason).trim().slice(0, MAX_REASON_LENGTH);

  if (!TARGET_TYPES.has(target_type) || !target_id) {
    return NextResponse.json(
      { success: false, error: "target_type ('message'|'photo'|'user') and target_id required" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("reports").insert({
    reporter_id: user.id,
    target_type,
    target_id,
    reason,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
