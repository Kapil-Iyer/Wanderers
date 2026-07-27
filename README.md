<<<<<<< HEAD
# Wanderers

**Find your people. Start something.**

Wanderers is a campus social app that helps people discover and join real-time activities (“bubbles”)—study sessions, sports, coffee meetups—then chat, meet up, and capture moments together.

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
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## Objective

- **Discover** – See nearby and upcoming activities (bubbles) on a map and in feeds.
- **Join** – One tap to join a bubble; chat unlocks when at least 2 people are in.
- **Coordinate** – Group chat per bubble, with optional AI icebreakers and meetup suggestions.
- **Meet & remember** – End an event, capture a “Wander Moment” (photo with filters), post to the shared feed.
- **Connect** – Send “Wanna Wander?” connection requests to people you met in a bubble.

The app supports **email OTP** (magic link / code) via Supabase Auth and optional **anonymous** sign-in. Bubbles have start time, duration, max members, and expiry; recommendations can be powered by an optional K-means ML service.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI, shadcn/ui |
| **Backend** | Next.js API Routes (serverless) |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Realtime) |
| **Email (OTP)** | Supabase Auth + custom SMTP (e.g. Resend) |
| **Media** | Local device save only (remote moment upload disabled) |
| **AI** | Google Gemini (intent parsing for “coffee near SLC tonight” → structured bubble fields) |
| **ML** | Optional FastAPI service (K-means recommender for “Recommended for you”) |
| **Maps** | Google Maps JavaScript API (@react-google-maps/api) |

---

## Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)
- **Supabase** account
- **Google Cloud** project (for Maps API key)
- Optional: **Resend** account (for custom SMTP), **Google AI** API key (Gemini), **Render** or similar (for ML service)

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
| `NEXT_PUBLIC_SITE_URL` | Full app URL (e.g. `https://yourapp.vercel.app`) for auth redirects |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key (map and bubbles) |

### Auth (OTP emails)

Supabase sends OTP/magic link emails. With **built-in** SMTP you get a low rate limit (~2 emails/h). For production, configure **custom SMTP** in Supabase (e.g. Resend) and optionally set:

| Variable | Description |
|----------|-------------|
| *(none)* | SMTP is configured in Supabase Dashboard → Project Settings → Auth → SMTP |

### Gemini (intent parsing)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI API key (server-only) |
| `GEMINI_MODEL` | Optional; default `gemini-2.5-flash` |

### ML recommendations

| Variable | Description |
|----------|-------------|
| `RECOMMENDATIONS_API_URL` | Base URL of the FastAPI ML service (e.g. `https://wanderers-ml.onrender.com`). If unset, recommendations fall back to open/active bubbles from DB. |

### Dev / debug

| Variable | Description |
|----------|-------------|
| *(none currently)* | — |

---

## Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd Fahh
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

   Open [http://localhost:3000](http://localhost:3000). Sign up or log in (OTP or anonymous if enabled), then use Home, Map, Messages, and Profile.

5. **(Optional) ML service**

   See [ML Service (Optional)](#ml-service-optional). Set `RECOMMENDATIONS_API_URL` to the ML service URL to enable “Recommended for you” from the K-means recommender.

---

## Project Structure

```
Fahh/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (auth, bubbles, media, moments, ai, recommendations)
│   │   ├── home/               # Home feed
│   │   ├── chat/[id]/          # Bubble chat
│   │   ├── messages/           # Conversations list
│   │   ├── my-bubbles/         # User’s bubbles
│   │   ├── profile/            # Profile
│   │   ├── onboarding/         # Onboarding
│   │   ├── map/                # Map + activities overlay
│   │   ├── page.tsx            # Landing (auth modal)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── AuthModal.tsx       # Login/signup + OTP verify
│   │   ├── MapOverlay.tsx      # Map + bubble list + join
│   │   ├── CreateBubbleModal.tsx
│   │   ├── EndEventModal.tsx   # Wander Moment capture + upload
│   │   └── ...
│   ├── contexts/              # React context (Conversations, Connections, Map, Profile)
│   ├── lib/                    # Utilities and clients
│   │   ├── supabase.ts         # Browser Supabase client
│   │   ├── supabaseAdmin.ts    # Server-only admin client
│   │   ├── auth.ts             # getAuthUser(request) for API routes
│   │   ├── ensureUser.ts       # ensureUserInPublic (public.users upsert)
│   │   ├── gemini.ts           # Gemini client for intent parsing
│   │   └── mockData.ts         # Mock data for UI fallbacks
│   └── hooks/
├── ml-service/                 # Optional FastAPI K-means recommender
│   ├── main.py                 # FastAPI app (e.g. /recommend, /health)
│   ├── recommender_api.py      # K-means logic
│   └── model/                  # K-means model and synthetic data
├── .env.local                  # Local env (not committed)
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── package.json
└── README.md                   # This file
```

---

## Features

- **Landing & auth** – Email OTP (magic link or 6-digit code) via Supabase; optional anonymous sign-in. After verify, user is upserted into `public.users`.
- **Home** – “Upcoming for you” (ML recommendations or DB fallback), filter chips, “Active Nearby” bubbles, Recent Moments feed.
- **Map** – Google Map with bubbles by zone; list of activities with “Join Bubble”; join creates/uses real bubbles and opens group chat.
- **Create bubble** – Manual form or natural language (Gemini) → activity, zone, time, duration, max members.
- **Bubble chat** – Messages per bubble; Realtime subscription for new messages; chat unlocks at 2 members.
- **End event** – Confirm bubble as ended; optional local photo preview/save (remote upload disabled).
- **Connections** – “Wanna Wander?” requests and list (ConversationsContext / ConnectionsContext).
- **Profile & onboarding** – Onboarding preferences; profile stats and links.

---

## API Overview

All auth-protected routes expect `Authorization: Bearer <access_token>` (Supabase session).

| Area | Methods | Purpose |
|------|---------|---------|
| **Auth** | POST `/api/auth/login`, `/api/auth/signup`, `/api/auth/verify`, `/api/auth/ensure-profile` | OTP login/signup, verify, ensure `public.users` row |
| **Bubbles** | POST `/api/bubbles`, POST `/api/bubbles/join`, GET `/api/bubbles/list`, GET `/api/bubbles/mine`, GET `/api/bubbles/[id]` | Create, join, list, single bubble |
| **Messages** | GET/POST `/api/bubbles/[id]/messages` | List/send messages (member-only) |
| **Bubble lifecycle** | POST `/api/bubbles/[id]/confirm` | Mark bubble as expired (end event) |
| **Media** | POST `/api/media/upload` | Disabled (410) — remote moment upload removed |
| **Moments** | GET `/api/moments` | List Wander Moments for feed |
| **AI** | POST `/api/ai/parse-intent` | Gemini: natural language → structured bubble fields |
| **Recommendations** | GET `/api/recommendations?user_id=...` | Recommended bubbles (ML or DB fallback) |
| **Seed** | POST `/api/seed-demo-bubbles` | Create sample bubbles (auth required) |

Detailed route list and request/response shapes: see `src/app/api/README.md`.

---

## Database (Supabase)

Main tables:

- **users** – Id (references `auth.users`), email, name, campus_verified.
- **bubbles** – creator_id, activity, zone, time_window, start_time, duration_minutes, max_members, expires_at, status (open | active | expired).
- **bubble_members** – bubble_id, user_id (both FKs); creator is auto-added.
- **messages** – bubble_id, user_id, content, created_at.
- **connections** – requester_id, receiver_id, status (e.g. pending).
- **meetup_photos** – bubble_id, user_id, image URL column, created_at (legacy column name may still be `cloudinary_url`).

Row Level Security (RLS) is enabled; the app uses the **service role** client in API routes for admin-style access. Realtime: add `messages` (and optionally `meetup_photos`) to the `supabase_realtime` publication so the client can subscribe to new messages.

Ensure `public.users` has a row for every auth user before inserting into `bubble_members` or setting `bubbles.creator_id`; the `ensureUserInPublic` helper (and `/api/auth/ensure-profile`) handles this, including anonymous users (placeholder email).

---

## ML Service (Optional)

The **ml-service** is a FastAPI app that runs a K-means recommender for “Recommended for you” on the Home page.

- **Local:**  
  `cd ml-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`  
  (Adjust entry point if your app is in `recommender_api.py` or another module; see `ml-service/README.md`.)

- **Deploy (e.g. Render):**  
  Build: `cd ml-service && pip install -r requirements.txt`  
  Start: `cd ml-service && PYTHONPATH=.. uvicorn main:app --host 0.0.0.0 --port $PORT`

Set `RECOMMENDATIONS_API_URL` to the deployed base URL (e.g. `https://wanderers-ml.onrender.com`). The Next.js app POSTs to `/recommend` with `user_id` and `activities` and maps the response to `recommended_bubbles`.

See `ml-service/README.md` for endpoints and details.

---

## Deployment

- **Frontend + API** – Deploy the Next.js app to **Vercel** (or similar). Add all required env vars in the project settings; use the same Supabase and optional Gemini/ML keys as in local.
- **Maps** – In Google Cloud Console, restrict the Maps API key to your production domain (e.g. `https://yourapp.vercel.app/*`) and enable Maps JavaScript API (and billing if required).
- **Auth** – In Supabase, set Site URL and redirect URLs to your production URL. If using custom SMTP (Resend), ensure the sender domain is verified and SMTP is saved in Supabase.
- **ML** – Deploy the FastAPI service (e.g. Render), set `RECOMMENDATIONS_API_URL`, and ensure CORS allows your frontend origin.

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
=======


>>>>>>> 7a31f3ebd762ec64227e511bbcebb821cb180451
