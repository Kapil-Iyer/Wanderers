-- =============================================================================
-- Wanderers — production schema (Week 1)
-- Branch: guransh/database-schema
--
-- How to run (Supabase SQL Editor):
--   1. Open Project → SQL Editor → New query
--   2. Paste this entire file (or run section by section)
--   3. Click Run
--
-- Safe on existing projects: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- Does NOT drop tables or wipe data.
-- Service role bypasses RLS (API admin client keeps working).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- Tables (create if missing)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  campus_verified boolean DEFAULT false,
  vibe text,
  personality_traits text[],
  interests text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bubbles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES public.users(id),
  emoji text,
  activity text NOT NULL,
  zone text NOT NULL,
  description text,
  exact_location text,
  time_window text,
  start_time timestamptz,
  duration_minutes integer DEFAULT 60,
  expires_at timestamptz,
  max_members integer DEFAULT 6,
  status text DEFAULT 'open' CHECK (status IN ('open', 'active', 'expired')),
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bubble_members (
  bubble_id uuid REFERENCES public.bubbles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (bubble_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id uuid REFERENCES public.bubbles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.users(id),
  receiver_id uuid NOT NULL REFERENCES public.users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT direct_messages_no_self_check CHECK (sender_id <> receiver_id)
);

CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES public.users(id),
  receiver_id uuid REFERENCES public.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.meetup_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id uuid REFERENCES public.bubbles(id),
  user_id uuid REFERENCES public.users(id),
  cloudinary_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campus_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL,
  zone text,
  date_time timestamptz NOT NULL,
  organizer text,
  category text CHECK (category IN ('academic', 'social', 'sports', 'arts', 'career')),
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Migrate existing DBs: add missing columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vibe text,
  ADD COLUMN IF NOT EXISTS personality_traits text[],
  ADD COLUMN IF NOT EXISTS interests text[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_vibe_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_vibe_check
      CHECK (
        vibe IS NULL OR vibe IN (
          'late_night_grinder',
          'coffee_regular',
          'sports',
          'study_buddy',
          'explorer'
        )
      );
  END IF;
END $$;

ALTER TABLE public.bubbles
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS exact_location text,
  ADD COLUMN IF NOT EXISTS time_window text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_members integer,
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.meetup_photos
  ADD COLUMN IF NOT EXISTS caption text;

ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS id uuid;

UPDATE public.connections
SET id = gen_random_uuid()
WHERE id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.connections'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.connections
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT gen_random_uuid(),
      ADD PRIMARY KEY (id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_bubbles_status ON public.bubbles (status);
CREATE INDEX IF NOT EXISTS idx_bubbles_expires_at ON public.bubbles (expires_at);
CREATE INDEX IF NOT EXISTS idx_bubbles_creator_id ON public.bubbles (creator_id);
CREATE INDEX IF NOT EXISTS idx_bubbles_status_expires_at ON public.bubbles (status, expires_at);

CREATE INDEX IF NOT EXISTS idx_messages_bubble_id ON public.messages (bubble_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_bubble_id_created_at ON public.messages (bubble_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bubble_members_user_id ON public.bubble_members (user_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON public.direct_messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages (created_at);

CREATE INDEX IF NOT EXISTS idx_meetup_photos_bubble_id ON public.meetup_photos (bubble_id);

CREATE INDEX IF NOT EXISTS idx_campus_events_date_time ON public.campus_events (date_time);
CREATE INDEX IF NOT EXISTS idx_campus_events_category ON public.campus_events (category);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bubbles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bubble_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_authenticated ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_select_authenticated ON public.users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- bubbles
DROP POLICY IF EXISTS bubbles_select_open_active ON public.bubbles;
DROP POLICY IF EXISTS bubbles_select_creator ON public.bubbles;
DROP POLICY IF EXISTS bubbles_insert_authenticated ON public.bubbles;
DROP POLICY IF EXISTS bubbles_update_creator ON public.bubbles;
DROP POLICY IF EXISTS bubbles_delete_creator ON public.bubbles;

CREATE POLICY bubbles_select_open_active ON public.bubbles
  FOR SELECT TO authenticated
  USING (status IN ('open', 'active'));

CREATE POLICY bubbles_select_creator ON public.bubbles
  FOR SELECT TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY bubbles_insert_authenticated ON public.bubbles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY bubbles_update_creator ON public.bubbles
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY bubbles_delete_creator ON public.bubbles
  FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- bubble_members
DROP POLICY IF EXISTS bubble_members_select_authenticated ON public.bubble_members;
DROP POLICY IF EXISTS bubble_members_insert_self ON public.bubble_members;
DROP POLICY IF EXISTS bubble_members_delete_self ON public.bubble_members;

CREATE POLICY bubble_members_select_authenticated ON public.bubble_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY bubble_members_insert_self ON public.bubble_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY bubble_members_delete_self ON public.bubble_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS messages_select_members ON public.messages;
DROP POLICY IF EXISTS messages_insert_members ON public.messages;

CREATE POLICY messages_select_members ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bubble_members bm
      WHERE bm.bubble_id = messages.bubble_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY messages_insert_members ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.bubble_members bm
      WHERE bm.bubble_id = messages.bubble_id
        AND bm.user_id = auth.uid()
    )
  );

-- direct_messages
DROP POLICY IF EXISTS dm_select_participants ON public.direct_messages;
DROP POLICY IF EXISTS dm_insert_as_sender ON public.direct_messages;

CREATE POLICY dm_select_participants ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY dm_insert_as_sender ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- connections
DROP POLICY IF EXISTS connections_select_participants ON public.connections;
DROP POLICY IF EXISTS connections_insert_as_requester ON public.connections;
DROP POLICY IF EXISTS connections_update_receiver ON public.connections;

CREATE POLICY connections_select_participants ON public.connections
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY connections_insert_as_requester ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY connections_update_receiver ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- meetup_photos
DROP POLICY IF EXISTS meetup_photos_select_authenticated ON public.meetup_photos;
DROP POLICY IF EXISTS meetup_photos_insert_self ON public.meetup_photos;

CREATE POLICY meetup_photos_select_authenticated ON public.meetup_photos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY meetup_photos_insert_self ON public.meetup_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- campus_events (read-only for authenticated; writes via service role)
DROP POLICY IF EXISTS campus_events_select_authenticated ON public.campus_events;

CREATE POLICY campus_events_select_authenticated ON public.campus_events
  FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- Realtime publication
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bubbles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bubbles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Auto-expire bubbles (every 5 minutes)
-- Note: expires_at is stored by the API (not a GENERATED column) so POST /api/bubbles keeps working.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-bubbles') THEN
    PERFORM cron.unschedule('expire-bubbles');
  END IF;
END $$;

SELECT cron.schedule(
  'expire-bubbles',
  '*/5 * * * *',
  $$
    UPDATE public.bubbles
    SET status = 'expired'
    WHERE expires_at < now()
      AND status <> 'expired';
  $$
);

-- -----------------------------------------------------------------------------
-- Seed campus events (only if table is empty)
-- -----------------------------------------------------------------------------

INSERT INTO public.campus_events
  (title, location, zone, date_time, organizer, category, source_url)
SELECT * FROM (VALUES
  (
    'Math Help Centre Drop-in',
    'MC 3rd Floor',
    'MC',
    now() + interval '2 days' + interval '14 hours',
    'Faculty of Mathematics',
    'academic',
    'https://uwaterloo.ca/math'
  ),
  (
    'DC Study Hall — Midterm Prep',
    'DC Library',
    'DC',
    now() + interval '5 days' + interval '18 hours',
    'Federation of Students',
    'academic',
    'https://feds.ca'
  ),
  (
    'E7 Peer Tutoring Night',
    'Engineering 7 Atrium',
    'E7',
    now() + interval '9 days' + interval '17 hours',
    'Engineering Society',
    'academic',
    'https://uwaterloo.ca/engineering'
  ),
  (
    'SLC Club Fair Spotlight',
    'SLC Great Hall',
    'SLC',
    now() + interval '3 days' + interval '12 hours',
    'Campus Life',
    'social',
    'https://uwaterloo.ca'
  ),
  (
    'QNC Coffee & Connect',
    'QNC Courtyard',
    'QNC',
    now() + interval '8 days' + interval '15 hours',
    'Science Society',
    'social',
    'https://uwaterloo.ca/science'
  ),
  (
    'Laurel Creek Sunset Walk',
    'Laurel Creek Trailhead',
    'Laurel Creek',
    now() + interval '12 days' + interval '19 hours',
    'Outdoor Club',
    'social',
    'https://uwaterloo.ca'
  ),
  (
    'Intramural Basketball Signups',
    'PAC Gym 1',
    'PAC',
    now() + interval '1 day' + interval '16 hours',
    'Campus Recreation',
    'sports',
    'https://uwaterloo.ca/campus-recreation'
  ),
  (
    'Pickup Soccer — Columbia Fields',
    'Columbia Fields',
    'Columbia Fields',
    now() + interval '6 days' + interval '18 hours',
    'Intramurals',
    'sports',
    'https://uwaterloo.ca/campus-recreation'
  ),
  (
    'PAC Open Gym Night',
    'PAC Main Gym',
    'PAC',
    now() + interval '14 days' + interval '20 hours',
    'Campus Recreation',
    'sports',
    'https://uwaterloo.ca/campus-recreation'
  ),
  (
    'SLC Open Mic Night',
    'SLC Bombshelter Pub',
    'SLC',
    now() + interval '4 days' + interval '20 hours',
    'Arts Student Union',
    'arts',
    'https://uwaterloo.ca/arts'
  ),
  (
    'Improv Workshop',
    'Hagey Hall Studio',
    'HH',
    now() + interval '10 days' + interval '17 hours',
    'Drama Society',
    'arts',
    'https://uwaterloo.ca/arts'
  ),
  (
    'Campus Photography Walk',
    'DC → QNC Loop',
    'DC',
    now() + interval '16 days' + interval '16 hours',
    'Photo Club',
    'arts',
    'https://uwaterloo.ca'
  ),
  (
    'Co-op Resume Clinic',
    'TC Career Centre',
    'TC',
    now() + interval '2 days' + interval '13 hours',
    'Centre for Career Action',
    'career',
    'https://uwaterloo.ca/career-action'
  ),
  (
    'Tech Networking Mixer',
    'E7 Ideation Studio',
    'E7',
    now() + interval '11 days' + interval '17 hours',
    'WatIAM Career Services',
    'career',
    'https://uwaterloo.ca/career-action'
  ),
  (
    'Startup Founder Fireside Chat',
    'Velocity Garage',
    'E5',
    now() + interval '18 days' + interval '18 hours',
    'Velocity',
    'career',
    'https://velocityincubator.com'
  )
) AS v(title, location, zone, date_time, organizer, category, source_url)
WHERE NOT EXISTS (SELECT 1 FROM public.campus_events LIMIT 1);

-- =============================================================================
-- Verify (optional — run after apply)
-- =============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
--   AND tablename IN ('users','bubbles','bubble_members','messages','direct_messages','connections','meetup_photos','campus_events');
-- SELECT * FROM cron.job WHERE jobname = 'expire-bubbles';
-- SELECT count(*) FROM campus_events;
-- SELECT schemaname, tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND tablename IN ('bubbles','messages');
