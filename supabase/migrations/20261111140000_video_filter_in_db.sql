-- /video filters run in the database (docs/02-architecture.md "Render và cache").
-- Before, every filter click made the server read all ~3,000 videos (≈ 1.2 MB with
-- chapters) and filter them in memory; now a filter is one indexed query for one page.

-- The game a video counts under: the admin's tag wins, then the keyword/playlist guess,
-- else 'unclassified' (UNCLASSIFIED in src/features/videos/lib/classify.ts).
alter table public.videos
  add column game_slug text generated always as (coalesce(manual_game_slug, auto_game_slug, 'unclassified')) stored;

-- The /video list never shows Shorts or upcoming placeholders: partial indexes for its two sorts.
create index videos_list_views_idx on public.videos (game_slug, view_count desc, published_at desc)
  where not is_short and live_state <> 'upcoming';
create index videos_list_newest_idx on public.videos (game_slug, published_at desc)
  where not is_short and live_state <> 'upcoming';

-- Filter chip counts in one round trip. Public data (videos are readable by everyone).
create or replace function public.video_game_counts()
returns table (game_slug text, n bigint)
language sql stable set search_path = '' as $$
  select v.game_slug, count(*) from public.videos v
  where not v.is_short and v.live_state <> 'upcoming'
  group by v.game_slug;
$$;
grant execute on function public.video_game_counts() to anon, authenticated;
