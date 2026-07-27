import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/campus-events
 * Public read of upcoming UWaterloo campus events.
 *
 * Query: ?category=sports|academic|social|arts|career (optional)
 * Rules: date_time > now(), ordered date_time ascending, max 10.
 * No auth required.
 *
 * Live schema: campus_events(id, title, location, zone, date_time, organizer, category, source_url, created_at)
 *
 * Fallback: if the query errors OR returns nothing, serve 3 hardcoded events with
 * future times so the "Happening on Campus" section always feels alive.
 */

type CampusEvent = {
  id: string;
  title: string;
  location: string;
  zone: string | null;
  date_time: string;
  organizer: string | null;
  category: string | null;
  source_url: string | null;
};

function fallbackEvents(category?: string | null): CampusEvent[] {
  const now = Date.now();
  const hours = (h: number) => new Date(now + h * 60 * 60 * 1000).toISOString();
  const all: CampusEvent[] = [
    { id: "fallback-1", title: "Pick-up Basketball", location: "PAC Main Gym", zone: "PAC", date_time: hours(2), organizer: "Warriors Rec", category: "sports", source_url: null },
    { id: "fallback-2", title: "CS Career Coffee Chat", location: "DC 1301", zone: "DC", date_time: hours(26), organizer: "Women in CS", category: "career", source_url: null },
    { id: "fallback-3", title: "Open Mic Night", location: "SLC Great Hall", zone: "SLC", date_time: hours(52), organizer: "Federation of Students", category: "social", source_url: null },
  ];
  const filtered = category ? all.filter((e) => e.category === category) : all;
  return filtered.length > 0 ? filtered : all;
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    let query = admin
      .from("campus_events")
      .select("id, title, location, zone, date_time, organizer, category, source_url")
      .gt("date_time", now)
      .order("date_time", { ascending: true })
      .limit(10);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: fallbackEvents(category), fallback: true });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: fallbackEvents(category), fallback: true });
  }
}
