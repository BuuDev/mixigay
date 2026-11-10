-- "Bình chọn của Bộ Tộc": admin-created polls fans vote on (one vote per poll, changeable
-- while the poll is open). docs/03-data-model.md "Bình chọn (polls)".
--
-- Vote rules are the suggestion_votes rules: accounts older than 24 h (can_vote()), banned
-- fans refused, shadow-banned votes "succeed" and are silently dropped, at most 60 vote
-- writes per hour. Counts live in poll_options.votes, kept by a security-definer trigger
-- serialized per poll.

-- ===== Tables =====
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 5 and 140),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  closes_at timestamptz,
  opened_at timestamptz,
  closed_at timestamptz,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index polls_status_idx on public.polls (status, created_at desc);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  position smallint not null default 0 check (position between 0 and 99),
  suggestion_id uuid references public.suggestions on delete set null,
  votes int not null default 0 check (votes >= 0),
  -- Lets poll_votes prove its option belongs to the same poll.
  unique (id, poll_id)
);
create index poll_options_poll_idx on public.poll_options (poll_id, position);

create table public.poll_votes (
  poll_id uuid not null references public.polls on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  option_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  foreign key (option_id, poll_id) references public.poll_options (id, poll_id) on delete cascade
);
create index poll_votes_user_idx on public.poll_votes (user_id);
create index poll_votes_option_idx on public.poll_votes (option_id);

-- Rate-limit ledger: one row per vote write (insert or change). Changing a vote updates
-- the same poll_votes row, so poll_votes itself cannot count how often someone flips.
create table public.poll_vote_events (
  user_id uuid not null references public.profiles on delete cascade,
  at timestamptz not null default now()
);
create index poll_vote_events_user_idx on public.poll_vote_events (user_id, at);

-- ===== Status bookkeeping =====
create or replace function public.poll_status_times() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'open' and (tg_op = 'INSERT' or old.status <> 'open') then
    new.opened_at := coalesce(new.opened_at, now());
    new.closed_at := null;
  elsif new.status = 'closed' and (tg_op = 'INSERT' or old.status <> 'closed') then
    new.closed_at := now();
  end if;
  return new;
end;
$$;
revoke execute on function public.poll_status_times() from public, anon, authenticated;
create trigger polls_status_times before insert or update of status on public.polls
  for each row execute function public.poll_status_times();

-- At most 8 options per poll.
create or replace function public.limit_poll_options() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('poll:' || new.poll_id::text));
  if (select count(*) from public.poll_options o where o.poll_id = new.poll_id) >= 8 then
    raise exception 'too_many_options' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_poll_options() from public, anon, authenticated;
create trigger poll_options_limit before insert on public.poll_options
  for each row execute function public.limit_poll_options();

-- ===== Row level security =====
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.poll_vote_events enable row level security;

-- created_by is not public: read the poll, not who made it.
revoke all on public.polls from anon, authenticated;
grant select (id, question, status, closes_at, opened_at, closed_at, created_at) on public.polls to anon, authenticated;
grant insert (question, status, closes_at) on public.polls to authenticated;
grant update (question, status, closes_at) on public.polls to authenticated;
grant delete on public.polls to authenticated;

create policy polls_read on public.polls for select using (status <> 'draft' or public.is_admin());
create policy polls_admin_insert on public.polls for insert to authenticated with check (public.is_admin());
create policy polls_admin_update on public.polls for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy polls_admin_delete on public.polls for delete to authenticated using (public.is_admin());

-- votes is the trigger's: nobody, admins included, writes it directly.
revoke all on public.poll_options from anon, authenticated;
grant select on public.poll_options to anon, authenticated;
grant insert (poll_id, label, position, suggestion_id) on public.poll_options to authenticated;
grant update (label, position, suggestion_id) on public.poll_options to authenticated;
grant delete on public.poll_options to authenticated;

create policy poll_options_read on public.poll_options for select
  using (exists (select 1 from public.polls p where p.id = poll_id and (p.status <> 'draft' or public.is_admin())));
create policy poll_options_admin_insert on public.poll_options for insert to authenticated with check (public.is_admin());
create policy poll_options_admin_update on public.poll_options for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy poll_options_admin_delete on public.poll_options for delete to authenticated using (public.is_admin());

-- Open = status 'open' and not past closes_at. Definer so the check does not depend on
-- the caller's view of polls.
create or replace function public.poll_is_open(p_poll uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.polls p
    where p.id = p_poll and p.status = 'open' and (p.closes_at is null or p.closes_at > now())
  );
$$;
revoke execute on function public.poll_is_open(uuid) from public, anon;
grant execute on function public.poll_is_open(uuid) to authenticated;

-- Fans see only their own vote; totals live in poll_options.votes.
revoke all on public.poll_votes from anon, authenticated;
grant select, delete on public.poll_votes to authenticated;
grant insert (poll_id, option_id) on public.poll_votes to authenticated;
grant update (option_id) on public.poll_votes to authenticated;

