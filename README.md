# Wanderers

**Find your people. Start something.**

Wanderers is a campus social app for University of Waterloo students that helps people discover and join real-time activities (“bubbles”)—study sessions, sports, coffee meetups—then chat, meet up, and capture moments together. A public marketing landing page (with an auto-playing product walkthrough built from recreated demo data) and a read-only **guest mode** let visitors explore the product before signing up with a campus email.

---

## Table of Contents

- [Objective](#objective)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Overview](#api-overview)
- [Database (Supabase)](#database-supabase)
- [ML Service (Optional)](#ml-service-optional)
- [Mobile App](#mobile-app)
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## Objective

- **Discover** – See nearby and upcoming activities (bubbles) on a map and in feeds.
- **Join** – One tap to join a bubble; chat unlocks when at least 2 people are in.
- **Coordinate** – Group chat per bubble, with optional AI icebreakers and meetup suggestions.
- **Meet & remember** – End an event, capture a “Wander Moment” (photo with filters), post to the shared feed.
- **Connect** – Send “Wanna Wander?” connection requests to people you met in a bubble.

Sign-up is gated to **@uwaterloo.ca campus emails** (`REQUIRE_UW_EMAIL`) with **OTP** verification via Supabase Auth, a dedicated forgot-password OTP flow, and an optional 7-day "remember this device" cookie. Visitors without an account can use **guest mode** — a fully client-side, `sessionStorage`-only read-only demo that never touches Supabase or real student data. Bubbles have start time, duration, max members, and expiry; recommendations can be powered by an optional K-means ML service.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI, shadcn/ui |
| **Backend** | Next.js API Routes (serverless) |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Realtime) |
| **Email (OTP)** | Supabase Auth + custom SMTP (e.g. Resend) |
| **Media** | Local device save only for the in-app filter preview; Wander Moment photos upload to Supabase Storage (public `moments-photos` bucket) |
| **AI** | Google Gemini (intent parsing for “coffee near SLC tonight” → structured bubble fields) |
| **ML** | Optional FastAPI service (K-means recommender for “Recommended for you”) |
| **Maps** | Google Maps JavaScript API (@react-google-maps/api), 3D building extrusion via a Map ID |
| **Motion** | GSAP + `@gsap/react` + Vanta (three.js) background system; Framer Motion for UI transitions |

---

## Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)
- **Supabase** account
- **Google Cloud** project (for Maps API key)
- Optional: **Resend** account (for custom SMTP), **Google AI** API key (Gemini), **Render** or similar (for the ML service)

---

## Environment Variables

Create a `.env.local` in the project root (see `.env.example` for a minimal template). All variables below are used by the Next.js app unless marked otherwise.

### Required for core app

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; used for admin DB and auth) |

### Optional but recommended

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key (map and bubbles) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Cloud Map ID; enables the vector renderer and 3D buildings. Dark styling does not need it — that comes from local JSON styles. |

### Auth (OTP emails, campus gate, device trust)

Supabase sends OTP/magic link emails. With **built-in** SMTP you get a low rate limit (~2 emails/h). For production, configure **custom SMTP** in Supabase (e.g. Resend). Additional app-level auth variables:

| Variable | Description |
|----------|-------------|
| `REQUIRE_UW_EMAIL` / `NEXT_PUBLIC_REQUIRE_UW_EMAIL` | Gate signup to `@uwaterloo.ca` addresses (server + client copies must match) |
| `DEVICE_TRUST_SECRET` | Signing secret for the 7-day "remember this device" cookie |
| `AUTH_RETURN_RECOVERY_LINK` | **Dev only.** Returns OTP codes directly in API responses to skip real email delivery locally; must be unset/off in production |

### Gemini (intent parsing)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI API key (server-only) |
| `GEMINI_MODEL` | Optional; default `gemini-2.5-flash` |

### ML recommendations

| Variable | Description |
|----------|-------------|
| `RECOMMENDATIONS_API_URL` | Base URL of the optional FastAPI ML service (e.g. `https://your-service.onrender.com`). If unset, or if the service is unreachable, `/api/recommendations` falls back to a plain "starting soon" sort straight from the DB — real recommendations never silently disappear. **This variable lives only in each developer's/deploy target's own `.env.local` / environment config — it is not committed anywhere** (by design, since the ML service is an optional add-on), so make sure it's documented wherever your team tracks deploy config, not just in a local file, or a future cleanup pass may reasonably conclude it's dead. |

### Dev / debug

| Variable | Description |
|----------|-------------|
| *(none currently)* | — |

---

## Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd Wanderers
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in at least:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL from your schema (see [Database (Supabase)](#database-supabase)) to create tables and enable Realtime.
   - In Authentication → URL Configuration, set Site URL (and Redirect URLs if needed) to your app URL (e.g. `http://localhost:3000` for local).
   - For OTP emails: either use built-in SMTP (low limit) or add custom SMTP (e.g. Resend) under Project Settings → Auth → SMTP.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up or log in (OTP), or continue as a guest, then use Home, Map, Messages, and Profile.

5. **(Optional) ML service**

   See [ML Service (Optional)](#ml-service-optional). Set `RECOMMENDATIONS_API_URL` to the ML service URL to enable model-ranked "Recommended for you".

---

## Project Structure

```
Wanderers/
├── src/
│   ├── app/                    # Next.js App Router (the real, active app tree)
│   │   ├── api/                # API routes (auth, bubbles, connections, moments, ai, recommendations, campus-events)
│   │   ├── home/                # Home feed (recommended + nearby bubbles, campus moments)
│   │   ├── chat/[id]/          # Bubble chat
│   │   ├── messages/           # Conversations list
│   │   ├── my-bubbles/         # User's bubbles
│   │   ├── profile/            # Profile
│   │   ├── onboarding/         # Onboarding / interest selection
│   │   ├── map/                # Map + activities overlay
│   │   ├── login/              # Login / signup
│   │   ├── change-password/, reset-password/, auth/callback/
│   │   ├── page.tsx            # Marketing landing page (public, includes product walkthrough)
│   │   ├── template.tsx        # Route-change cross-fade — opacity-only by design, see note below
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives + app components (AuthModal, BubbleCard, CreateBubbleModal, GuestLocked, ...)
│   │   ├── map/                 # Map overlay pieces (filter bar, cluster pills, campus boundary layer, ...)
│   │   ├── chat/                 # Chat UI
│   │   ├── motion/              # GSAP/Vanta GlobalBackdrop
│   │   └── marketing/            # Landing page sections + walkthrough/ (cinematic recreated-demo hero animation)
│   ├── contexts/                # One context per concern: Guest, Connections, Conversations, CampusMode,
│   │                             #   MapDiscovery/MapFilter/MapOverlay/MapTheme, ProfileOverlay, Sidebar, UserLocation
│   ├── lib/                     # Utilities and clients
│   │   ├── supabase.ts          # Browser Supabase client
│   │   ├── supabaseAdmin.ts     # Server-only admin client
│   │   ├── auth.ts / authRetry.ts / campusEmail.ts / deviceTrust.ts  # Auth helpers
│   │   ├── ensureUser.ts        # ensureUserInPublic (public.users row, created once, never clobbers existing name/campus_verified)
│   │   ├── gemini.ts            # Gemini client for intent parsing
│   │   ├── bubbleMap.ts / mapCamera.ts / mapClustering.ts / mapStyles.ts / campusBounds.ts  # Map logic
│   │   ├── database.types.ts    # Generated Supabase types
│   │   ├── demoData.ts          # Guest-mode fake data (never real student data)
│   │   └── mockData.ts          # Legacy mock data from the pre-Supabase prototype
│   ├── assets/logo.jpg          # App logo, imported by AppHeader/BottomNav
│   └── hooks/                   # useRequireAuth (route guard), use-mobile, use-toast
├── supabase/migrations/          # Versioned schema + RLS (baseline schema, bubble stars/cleanup)
├── model/kmeans/                 # K-means recommender prototype (pytest tests + evaluation report)
├── ml-service/                   # Optional FastAPI service that runs the K-means recommender in production
│   ├── main.py                   # FastAPI app (/recommend, /health)
│   ├── recommender_api.py        # Request/response mapping around model/kmeans
│   └── render.yaml                # Render deploy notes
├── .env.local                    # Local env (not committed)
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── package.json
└── README.md                     # This file
```

---

## Features

- **Marketing landing page** – Public page at `/` with an auto-playing product walkthrough (`src/components/marketing/walkthrough/`) that cinematically recreates the core app flows using entirely invented demo data — it never touches real student data.
- **Guest mode** – Read-only demo experience (`src/contexts/GuestContext.tsx`) for visitors without an account. Entirely `sessionStorage`-backed; makes no Supabase calls.
- **Landing & auth** – Signup gated to `@uwaterloo.ca` campus emails, OTP verification via Supabase, a dedicated OTP forgot-password flow, and an optional 7-day "remember this device" cookie. After verify, the user is upserted into `public.users`. `useRequireAuth` is the shared route guard used by Home/My Bubbles/Profile/Messages/Map/Onboarding — it lets guests through without a Supabase call and redirects unauthenticated real visitors to `/login`.
- **Home** – "Upcoming for you" (ML recommendations or DB fallback), filter chips, "Active Nearby" bubbles, Recent Moments feed, and empty-state "Start" CTAs when no bubbles are nearby.
- **Map** – Google Map with 3D building extrusion, bubble clustering, campus-boundary off-campus warnings, and a filter bar; joining opens the bubble's group chat.
- **Create bubble** – Manual form or natural language (Gemini) → activity, zone, time, duration, max members.
- **Bubble chat / Messages** – Realtime message subscriptions, typing indicators, per-member display names; chat unlocks once enough members join. Users can star conversations.
- **End event / Wander Moments** – Confirm bubble as ended, then upload a real photo + caption to the shared feed (Supabase Storage), with a live Realtime subscription so new moments from anyone appear without refreshing.
- **Connections** – Real "Wanna Wander?" requests (`/api/connections`, backed by the `connections` table): send, accept, or decline, and it persists across refresh.
- **Profile & onboarding** – Onboarding interest selection feeding recommendations; profile stats and links; guest profile shows demo values immediately, never a stuck loading state.

---

## API Overview

All auth-protected routes expect `Authorization: Bearer <access_token>` (Supabase session).

| Area | Methods | Purpose |
|------|---------|---------|
| **Auth** | POST `/api/auth/login`, `/api/auth/signup`, `/api/auth/verify`, `/api/auth/forgot-password`, `/api/auth/ensure-profile` | Campus-gated OTP login/signup, verify, OTP forgot-password, ensure `public.users` row |
| **Bubbles** | POST `/api/bubbles`, POST `/api/bubbles/join`, GET `/api/bubbles/list`, GET `/api/bubbles/mine`, GET `/api/bubbles/[id]` | Create, join, list, single bubble |
| **Bubble stars** | POST `/api/bubbles/[id]/star` | Star/unstar a bubble conversation (per-user) |
| **Messages** | GET/POST `/api/bubbles/[id]/messages` | List/send messages (member-only) |
| **Bubble lifecycle** | POST `/api/bubbles/[id]/confirm` | Mark bubble as expired (end event) |
| **Moments** | GET `/api/moments`, POST `/api/moments` | List Wander Moments for feed; upload a new one (photo → Supabase Storage, row → `meetup_photos`), membership-checked |
| **Connections** | GET/POST/PATCH `/api/connections` | List accepted connections + incoming requests; send a request; accept/decline (receiver only) |
| **Campus events** | GET `/api/campus-events` | Campus event listings |
| **AI** | POST `/api/ai/parse-intent` | Gemini: natural language → structured bubble fields |
| **Recommendations** | GET `/api/recommendations?user_id=...` | Recommended bubbles — calls the optional ML service, falls back to a DB "starting soon" sort if the service is unset or fails |

Detailed route list and request/response shapes: see `src/app/api/README.md`.

---

## Database (Supabase)

Main tables:

- **users** – Id (references `auth.users`), email, name, campus_verified.
- **bubbles** – creator_id, activity, zone, time_window, start_time, duration_minutes, max_members, expires_at, status (open | active | expired).
- **bubble_members** – bubble_id, user_id (both FKs); creator is auto-added.
- **messages** – bubble_id, user_id, content, created_at.
- **connections** – requester_id, receiver_id, status (pending | accepted | declined), real API at `/api/connections`.
- **meetup_photos** – bubble_id, user_id, `cloudinary_url` (historical column name — holds the Supabase Storage public URL), caption, created_at.

Row Level Security (RLS) is enabled; the app uses the **service role** client in API routes for admin-style access. Realtime: `bubbles`, `messages`, and `meetup_photos` are all in the `supabase_realtime` publication, so the client can subscribe to new messages and new moments live.

Ensure `public.users` has a row for every auth user before inserting into `bubble_members` or setting `bubbles.creator_id`; the `ensureUserInPublic` helper (and `/api/auth/ensure-profile`) handles this, including anonymous users (placeholder email). It only ever creates the row once — it never overwrites an existing user's `name` or resets `campus_verified` on a later call.

---

## ML Service (Optional)

The **ml-service** is a FastAPI app that runs a K-means recommender for “Recommended for you” on the Home page.

- **Local:**
  `cd ml-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
  (Adjust entry point if your app is in `recommender_api.py` or another module; see `ml-service/README.md`.)

- **Deploy (e.g. Render):**
  Build: `cd ml-service && pip install -r requirements.txt`
  Start: `cd ml-service && PYTHONPATH=.. uvicorn main:app --host 0.0.0.0 --port $PORT`

Set `RECOMMENDATIONS_API_URL` to the deployed base URL. The Next.js app POSTs to `/recommend` with `user_id` and `activities` and maps the response to `recommended_bubbles`; if the call fails for any reason (service down, cold-start timeout, unset URL), `/api/recommendations` falls back to a plain DB "starting soon" sort rather than returning nothing.

**Keep this section and `.env.example` up to date if you deploy a real instance** — `RECOMMENDATIONS_API_URL` is intentionally only ever set in per-environment config, never committed, which means it's invisible to a static reachability sweep of the repo. Document the live URL somewhere your team actually looks (this README, your deploy platform's env var list, or your PRD) so a future cleanup pass doesn't reasonably conclude the feature is dead and remove it again.

See `ml-service/README.md` for endpoints and details.

---

## Mobile App

The `mobile/` directory is an Expo (React Native) client — feature-equivalent to the web app (campus-gated OTP auth, bubbles, map, chat, Wander Moments, connections) for iOS/Android.

### Run in development

```bash
cd mobile
npm install
cp .env.example .env.local   # fill in Supabase URL/anon key, see mobile/.env.example
npx expo start
```

Scan the QR code with the **Expo Go** app, or press `a` / `i` in the terminal to open an Android/iOS emulator.

### Building an installable app

`mobile/eas.json` has an `internal` profile configured (produces a directly-installable Android APK), linked to the `wanderers-mobile` EAS project (`projectId` committed in `mobile/app.json`). To produce a new build after making changes:

```bash
cd mobile
npx eas login                                   # free Expo account
npx eas build --profile internal --platform android
```

The build runs in Expo's cloud (~10–20 min); when it finishes you get a build page with a QR code and a direct `.apk` download link — install it on Android by opening that link and allowing "install from unknown sources".

**Important — env vars are separate from your local `.env`:** EAS Build runs on Expo's servers, which never see your local `mobile/.env` (it's gitignored). `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_API_BASE_URL` are inlined into the JS bundle at build time, so without them set remotely the installed app can't reach Supabase or the API at all. Set them once per environment (the `internal` profile resolves to the `preview` environment):

```bash
npx eas env:set preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://<project>.supabase.co" --visibility plaintext
npx eas env:set preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>" --visibility plaintext
npx eas env:set preview --name EXPO_PUBLIC_API_BASE_URL --value "https://www.wanderers.space" --visibility plaintext
```

Use the real deployed API URL here (not a local LAN IP) — a LAN IP only works while your own machine's dev server is running on the same network, which defeats the point of a distributable build. Check current values with `npx eas env:list preview`.

iOS internal builds need a paid Apple Developer account and either ad hoc distribution (registered device UDIDs) or TestFlight — see Expo's EAS Build docs (docs.expo.dev/build) for the iOS setup.

### Making a build downloadable from GitHub

Binaries aren't committed to git. Once a build exists, either:

- Attach the `.apk` as an asset on a [GitHub Release](../../releases) — gives a stable `github.com/<org>/<repo>/releases/download/...` link, or
- Link the EAS build page directly (Expo keeps it persistently accessible, with an install QR code).

**Latest build:** [Download APK](https://expo.dev/artifacts/eas/_qJEtSwPvmnnwnn_WQrsXmmXQtiddzMB3FY4BQUcJ1Q.apk) — built 2026-09-22 from `main`, points at the production `wanderers.space` API and Supabase project. Re-run `eas build` and update this link after significant mobile changes — the artifact link expires ~14 days after the build (per `eas build:list`), so it'll need refreshing periodically regardless.

---

## Deployment

- **Frontend + API** – Deploy the Next.js app to **Vercel** (or similar). Add all required env vars in the project settings; use the same Supabase and optional Gemini/ML keys as in local.
- **Maps** – In Google Cloud Console, restrict the Maps API key to your production domain (e.g. `https://yourapp.vercel.app/*`) and enable Maps JavaScript API (and billing if required).
- **Auth** – In Supabase, set Site URL and redirect URLs to your production URL. If using custom SMTP (Resend), ensure the sender domain is verified and SMTP is saved in Supabase.
- **Storage** – The `moments-photos` public bucket is created automatically on first photo upload if it doesn't already exist; no manual setup required.
- **ML** – Deploy the FastAPI service (e.g. Render), set `RECOMMENDATIONS_API_URL` in your deploy platform's env vars (not just locally), and ensure CORS allows your frontend origin.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

Private / not specified. See repository or team for terms.
