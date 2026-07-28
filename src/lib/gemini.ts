/**
 * Gemini client - server-side only. Never import in frontend.
 * Uses GEMINI_API_KEY and optional GEMINI_MODEL (default: gemini-2.5-flash).
 */
import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

/** True when a Gemini API key is configured (used for graceful fallbacks). */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Returns a configured Gemini model. Pass a generationConfig to enable JSON mode
 * (responseMimeType: "application/json" + responseSchema) for reliable structured output.
 */
export function getGeminiModel(generationConfig?: GenerationConfig) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return genAI.getGenerativeModel({
    model: modelId,
    ...(generationConfig ? { generationConfig } : {}),
  });
}