create policy poll_votes_read_own on public.poll_votes for select to authenticated using (user_id = auth.uid());
create policy poll_votes_insert_own on public.poll_votes for insert to authenticated
  with check (user_id = auth.uid() and not public.is_banned() and public.can_vote() and public.poll_is_open(poll_id));
create policy poll_votes_update_own on public.poll_votes for update to authenticated
  using (user_id = auth.uid() and public.poll_is_open(poll_id))
  with check (user_id = auth.uid() and not public.is_banned() and public.can_vote() and public.poll_is_open(poll_id));
create policy poll_votes_delete_own on public.poll_votes for delete to authenticated
  using (user_id = auth.uid() and public.poll_is_open(poll_id));

-- poll_vote_events: no policies, no grants → written only by the definer trigger below.
revoke all on public.poll_vote_events from anon, authenticated;

-- ===== Rate limit + shadow drop =====
create or replace function public.limit_poll_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if; -- service role / admin tooling
  -- Shadow-banned: report success, store nothing (returning null skips the insert/update).
  if exists (select 1 from public.profiles where id = auth.uid() and trust = -2) then return null; end if;
  if tg_op = 'UPDATE' and new.option_id = old.option_id then return new; end if;
  perform pg_advisory_xact_lock(hashtext('poll_votes:' || auth.uid()::text));
  delete from public.poll_vote_events e where e.user_id = auth.uid() and e.at <= now() - interval '1 hour';
  if (select count(*) from public.poll_vote_events e where e.user_id = auth.uid()) >= 60 then
    raise exception 'rate_limited' using errcode = 'P0429';
  end if;
  insert into public.poll_vote_events (user_id) values (auth.uid());
  return new;
end;
$$;
revoke execute on function public.limit_poll_votes() from public, anon, authenticated;
create trigger poll_votes_rate_limit before insert or update on public.poll_votes
  for each row execute function public.limit_poll_votes();

-- ===== Counts =====
create or replace function public.count_poll_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_poll uuid := coalesce(new.poll_id, old.poll_id);
begin
  perform pg_advisory_xact_lock(hashtext('poll:' || v_poll::text));
  if tg_op = 'INSERT' then
    update public.poll_options set votes = votes + 1 where id = new.option_id;
  elsif tg_op = 'DELETE' then
    update public.poll_options set votes = greatest(votes - 1, 0) where id = old.option_id;
  elsif new.option_id <> old.option_id then
    update public.poll_options set votes = greatest(votes - 1, 0) where id = old.option_id;
    update public.poll_options set votes = votes + 1 where id = new.option_id;
  end if;
  return null;
end;
$$;
revoke execute on function public.count_poll_votes() from public, anon, authenticated;
create trigger poll_votes_count after insert or update or delete on public.poll_votes
  for each row execute function public.count_poll_votes();

-- A ban (trust -1) or shadow ban (-2) withdraws every poll vote, like moderate_user does
-- for suggestion and song votes. A trigger, so moderate_user needs no new version.
create or replace function public.withdraw_poll_votes_on_ban() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.trust < 0 and old.trust >= 0 then
    delete from public.poll_votes where user_id = new.id;
  end if;
  return null;
end;
$$;
revoke execute on function public.withdraw_poll_votes_on_ban() from public, anon, authenticated;
create trigger profiles_withdraw_poll_votes after update of trust on public.profiles
  for each row execute function public.withdraw_poll_votes_on_ban();

-- ===== Admin: draft poll from the most-upvoted pending suggestions =====
create or replace function public.create_poll_from_suggestions(p_question text, p_limit int default 4) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_poll uuid;
  v_limit int := least(greatest(coalesce(p_limit, 4), 2), 8);
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if (select count(*) from (
        select 1 from public.suggestions s
        where s.approved and not s.hidden and s.status = 'pending' and s.rejected_at is null
        limit 2) t) < 2 then
    raise exception 'not_enough_suggestions' using errcode = '22023';
  end if;
  insert into public.polls (question, created_by) values (p_question, auth.uid()) returning id into v_poll;
  insert into public.poll_options (poll_id, label, position, suggestion_id)
  select v_poll, left(t.name, 80), (t.rn - 1)::smallint, t.id
  from (
    select s.id, s.name, row_number() over (order by s.upvotes desc, s.created_at asc) as rn
    from public.suggestions s
    where s.approved and not s.hidden and s.status = 'pending' and s.rejected_at is null
    order by s.upvotes desc, s.created_at asc
    limit v_limit
  ) t
  order by t.rn;
  return v_poll;
end;
$$;
revoke execute on function public.create_poll_from_suggestions(text, int) from public, anon;
grant execute on function public.create_poll_from_suggestions(text, int) to authenticated;

-- ===== Realtime: live counts on the poll card =====
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.poll_options;
  end if;
end;
$$;
