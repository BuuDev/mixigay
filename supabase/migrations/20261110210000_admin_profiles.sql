-- Admin view of profiles for the moderation center (/admin/duyet, /admin/nguoi-dung).
-- profiles.trust has no column grant (a shadow ban must stay invisible to its target), so
-- admins read it through this function instead of the service-role key. It returns only
-- what moderation needs; sign-in handles (account_logins) stay service-role only.
create or replace function public.admin_profiles(
  p_ids uuid[] default null,
  p_q text default null,
  p_trust smallint default null,
  p_limit int default 50
) returns table (id uuid, display_name text, created_at timestamptz, trust smallint, verified boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select p.id, p.display_name, p.created_at, p.trust, p.verified
    from public.profiles p
    where (p_ids is null or p.id = any (p_ids))
      and (p_q is null or p.display_name ilike '%' || replace(replace(replace(p_q, '\', '\\'), '%', '\%'), '_', '\_') || '%')
      and (p_trust is null or p.trust = p_trust)
    order by p.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;
revoke execute on function public.admin_profiles(uuid[], text, smallint, int) from public, anon;
grant execute on function public.admin_profiles(uuid[], text, smallint, int) to authenticated;
