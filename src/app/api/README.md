# Next.js API routes (connected to frontend)

| Method | Route | Purpose |
|--------|--------|--------|
| GET | `/api/hello` | Demo / health check |
| POST | `/api/auth/login` | Login (email OTP) → used by AuthModal; **@uwaterloo.ca only** |
| POST | `/api/auth/signup` | Sign up (email OTP) → used by AuthModal; **@uwaterloo.ca only** |
| POST | `/api/auth/verify` | Verify OTP, upsert user profile, return session; **@uwaterloo.ca only** |
| POST | `/api/auth/ensure-profile` | Ensure current user (Bearer) has a row in public.users; use after signInAnonymously when OTP is disabled |
| POST | `/api/bubbles` | Create bubble (auth required); body: activity, zone, start_time, duration_minutes, max_members?, description? |
| POST | `/api/bubbles/join` | Join bubble (auth required); body: bubble_id |
| GET | `/api/bubbles/list` | List open/active, non-expired bubbles with member count |
| GET | `/api/bubbles/mine` | List bubbles the current user joined (auth required) |
| GET | `/api/bubbles/[id]/messages` | List messages (auth + bubble member required) |
| POST | `/api/bubbles/[id]/messages` | Send message (auth + member); body: `{ content }` (max 500 chars) |
| POST | `/api/bubbles/[id]/confirm` | End event: set bubble status to expired (auth + member) |
| POST | `/api/media/upload` | Disabled (410) — remote photo upload removed |
| GET | `/api/moments` | List Wander Moments (meetup_photos) for feed |
| POST | `/api/ai/parse-intent` | Gemini: parse natural language → activity, zone, start_time, duration_minutes, etc. Body: `{ text }`. Env: GEMINI_API_KEY |
| GET | `/api/recommendations` | Recommended bubbles. Optional `?user_id=` for Flask. If RECOMMENDATIONS_API_URL set, calls Flask; else fallback from DB (open/active bubbles). Returns `{ recommended_bubbles: [...] }`. |

Auth: Supabase Auth (email OTP). Protected routes expect `Authorization: Bearer <access_token>`.

Bubbles table must have: creator_id, activity, zone, start_time, duration_minutes, max_members (nullable), expires_at, status.

**Phase 2C — Realtime chat:** Use Supabase Realtime to subscribe to new messages. Ensure `messages` is in the `supabase_realtime` publication. Frontend example:

```ts
const channel = supabase.channel(`messages:${bubbleId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `bubble_id=eq.${bubbleId}` }, (payload) => {
    // append payload.new to local messages state
  })
  .subscribe();
// cleanup: channel.unsubscribe();
```
