-- Trust & safety: user-to-user reporting and blocking.
--
-- Needed for a public launch - real-time chat + photo sharing between
-- strangers meeting in person requires a way to report abuse and block
-- someone, and it's a hard requirement for Apple App Store review
-- (Guideline 1.2, User Generated Content). See src/app/api/reports and
-- src/app/api/blocks for the application-side routes, and the block
-- filtering added to src/app/api/bubbles/[id]/messages, src/app/api/moments,
-- and src/app/api/connections.
--
-- Also relevant to account deletion: several existing FKs (messages.user_id,
-- meetup_photos.user_id, direct_messages.sender_id/receiver_id) don't
-- cascade on user delete - see comments in 20260820_baseline_schema.sql.
-- The account-deletion route explicitly cleans those up before calling
-- auth.admin.deleteUser(); this migration doesn't change that.

-- 1. reports ------------------------------------------------------------------
-- A user reporting a message, a Wander Moment photo, or another user
-- directly. Insert-only from the client - review/status changes are
-- service-role only, same as auth_rate_limits.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type = any (array['message','photo','user'])),
  target_id uuid not null,
  reason text,
  status text not null default 'open' check (status = any (array['open','reviewed','dismissed'])),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- No select/update policy for regular users - reports are reviewed via the
-- service-role client only.

create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- 2. blocks ---------------------------------------------------------------------
-- A user blocking another. Enforced at the DB level (RLS: only your own
-- blocks are visible/manageable) and at the application level, where
-- messages/moments/connections queries filter out blocked users' content.

create table if not exists public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select to authenticated using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks
  for insert to authenticated with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks
  for delete to authenticated using (auth.uid() = blocker_id);

create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);
