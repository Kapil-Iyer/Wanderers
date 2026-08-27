/**
 * Supabase Admin Client - server-only, bypasses RLS.
 * Use only in API routes for operations that need service-role (e.g. user upsert after auth).
 * Env: NEXT_PUBLIC_SUPABASE_URL (same as main client), SUPABASE_SERVICE_ROLE_KEY (secret, no NEXT_PUBLIC_).
 * Lazy init so build can complete without env vars; runtime will have them.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let _admin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY (and URL) required for admin client");
    _admin = createClient<Database>(url, key);
  }
  return _admin;
}
