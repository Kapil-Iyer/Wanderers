import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type Schema } from "@google/generative-ai";
import { getGeminiModel, isGeminiConfigured } from "@/lib/gemini";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * POST /api/ai/parse-intent
 * Natural language → structured bubble fields, using Gemini in JSON mode
 * (responseSchema) for reliable parsing.
 *
 * Auth required, and throttled per user - every call costs money.
 *
 * Responses:
 * - 200 { success: true, data }                - parsed
 * - 200 { success: false, fallback: true, ... } - no key / parse failure → client uses manual form
 * - 400 { success: false, error }               - bad request
 * - 401 { success: false, error }               - not signed in
 * - 429 { success: false, error }               - too many parses
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

/**
 * Throttle: 10 parses/minute per user, shared across instances via Postgres.
 * The previous in-memory Map was per-lambda and reset on every cold start, so
 * the real ceiling was 10 x (however many instances Vercel had warm) - not
 * much of a limit on a paid third-party API.
 */
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 60;

/**
 * Cap on the prompt input. Unbounded text went straight into the Gemini prompt,
 * which is both a cost lever for anyone who found the endpoint and more room
 * than anyone needs to describe a meetup.
 */
const MAX_TEXT_LENGTH = 500;

const SYSTEM_PROMPT = `You are an intent parser for Wanderers, a University of Waterloo meetup app.
Extract structured fields from the user's message.
- zone is a campus location (SLC, PAC, DC, CIF, MC, E7, QNC, Columbia Fields, ...). Infer the most likely one; use null only if truly absent.
- If a relative or clock time is given ("in 30 mins", "7pm", "tonight"), convert it to an ISO 8601 timestamp for the soonest future occurrence, based on the provided current time.
- duration_minutes defaults to 60 when unclear.
- description is a short, punchy summary of the plan.
- Use null for anything genuinely absent.`;

export async function POST(request: NextRequest) {
  try {
    // Auth required: this endpoint spends money on every call, and only
    // signed-in users can create a bubble in the first place.
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ success: false, error: "text required" }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Keep it under ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const withinLimit = await checkRateLimit(
      "ai-parse-intent",
      user.id,
      RATE_LIMIT,
      RATE_WINDOW_SECONDS
    );
    if (!withinLimit) {
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
