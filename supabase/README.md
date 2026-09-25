# Database schema-as-code

This directory holds the **full** live schema as migration files, so the
whole database can be understood (and recreated) by reading git history
instead of clicking through the Supabase dashboard.

## Current state (up to date as of `20260925_lock_down_client_access.sql`)

The migrations together capture every table, column, constraint, FK cascade
rule, and RLS policy that exists live in the "Wanderers Project" Supabase
instance:

- **`20260820_baseline_schema.sql`** — everything that existed before this
  work started: `users`, `bubbles`, `bubble_members`, `messages`,
  `connections`, `direct_messages`, `meetup_photos`, `campus_events`. Dated
  to sort first even though it was written after the fact — pulled directly
  from the live database via the Supabase MCP server (`list_tables` +
  `pg_policies` + `pg_constraint` queries), not guessed from route code.
- **`20260826_bubble_stars_and_cleanup.sql`** — the `bubble_stars` table plus
  the `cleanup_expired_bubbles()` function and its `pg_cron` schedule.
- **`20260920_auth_rate_limits.sql`** — `auth_rate_limits` + `check_rate_limit()`.
- **`20260922_indexes_realtime_cron_and_atomic_join.sql`** — secondary
  indexes, Realtime publication, the expire-bubbles cron, and the
  `bubble_member_counts()` / `join_bubble()` functions.
- **`20260922_trust_and_safety.sql`** — `reports` and `blocks`.
- **`20260923_join_bubble_member_fast_path.sql`** — lock-free `join_bubble()`
  path for existing members.
- **`20260925_lock_down_client_access.sql`** — drops every client write
  policy and write grant, limits `users` reads to your own row and
  `messages`/`bubble_members` reads to members, and makes the SECURITY
  DEFINER functions server-only. All writes go through the API routes.

All are written with `if not exists` / `drop policy if exists` so they're
safe to re-run against the live project (no-op there) and can also bootstrap
a brand-new empty Supabase project from scratch.

**From here on**, schema changes should go through a new dated migration
file (SQL Editor → write it → save it here too), not one-off changes typed
only into the SQL Editor — otherwise this directory drifts out of date
again immediately, same as it did before this pass.

## TypeScript types

`src/lib/database.types.ts` is generated from the live schema (via the
Supabase MCP server's `generate_typescript_types`, equivalent to
`supabase gen types typescript` via the CLI). Both `src/lib/supabase.ts` and
`src/lib/supabaseAdmin.ts` use `createClient<Database>(...)` with it, so a
typo'd column name (e.g. `.select("statuss")`) is now a compile error
instead of a silent runtime failure.

**Regenerate it any time the schema changes** — stale generated types are
worse than no types, since they'll confidently lie about what's actually in
the database.

## Why this matters for debugging

Without a committed schema, answering "what columns does `bubbles` actually
have" or "does `messages` have RLS enabled" meant going into the dashboard.
With migrations committed, it's `grep` and `git blame` like any other code —
see `20260820_baseline_schema.sql` for the full answer to both of those,
plus a note on why RLS specifically doesn't matter for anything reached
through this app's own API routes (they all use the service-role client).
