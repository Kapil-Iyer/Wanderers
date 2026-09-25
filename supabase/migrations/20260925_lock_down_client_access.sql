-- Lock down direct client (anon-key) access to what the apps actually use.
--
-- Every write in the web and mobile apps goes through the Next.js API
-- routes, which use the service-role client and bypass RLS entirely (see
-- src/app/api/README.md). The only direct anon-key access is:
--   - reading your OWN public.users row (web home/profile, mobile
--     profile/tabs layout)
--   - Realtime subscriptions on messages, bubble_members (web chat) and
--     meetup_photos (web home)
--
-- The baseline policies allowed much more, which let any signed-in user
-- skip the API's validation by calling PostgREST directly with the public
-- anon key:
--   - read every user's email (users_select_authenticated was using(true))
--   - post a Wander Moment with an arbitrary image URL to any bubble
--     (meetup_photos insert had no membership check)
--   - join full/expired bubbles, post over-length messages, bypass rate
--     limits, set their own campus_verified = true, etc.
-- Also, check_rate_limit() and cleanup_expired_bubbles() are SECURITY
-- DEFINER and were executable by anon via RPC - anyone could burn another
-- user's login attempts ("auth-login:<their email>") and lock them out.
--
-- After this migration: no insert/update/delete from anon/authenticated on
-- any app table, users are readable only by their owner, and
-- bubble_members/messages are readable only by members of that bubble.

-- 1. Membership check usable inside policies --------------------------------
-- SECURITY DEFINER so a bubble_members policy can look up bubble_members
-- without recursing into its own RLS.

create or replace function public.is_bubble_member(p_bubble_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bubble_members
    where bubble_id = p_bubble_id and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_bubble_member(uuid) from public, anon;
grant execute on function public.is_bubble_member(uuid) to authenticated;

-- 2. Read policies ------------------------------------------------------------

-- users: own row only (users_select_own already exists).
drop policy if exists "users_select_authenticated" on public.users;

-- bubble_members: only co-members can see who's in a bubble.
drop policy if exists "bubble_members_select_authenticated" on public.bubble_members;
drop policy if exists "bubble_members_select_co_members" on public.bubble_members;
create policy "bubble_members_select_co_members" on public.bubble_members
  for select to authenticated using (public.is_bubble_member(bubble_id));

-- messages: same rule, via the helper.
drop policy if exists "messages_select_members" on public.messages;
create policy "messages_select_members" on public.messages
  for select to authenticated using (public.is_bubble_member(bubble_id));

-- 3. Drop every client write policy ---------------------------------------

drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "bubbles_insert_authenticated" on public.bubbles;
drop policy if exists "bubbles_update_creator" on public.bubbles;
drop policy if exists "bubbles_delete_creator" on public.bubbles;
drop policy if exists "bubble_members_insert_self" on public.bubble_members;
drop policy if exists "bubble_members_delete_self" on public.bubble_members;
drop policy if exists "messages_insert_members" on public.messages;
drop policy if exists "connections_insert_as_requester" on public.connections;
drop policy if exists "connections_update_receiver" on public.connections;
drop policy if exists "dm_insert_as_sender" on public.direct_messages;
drop policy if exists "meetup_photos_insert_self" on public.meetup_photos;
drop policy if exists "bubble_stars: insert own" on public.bubble_stars;
drop policy if exists "bubble_stars: delete own" on public.bubble_stars;
drop policy if exists "reports_insert_own" on public.reports;
drop policy if exists "blocks_insert_own" on public.blocks;
drop policy if exists "blocks_delete_own" on public.blocks;

-- Belt and braces: remove the table-level write grants Supabase gives
-- anon/authenticated by default, so a policy added later by mistake can't
-- silently reopen writes. service_role keeps its own grants.
revoke insert, update, delete, truncate on
  public.users,
  public.bubbles,
  public.bubble_members,
  public.messages,
  public.connections,
  public.direct_messages,
  public.meetup_photos,
  public.campus_events,
  public.bubble_stars,
  public.auth_rate_limits,
  public.reports,
  public.blocks
from anon, authenticated;

-- 4. Server-only functions ----------------------------------------------------

-- The API routes call check_rate_limit() as service_role; pg_cron runs the
-- cleanup as the function owner, so neither is affected.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
revoke execute on function public.cleanup_expired_bubbles() from public, anon, authenticated;
