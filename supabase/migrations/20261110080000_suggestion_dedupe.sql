-- Duplicate-suggestion spam guards (docs/03-data-model.md, "suggestions").
-- Before this, one fan could post the same game 5×/day and others could post
-- variants ("LETHAL  COMPANY!!", "Lethal-Company", "Lethal Companyy") — all public.

-- Comparison key: no diacritics, lower case, letters and digits only.
alter table public.suggestions
  add column name_key text generated always as (regexp_replace(lower(public.f_unaccent(name)), '[^a-z0-9]+', '', 'g')) stored;
alter table public.suggestions
  add constraint suggestions_name_key_len check (char_length(name_key) >= 2);

-- One live suggestion per game (hidden or rejected ones free the name again).
create unique index suggestions_name_key_live on public.suggestions (name_key) where not hidden and status <> 'rejected';
-- A fan can never re-post a name they already posted, even after it was hidden or rejected.
create unique index suggestions_author_name_key on public.suggestions (author_id, name_key);
create index suggestions_name_key_trgm on public.suggestions using gin (name_key extensions.gin_trgm_ops);

-- Same serialized trigger as before (per-user advisory lock), now also:
--   * 10-minute cooldown between two posts by the same fan;
--   * near-duplicates (≥ 80 % trigram similarity on the key) are refused, with the
--     existing name in DETAIL so the app can say "upvote that one instead".
-- Generated columns are not computed yet in a BEFORE trigger, so the key is rebuilt here.
create or replace function public.limit_suggestions_per_day() returns trigger
language plpgsql set search_path = '' as $$
declare
  k text := regexp_replace(lower(public.f_unaccent(new.name)), '[^a-z0-9]+', '', 'g');
  dup text;
begin
  if auth.uid() is null then return new; end if; -- service role / admin tooling
  perform pg_advisory_xact_lock(hashtext('suggestions:' || auth.uid()::text));
  if (select count(*) from public.suggestions s
      where s.author_id = auth.uid() and s.created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  if exists (select 1 from public.suggestions s
             where s.author_id = auth.uid() and s.created_at > now() - interval '10 minutes') then
    raise exception 'cooldown' using errcode = 'P0429';
  end if;
  select s.name into dup
  from public.suggestions s
  where not s.hidden and s.status <> 'rejected'
    and extensions.similarity(s.name_key, k) >= 0.8
  order by extensions.similarity(s.name_key, k) desc
  limit 1;
  if dup is not null then
    raise exception 'near_duplicate' using errcode = 'P0409', detail = dup;
  end if;
  return new;
end;
$$;
