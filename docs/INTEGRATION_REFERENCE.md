# API Integration Reference

Snapshot of what's wired to real Supabase/API routes today vs. what still runs on mock data (`src/lib/mockData.ts`, from the original pre-backend prototype). This replaces an earlier version of this doc that predated the backend integration and incorrectly described auth as mock.

## Auth — fully real, not mock

`src/app/api/auth/login`, `signup`, `verify`, `forgot-password`, and `ensure-profile` are real Supabase-backed routes:

| Route | File | Status |
|-------|------|--------|
| POST /api/auth/login | `src/app/api/auth/login/route.ts` | Real. Supabase OTP auth, campus-email gate (`REQUIRE_UW_EMAIL`), "remember this device" cookie via `deviceTrust.ts`, mail-send retry via `authRetry.ts` |
| POST /api/auth/signup | `src/app/api/auth/signup/route.ts` | Real. Same campus-email gate + Supabase signup |
| POST /api/auth/verify | `src/app/api/auth/verify/route.ts` | Real. OTP code verification |
| POST /api/auth/forgot-password | `src/app/api/auth/forgot-password/route.ts` | Real. Dedicated OTP-based reset flow (not magic links) |
| POST /api/auth/ensure-profile | `src/app/api/auth/ensure-profile/route.ts` | Real. Upserts `public.users` row after verify, including anonymous/guest edge cases |

A dev-only escape hatch, `AUTH_RETURN_RECOVERY_LINK`, returns OTP codes directly in the API response instead of sending real email — explicitly disabled whenever `NODE_ENV === "production"`, regardless of the env var. **Guest mode is separate from this auth system entirely** — it's a `sessionStorage`-only client path (`src/contexts/GuestContext.tsx`) that never calls Supabase or these routes.

## Data sources — real vs. still mock

| What | Location | Status |
|------|----------|--------|
| **Bubbles** | `src/app/api/bubbles/*` | Real. RLS-backed Supabase tables (`supabase/migrations/`) |
| **Bubble stars** | `src/app/api/bubbles/[id]/star` | Real |
| **Messages** | `src/app/api/bubbles/[id]/messages` | Real. Supabase Realtime subscriptions |
| **Recommendations** | `src/app/api/recommendations` | Real. Calls optional ML service, falls back to DB "starting soon" sort |
| **Moments / feed** | `src/app/api/moments` | Real, with a fallback to `mockFeedPosts` if the fetch fails or returns empty (see `src/app/home/page.tsx`) |
| **Campus events** | `src/app/api/campus-events` | Real |
| **Connections / connection requests** | *(no API route exists)* | **Still mock.** `ConnectionsContext.tsx` reads/writes only `mockConnectedFriends` / `mockConnectionRequests` from `src/lib/mockData.ts`, in-memory only, lost on refresh. A `connections` table exists in `supabase/migrations/20260820_baseline_schema.sql`, but nothing in `src/app/api` reads or writes it — the schema is provisioned but not yet wired to any route |
| **User profiles** | `src/lib/mockData.ts` (`getOrCreateProfile`, etc.) | Still mock — profile lookups used by `ProfileOverlayContext` are in-memory, not backed by `public.users` beyond the auth upsert |

## Contexts (state management)

| Context | File | Status |
|---------|------|--------|
| **ConversationsContext** | `src/contexts/ConversationsContext.tsx` | Real — joined bubbles / chat list backed by Supabase |
| **ConnectionsContext** | `src/contexts/ConnectionsContext.tsx` | Mock — see above; no backing API route yet |
| **ProfileOverlayContext** | `src/contexts/ProfileOverlayContext.tsx` | Mock — `getOrCreateProfile` reads from `mockData.ts` |
| **GuestContext** | `src/contexts/GuestContext.tsx` | Real (by design) — `sessionStorage`-only guest-mode state, deliberately never touches Supabase |
| **MapOverlayContext / MapFilterContext / MapDiscoveryContext / MapThemeContext** | `src/contexts/Map*Context.tsx` | UI/map state, largely real map data via `src/lib/bubbleMap.ts` etc., mixed with `mockMapEvents.ts` for some overlay content |

## Pages

| Page | File | Key data |
|------|------|----------|
| Landing (marketing) | `src/app/page.tsx` | Public marketing content + product walkthrough (invented demo data, not live) |
| Login | `src/app/login/page.tsx` | AuthModal → real `/api/auth/*` |
| Onboarding | `src/app/onboarding/page.tsx` | Interest selection, feeds recommendations |
| Home | `src/app/home/page.tsx` | Real bubbles/recommendations/moments, with `mockFeedPosts`/`mockBubbles` fallback on empty/error |
| Profile | `src/app/profile/page.tsx` | Mix of real auth/user data and mock `personalityTraits`/connection counts |
| Messages | `src/app/messages/page.tsx` | Real — `useConversations().conversations` |
| Chat | `src/app/chat/[id]/page.tsx` | Real Supabase Realtime messages |
| My Bubbles | `src/app/my-bubbles/page.tsx` | Real — user's own bubbles from Supabase |
| Map | `src/app/map/page.tsx` | Real map + bubble data via `MapOverlay` |

## Components

| Component | File | Notes |
|-----------|------|-------|
| MapOverlay | `src/components/MapOverlay.tsx` | Real bubble data; joining opens/creates real conversations |
| ProfileOverlay | `src/components/ProfileOverlay.tsx` | Mock — `ConnectionsContext` connect/disconnect not yet backed by an API route |
| BubbleCard | `src/components/ui/BubbleCard.tsx` | Real bubble data |
| FeedPost | `src/components/FeedPost.tsx` | Real moments data with mock fallback (see Home page above) |
| CreateBubbleModal | `src/components/ui/CreateBubbleModal.tsx` | Real — form or Gemini-parsed intent → `POST /api/bubbles` |
| AuthModal | `src/components/ui/AuthModal.tsx` | Real — `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify` |
| GuestLocked | `src/components/ui/GuestLocked.tsx` | Gate shown to guests attempting a real-account-only action |

## Database (Supabase)

- Clients: `src/lib/supabase.ts` (browser/anon), `src/lib/supabaseAdmin.ts` (server-only, service role)
- Migrations: `supabase/migrations/20260820_baseline_schema.sql` (core schema + RLS), `20260826_bubble_stars_and_cleanup.sql` (bubble starring)
- Tables: `users`, `bubbles`, `bubble_members`, `messages`, `connections` (table exists, no API route reads/writes it yet), `meetup_photos`
- Generated types: `src/lib/database.types.ts`

## Biggest remaining gap

**Connections** is the one core feature from `docs/PROJECT_BRAIN.md`'s product loop (intent → bubble → chat → meetup → photo → **connection**) that is still entirely mock: the `connections` table is provisioned in the DB but has no API route, so "Wanna Wander?" requests don't survive a page refresh today.
