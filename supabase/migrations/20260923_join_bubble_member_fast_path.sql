-- join_bubble(): skip the row lock when the caller is already a member.
--
-- The previous definition took `select ... for update` on the bubble row
-- before checking membership. That was fine for POST /api/bubbles/join, which
-- is genuinely a mutation, but ensureBubbleMembership() also calls this on
-- every messages GET and POST. The effect was that all chat traffic in a
-- bubble serialised on one row lock: two people typing at once, or one person
-- typing while another's fallback poll ran, would queue behind each other.
--
-- An existing member changes nothing, so that case needs no lock at all. The
-- lock is now taken only on the path that can actually insert, and the
-- capacity check is re-run under it - so the overfill race this function was
-- written to fix is still fixed.

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
begin
  -- Unlocked read. Enough to answer for someone who is already in the bubble.
  select id, expires_at, max_members, status
    into v_bubble
  from public.bubbles
  where id = p_bubble_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_bubble.status = 'expired' or v_bubble.expires_at < now() then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  if exists (
    select 1 from public.bubble_members
    where bubble_id = p_bubble_id and user_id = p_user_id
  ) then
    select count(*) into v_count
    from public.bubble_members
    where bubble_id = p_bubble_id;

    return jsonb_build_object(
      'ok', true, 'already_member', true, 'members_count', v_count
    );
  end if;

  -- Mutating path only from here. Re-read under the lock: everything checked
  -- above could have changed between the two statements.
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

  -- Someone else may have inserted this same membership while we waited for
  -- the lock.
  if exists (
    select 1 from public.bubble_members
    where bubble_id = p_bubble_id and user_id = p_user_id
  ) then
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

revoke all on function public.join_bubble(uuid, uuid) from public, anon, authenticated;
