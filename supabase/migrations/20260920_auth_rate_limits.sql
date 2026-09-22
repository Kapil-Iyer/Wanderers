-- Rate limiting for the auth endpoints (/api/auth/login, /verify,
-- /forgot-password). Vercel's serverless functions are stateless and
-- multi-instance, so an in-memory counter in the route handler doesn't
-- work - this table + function give every instance a shared, atomic
-- counter per (action, identifier) key. See src/lib/rateLimit.ts for the
-- application-side wrapper that calls check_rate_limit().
--
-- Never touched by anon/authenticated clients - only the service-role
-- client (getSupabaseAdmin()) used by the API routes reaches this table,
-- so RLS is enabled with no policies (default deny) rather than the
-- per-user policies the rest of the schema uses.

create table if not exists public.auth_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 1
);

alter table public.auth_rate_limits enable row level security;

-- Atomic check-and-increment: one upsert statement per call, so concurrent
-- requests for the same key can't race past the limit. Resets the window
-- (rather than blocking forever) once window_seconds has elapsed.
-- Returns true if the caller is still within max_attempts, false if not.
create or replace function public.check_rate_limit(
  p_key text,
  p_max_attempts int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.auth_rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when public.auth_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else public.auth_rate_limits.count + 1
        end,
        window_start = case
          when public.auth_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else public.auth_rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_max_attempts;
end;
$$;
