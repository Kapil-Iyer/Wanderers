/**
 * SUPABASE CLIENT - Database / Auth (mobile)
 * -----------------------------------------------------------------------------
 * Same Supabase project as the web app (src/lib/supabase.ts), but sessions are
 * persisted to AsyncStorage instead of localStorage, since RN has no browser
 * storage. Mirrors the standard Supabase + Expo setup.
 * -----------------------------------------------------------------------------
 */

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
