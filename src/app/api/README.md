# Next.js API routes (connected to frontend)

| Method | Route | Purpose |
|--------|--------|--------|
| GET | `/api/hello` | Demo / health check |
| POST | `/api/auth/login` | Login (email OTP) → used by AuthModal; **@uwaterloo.ca only** |
| POST | `/api/auth/signup` | Sign up (email OTP) → used by AuthModal; **@uwaterloo.ca only** |
| POST | `/api/auth/verify` | Verify OTP, upsert user profile, return session; **@uwaterloo.ca only** |
| POST | `/api/auth/forgot-password` | Email a reset/sign-in link (no on-page verify button) - clicking it signs the user in and lands on `/change-password` |
| POST | `/api/auth/ensure-profile` | Ensure current user (Bearer) has a row in public.users; use after signInAnonymously when OTP is disabled |
| POST | `/api/bubbles` | Create bubble (auth required); body: activity, zone, start_time, duration_minutes, max_members?, description? |
| POST | `/api/bubbles/join` | Join bubble (auth required); body: bubble_id |
| GET | `/api/bubbles/list` | List open/active, non-expired bubbles with member count |
| GET | `/api/bubbles/mine` | List bubbles the current user joined (auth required); includes each bubble's `starred` flag (per-user) |
| GET | `/api/bubbles/[id]` | Return one bubble's public info (for chat header when opened from Home) |
| GET | `/api/bubbles/[id]/messages` | List messages (auth + bubble member required) |
| POST | `/api/bubbles/[id]/messages` | Send message (auth + member); body: `{ content }` (max 500 chars) |
| POST | `/api/bubbles/[id]/confirm` | End event: set bubble status to expired (auth + member) |
| POST | `/api/bubbles/[id]/star` | Star a bubble for the current user only (auth + member required) - keeps it in *their* conversations past the 5-day auto-cleanup window. Per-person: doesn't affect other members. |
| DELETE | `/api/bubbles/[id]/star` | Unstar - the bubble goes back to being pruned 5 days after it expires, same as any unstarred bubble |
| POST | `/api/media/upload` | Disabled (410) — remote photo upload removed |
| GET | `/api/moments` | List Wander Moments (meetup_photos) for feed |
| GET | `/api/campus-events` | Public read of upcoming UWaterloo campus events. Query: `?category=sports\|academic\|social\|arts\|career` (optional). Rules: `date_time > now()`, ordered ascending, max 10. No auth required. |
| POST | `/api/seed-demo-bubbles` | Dev helper: creates 3 real bubbles so the map has joinable content (auth required, current user becomes creator + member of each) |
| POST | `/api/ai/parse-intent` | Gemini: parse natural language → activity, zone, start_time, duration_minutes, etc. Body: `{ text }`. Env: GEMINI_API_KEY |
| GET | `/api/recommendations` | Recommended bubbles. Optional `?user_id=` for Flask. If RECOMMENDATIONS_API_URL set, calls Flask; else fallback from DB (open/active bubbles). Returns `{ recommended_bubbles: [...] }`. |

Auth: Supabase Auth (email OTP). Protected routes expect `Authorization: Bearer <access_token>`.

Every route (except the small set of intentionally-public reads, like `/api/campus-events` and `/api/hello`) validates the Bearer token via `getAuthUser()` in `src/lib/auth.ts` before doing anything else.

## Data access pattern

Every route above talks to Postgres through `getSupabaseAdmin()` (`src/lib/supabaseAdmin.ts`), the **service-role client**, which bypasses Row Level Security entirely. This is a deliberate but important thing to know when debugging:

- Authorization is enforced **in application code**, per route (e.g. `ensureBubbleMembership()` checks the caller is actually a member before returning messages) - not by Postgres/RLS.
- Any RLS policies that exist on these tables (e.g. `bubble_stars`, see `supabase/migrations/`) are **not** what's actually protecting data reached through these API routes - they'd only matter if something queried the table directly with the anon key, which nothing in this app currently does.
- If a route is missing an authorization check, there's no database-level backstop catching it. When debugging an access-control bug, look at the route handler's own logic first, not RLS policies.

## Schema

The full schema lives as migration files in `supabase/migrations/` - every table, column, constraint, FK cascade rule, and RLS policy, pulled directly from the live database. See [`supabase/README.md`](../../../supabase/README.md) for the breakdown and for how to keep it current. Generated TypeScript types live in `src/lib/database.types.ts` and are wired into both `src/lib/supabase.ts` and `src/lib/supabaseAdmin.ts` via `createClient<Database>(...)`.

**Phase 2C — Realtime chat:** Use Supabase Realtime to subscribe to new messages. Ensure `messages` is in the `supabase_realtime` publication. Frontend example:

```ts
const channel = supabase.channel(`messages:${bubbleId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `bubble_id=eq.${bubbleId}` }, (payload) => {
    // append payload.new to local messages state
  })
  .subscribe();
// cleanup: channel.unsubscribe();
```
