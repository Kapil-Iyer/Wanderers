-- Per-person "star" on a bubble, plus a daily cleanup job that removes a
-- bubble from a user's own conversation list 5 days after it expires,
-- UNLESS that specific user starred it. This is per-person, not shared:
-- one member starring a bubble does not save it for anyone else.
--
-- "Your conversations" is derived from bubble_members (see
-- src/app/api/bubbles/mine/route.ts), so removing a user's own
-- bubble_members row is what actually makes it disappear from their inbox.
-- Once a bubble has zero members left (everyone's either left or been
-- pruned) and nobody starred it, the bubble + its messages are hard-deleted
-- to actually reclaim storage.

-- 1. Star table -------------------------------------------------------------

create table if not exists public.bubble_stars (
  user_id uuid not null references auth.users(id) on delete cascade,
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bubble_id)
);

alter table public.bubble_stars enable row level security;

-- Each user can only see/manage their own stars.
create policy "bubble_stars: select own" on public.bubble_stars
  for select using (auth.uid() = user_id);

create policy "bubble_stars: insert own" on public.bubble_stars
  for insert with check (auth.uid() = user_id);

create policy "bubble_stars: delete own" on public.bubble_stars
  for delete using (auth.uid() = user_id);

create index if not exists bubble_stars_bubble_id_idx on public.bubble_stars (bubble_id);

-- 2. Cleanup function ---------------------------------------------------------

create or replace function public.cleanup_expired_bubbles()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Step 1: for bubbles expired 5+ days, drop the membership row for any
  -- member who did NOT star that specific bubble. This is what makes the
  -- bubble disappear from *their* conversations list — it's per-person:
  -- another member who starred it (or hasn't hit 5 days yet) keeps seeing it.
  delete from public.bubble_members bm
  using public.bubbles b
  where bm.bubble_id = b.id
    and b.expires_at is not null
    and b.expires_at < now() - interval '5 days'
    and not exists (
      select 1 from public.bubble_stars bs
      where bs.user_id = bm.user_id and bs.bubble_id = bm.bubble_id
    );

  -- Step 2: once a bubble has no members left at all (everyone either left,
  -- was pruned above, or nobody ever joined) and it's past the 5-day mark,
  -- hard-delete it and its messages to actually reclaim storage. Children
  -- are deleted explicitly first since these FKs have no cascade rule.
  delete from public.messages
  where bubble_id in (
    select b.id from public.bubbles b
    where b.expires_at is not null
      and b.expires_at < now() - interval '5 days'
      and not exists (select 1 from public.bubble_members m where m.bubble_id = b.id)
  );

  delete from public.bubbles b
  where b.expires_at is not null
    and b.expires_at < now() - interval '5 days'
    and not exists (select 1 from public.bubble_members m where m.bubble_id = b.id);
end;
$$;

-- 3. Schedule it daily via pg_cron -------------------------------------------

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'cleanup-expired-bubbles-daily',
  '0 6 * * *', -- 6am UTC daily
  $$ select public.cleanup_expired_bubbles(); $$
);
