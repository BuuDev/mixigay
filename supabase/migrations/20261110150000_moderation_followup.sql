-- Follow-up from the review of 20261110140000:
-- * moderate_user lost the fan_art / quiz_questions take-down that 20261110100000 had;
-- * quotes and glossary entries are public fan text, so they can be reported too.

create or replace function public.moderate_user(p_user uuid, p_mode text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_mode not in ('ban', 'shadow', 'unban') then raise exception 'bad_mode' using errcode = '22023'; end if;
  update public.profiles
    set trust = case p_mode when 'ban' then -1 when 'shadow' then -2 else 0 end
    where id = p_user;
  if p_mode = 'unban' then return; end if;
  -- Everything the user ever published goes back behind moderation.
  update public.suggestions set hidden = true where author_id = p_user;
  update public.fan_songs set approved = false where author_id = p_user;
  update public.wall_messages set approved = false where author_id = p_user;
  update public.quotes set approved = false where author_id = p_user;
  update public.glossary_entries set approved = false where author_id = p_user;
  update public.fan_art set approved = false where author_id = p_user;
  update public.quiz_questions set approved = false where author_id = p_user;
  delete from public.suggestion_votes where user_id = p_user;
  delete from public.fan_song_votes where user_id = p_user;
  delete from public.attendance where user_id = p_user;
  update public.profiles set display_name = 'Fan ' || left(p_user::text, 4) where id = p_user;
end;
$$;

alter table public.reports drop constraint reports_target_kind_check;
alter table public.reports add constraint reports_target_kind_check
  check (target_kind in ('suggestion', 'fan_song', 'profile', 'wall_message', 'quote', 'glossary_entry'));

create or replace function public.check_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare found_target boolean;
begin
  new.note := nullif(public.strip_invisible(new.note), '');
  if auth.uid() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('reports:' || auth.uid()::text));
  if (select count(*) from public.reports r
      where r.reporter_id = auth.uid() and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  -- (A CASE expression inside IF trips the PL/pgSQL parser, hence the IF chain.)
  if new.target_kind = 'suggestion' then
    found_target := exists (select 1 from public.suggestions s where s.id = new.target_id and s.approved and not s.hidden);
  elsif new.target_kind = 'fan_song' then
    found_target := exists (select 1 from public.fan_songs s where s.id = new.target_id and s.approved);
  elsif new.target_kind = 'wall_message' then
    found_target := exists (select 1 from public.wall_messages w where w.id = new.target_id and w.approved);
  elsif new.target_kind = 'quote' then
    found_target := exists (select 1 from public.quotes q where q.id = new.target_id and q.approved);
  elsif new.target_kind = 'glossary_entry' then
    found_target := exists (select 1 from public.glossary_entries g where g.id = new.target_id and g.approved);
  else
    found_target := exists (select 1 from public.profiles p where p.id = new.target_id);
  end if;
  if not found_target then
    raise exception 'not_found' using errcode = 'P0404';
  end if;
  return new;
end;
$$;
