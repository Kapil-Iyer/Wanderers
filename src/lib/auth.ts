/**
 * Server-side auth helper for API routes.
 * Validates the Bearer access token against Supabase Auth.
 *
 * Uses the Auth REST `/user` endpoint directly so it works with both
 * legacy JWT anon keys and the newer `sb_publishable_…` keys
 * (supabase-js createClient + getUser can mishandle the latter).
 */

import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anon,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const user = (await res.json()) as User;
    if (!user?.id) return null;
    return user;
  } catch {
    return null;
  }
}
