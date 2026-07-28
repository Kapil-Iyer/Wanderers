import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type Schema } from "@google/generative-ai";
import { getGeminiModel, isGeminiConfigured } from "@/lib/gemini";

/**
 * POST /api/ai/parse-intent
 * Natural language → structured bubble fields, using Gemini in JSON mode
 * (responseSchema) for reliable parsing.
 *
 * Responses:
 * - 200 { success: true, data }                - parsed
 * - 200 { success: false, fallback: true, ... } - no key / parse failure → client uses manual form
 * - 400 { success: false, error }               - bad request
 */

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    activity: { type: SchemaType.STRING, nullable: true, description: "The activity, e.g. Basketball, Coffee, CS 341 study" },
    zone: { type: SchemaType.STRING, nullable: true, description: "UWaterloo campus zone, e.g. SLC, PAC, DC, CIF, MC, E7, QNC" },
    start_time: { type: SchemaType.STRING, nullable: true, description: "ISO 8601 timestamp for the soonest future occurrence" },
    duration_minutes: { type: SchemaType.NUMBER, nullable: true, description: "Duration in minutes, default 60" },
    max_members: { type: SchemaType.NUMBER, nullable: true, description: "Max people, or null" },
    description: { type: SchemaType.STRING, nullable: true, description: "Short punchy summary" },
  },
  required: ["activity", "zone"],
};

// ── Simple in-memory rate limit: 10 calls / 60s per client (sliding window).
// In-memory is per-instance and resets on cold start - fine for this stage.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : null) || request.headers.get("x-real-ip") || "local";
}

const SYSTEM_PROMPT = `You are an intent parser for Wanderers, a University of Waterloo meetup app.
Extract structured fields from the user's message.
- zone is a campus location (SLC, PAC, DC, CIF, MC, E7, QNC, Columbia Fields, ...). Infer the most likely one; use null only if truly absent.
- If a relative or clock time is given ("in 30 mins", "7pm", "tonight"), convert it to an ISO 8601 timestamp for the soonest future occurrence, based on the provided current time.
- duration_minutes defaults to 60 when unclear.
- description is a short, punchy summary of the plan.
- Use null for anything genuinely absent.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ success: false, error: "text required" }, { status: 400 });
    }

    // Rate limit - 10 parses/min per client
    if (isRateLimited(clientKey(request))) {
      return NextResponse.json(
        { success: false, error: "Slow down - you're parsing too fast" },
        { status: 429 }
      );
    }

    // Graceful fallback when Gemini isn't configured - client reveals the manual form.
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { success: false, fallback: true, error: "Smart parsing is off - fill in the form below." },
        { status: 200 }
      );
    }

    const model = getGeminiModel({
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    });

    const nowIso = new Date().toISOString();
    const prompt = `${SYSTEM_PROMPT}\n\nCurrent time (ISO 8601): ${nowIso}\nUser message: "${text}"`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let parsed: Record<string, unknown>;
    try {
      // JSON mode returns clean JSON; the fence-strip is just belt-and-suspenders.
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "").trim());
    } catch {
      return NextResponse.json(
        { success: false, fallback: true, error: "Couldn't parse that - try the manual form." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        activity: typeof parsed.activity === "string" ? parsed.activity : null,
        zone: typeof parsed.zone === "string" ? parsed.zone : null,
        start_time: typeof parsed.start_time === "string" ? parsed.start_time : null,
        duration_minutes: typeof parsed.duration_minutes === "number" ? parsed.duration_minutes : 60,
        max_members: typeof parsed.max_members === "number" ? parsed.max_members : null,
        description: typeof parsed.description === "string" ? parsed.description : null,
      },
    });
  } catch (err) {
    console.error("parse-intent error:", err);
    // Any model/network error → let the client fall back to the manual form.
    return NextResponse.json(
      { success: false, fallback: true, error: "Couldn't parse that - try the manual form." },
      { status: 200 }
    );
  }
}
