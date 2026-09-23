import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the auth user has a row in public.users (for FK from bubble_members, bubbles.creator_id).
 * Uses a unique placeholder email for anonymous users so UNIQUE(email) doesn't conflict.
 *
 * Only ever INSERTs defaults for a brand-new row. For a row that already
 * exists, this never touches campus_verified (set explicitly by the
 * signup/login/verify routes) and only fills in `name` if the row doesn't
 * have one yet and a real, non-empty name is available from auth metadata -
 * it never overwrites a name a user has already set via onboarding/profile.
 */
export async function ensureUserInPublic(admin: SupabaseClient, user: User): Promise<{ error: string | null }> {
  const isAnonymous = (user as User & { is_anonymous?: boolean }).is_anonymous === true;
  const email =
    user.email && !isAnonymous
      ? user.email
      : `anon-${user.id}@placeholder.local`;

  const metaName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : null;

  const { data: existing, error: fetchError } = await admin
    .from("users")
    .select("id, name")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (existing) {
    if (!existing.name && metaName) {
      const { error } = await admin.from("users").update({ name: metaName }).eq("id", user.id);
      return { error: error?.message ?? null };
    }
    return { error: null };
  }

  // Upsert rather than insert: the select above and this write are not atomic,
  // so a new user firing two requests at once has both see no row and both try
  // to create it. A plain insert makes the loser fail on the primary key and
  // return a 500 on the very first action they ever take. `ignoreDuplicates`
  // turns that loser into a harmless no-op.
  const { error } = await admin.from("users").upsert(
    {
      id: user.id,
      email,
      name: metaName,
      campus_verified: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  return { error: error?.message ?? null };
}
