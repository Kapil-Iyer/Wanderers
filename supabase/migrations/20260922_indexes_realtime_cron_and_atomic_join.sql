-- Brings the migration tree up to what the running app actually needs.
--
-- Four things the app depends on at runtime were only ever written down in
-- docs/schema.sql, which is reference documentation and never applied by the
-- Supabase CLI. A project provisioned from supabase/migrations/ alone came up
-- with no secondary indexes, no Realtime delivery, and no bubble expiry - it
-- looked healthy and then behaved badly under real traffic.
--
--   1. Every secondary index (the baseline migration has none)
--   2. Realtime publication membership for the tables the client subscribes to
--   3. The expire-bubbles cron that flips status to 'expired'
--   4. An atomic join, replacing a count-then-insert race in the API route
--
-- Everything here is idempotent and safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. Indexes
-- -----------------------------------------------------------------------------
-- Ported from docs/schema.sql:179-197, plus two the app has grown since.

-- /api/bubbles/list and /api/recommendations filter on status + expires_at and
-- order by start_time. This is the hottest read path in the product.
create index if not exists idx_bubbles_status on public.bubbles (status);
create index if not exists idx_bubbles_expires_at on public.bubbles (expires_at);
create index if not exists idx_bubbles_creator_id on public.bubbles (creator_id);
create index if not exists idx_bubbles_status_expires_at on public.bubbles (status, expires_at);
create index if not exists idx_bubbles_start_time on public.bubbles (start_time);

-- POST /api/bubbles dedupes double-taps with
-- (creator_id, activity, created_at >= now() - 10s). Without this the check is
-- a sequential scan on every single create, and it gets slower as the table
-- grows - i.e. worst exactly during a burst of concurrent creates.
create index if not exists idx_bubbles_creator_activity_created_at
  on public.bubbles (creator_id, activity, created_at desc);

-- Chat history: filtered by bubble_id, ordered by created_at.
create index if not exists idx_messages_bubble_id on public.messages (bubble_id);
create index if not exists idx_messages_created_at on public.messages (created_at);
create index if not exists idx_messages_bubble_id_created_at
  on public.messages (bubble_id, created_at);

-- bubble_members' primary key is (bubble_id, user_id), so bubble_id lookups
-- ride the PK prefix but user_id alone does not. /api/bubbles/mine filters on
-- user_id on every app load.
create index if not exists idx_bubble_members_user_id on public.bubble_members (user_id);

create index if not exists idx_direct_messages_sender_id on public.direct_messages (sender_id);
create index if not exists idx_direct_messages_receiver_id on public.direct_messages (receiver_id);
create index if not exists idx_direct_messages_created_at on public.direct_messages (created_at);

create index if not exists idx_meetup_photos_bubble_id on public.meetup_photos (bubble_id);
-- /api/moments orders by created_at desc limit 20.
create index if not exists idx_meetup_photos_created_at on public.meetup_photos (created_at desc);

create index if not exists idx_campus_events_date_time on public.campus_events (date_time);
create index if not exists idx_campus_events_category on public.campus_events (category);

-- connections' primary key covers (requester_id, receiver_id), but
-- /api/connections filters with an OR across both columns, so the
-- receiver-leading direction needs its own index.
create index if not exists idx_connections_receiver_id on public.connections (receiver_id);

-- -----------------------------------------------------------------------------
-- 2. Realtime publication
-- -----------------------------------------------------------------------------
-- Without these, postgres_changes subscriptions connect successfully and then
-- silently never fire. docs/schema.sql only listed bubbles and messages, but
-- the chat page also subscribes to bubble_members and the home feed subscribes
-- to meetup_photos.

do $$
declare
  t text;
begin
  foreach t in array array['bubbles', 'messages', 'bubble_members', 'meetup_photos']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Auto-expire bubbles
-- -----------------------------------------------------------------------------
-- expires_at is written by the API rather than being a generated column, so
-- nothing flips status to 'expired' on its own. /api/bubbles/list and the join
-- path both filter on that status, so without this job expired bubbles keep
-- showing up in the feed as joinable.

create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'expire-bubbles') then
    perform cron.unschedule('expire-bubbles');
  end if;
end $$;

select cron.schedule(
  'expire-bubbles',
  '*/5 * * * *',
  $$
    update public.bubbles
    set status = 'expired'
    where expires_at < now()
      and status <> 'expired';
  $$
);

-- -----------------------------------------------------------------------------
-- 4. Batched member counts
-- -----------------------------------------------------------------------------
-- /api/bubbles/list, /api/recommendations and /api/bubbles/mine each used to
-- run one `count: exact` query per bubble inside a Promise.all - 52 database
-- round trips to render a 50-bubble map. This aggregates in one statement.
--
-- Deliberately an RPC rather than selecting bubble_members and tallying in JS:
-- PostgREST caps rows returned (1000 by default), so a client-side tally would
-- silently under-count once a busy campus crossed that many memberships. This
-- returns one row per bubble instead, so the response size is bounded by the
-- number of bubbles asked about.

create or replace function public.bubble_member_counts(
  p_bubble_ids uuid[]
) returns table (bubble_id uuid, members_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select m.bubble_id, count(*) as members_count
  from public.bubble_members m
  where m.bubble_id = any(p_bubble_ids)
  group by m.bubble_id;
$$;

revoke all on function public.bubble_member_counts(uuid[]) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Atomic join
-- -----------------------------------------------------------------------------
-- The API route previously counted members, compared against max_members, and
-- then inserted - three statements with no lock between them. Two users racing
-- for the last seat both read the same count, both passed the check, and both
-- inserted, overfilling the bubble. Duplicate joins were already prevented by
-- the (bubble_id, user_id) primary key; capacity was not.
--
-- `select ... for update` takes a row lock on the bubble, so concurrent joins
-- for the same bubble serialize behind it and each one sees the previous
-- insert. Joins for different bubbles are unaffected.
--
-- Returns jsonb so the route can map outcomes to HTTP status codes without a
-- second round trip for the member count.

create or replace function public.join_bubble(
  p_bubble_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bubble record;
  v_count int;
  v_already boolean;
begin
  select id, expires_at, max_members, status
    into v_bubble
  from public.bubbles
  where id = p_bubble_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_bubble.status = 'expired' or v_bubble.expires_at < now() then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  select count(*) into v_count
  from public.bubble_members
  where bubble_id = p_bubble_id;

  select exists (
    select 1 from public.bubble_members
    where bubble_id = p_bubble_id and user_id = p_user_id
  ) into v_already;

  if v_already then
    return jsonb_build_object(
      'ok', true, 'already_member', true, 'members_count', v_count
    );
  end if;

  if v_bubble.max_members is not null and v_count >= v_bubble.max_members then
    return jsonb_build_object(
      'ok', false, 'code', 'full', 'members_count', v_count
    );
  end if;

  insert into public.bubble_members (bubble_id, user_id)
  values (p_bubble_id, p_user_id);

  v_count := v_count + 1;

  -- A bubble stops being merely 'open' once a second person is in it.
  if v_count >= 2 and v_bubble.status <> 'active' then
    update public.bubbles set status = 'active' where id = p_bubble_id;
  end if;

  return jsonb_build_object(
    'ok', true, 'already_member', false, 'members_count', v_count
  );
end;
$$;

-- Only the service-role client (the API routes) calls this.
revoke all on function public.join_bubble(uuid, uuid) from public, anon, authenticated;
