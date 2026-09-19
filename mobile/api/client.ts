import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch helper for the Next.js API routes the web app already exposes.
 * Attaches the current Supabase session's access token as a Bearer header -
 * the server validates it directly (src/lib/auth.ts getAuthUser), no cookies
 * involved, so this works identically from a native client.
 */
export async function fetchApi<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set - see mobile/.env.example"
    );
  }

  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (json && (json.error as string)) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return json as T;
}
