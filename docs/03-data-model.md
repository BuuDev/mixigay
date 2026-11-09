# 03 – Mô hình dữ liệu (Supabase / Postgres)

Bản nháp schema cho migration đầu tiên. Khi viết migration thật, để file trong `supabase/migrations/` (tạo bằng `supabase migration new <tên>`). Sau khi migration áp dụng, sửa file này cho khớp.

Kiểu TypeScript tương ứng hiện có ở `src/lib/types.ts`. Sau khi có DB, sinh type bằng `supabase gen types typescript` ra `src/lib/supabase/database.types.ts`, và để `types.ts` map từ đó.

## Sơ đồ quan hệ

```
games 1─┬─< game_keywords
        ├─< playlist_game_map
        ├─< played_games (1–1)
        ├─< schedule_slots
        └─< videos (manual_game_slug / auto_game_slug)
videos 1──< live_samples
videos 1──< quotes (P2)
profiles 1─┬─< suggestions 1──< suggestion_votes >──1 profiles
           ├─< quotes, fan_art (P2)
           └─< push_subscriptions (P1)
live_status (một dòng duy nhất)
api_usage, notifications_log, admins
```

## SQL

```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ===== Người dùng =====
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table admins (
  user_id uuid primary key references auth.users on delete cascade
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ===== Game & phân loại =====
create table games (
  slug text primary key,                 -- 'pubg', 'vlog', ...
  name text not null,
  is_vlog boolean not null default false,
  cover_url text,                        -- null → dùng gradient mặc định
  steam_app_id int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table game_keywords (
  game_slug text not null references games on delete cascade,
  keyword text not null,                 -- chữ thường, so khớp substring trong tiêu đề
  primary key (game_slug, keyword)
);

create table playlist_game_map (
  playlist_id text primary key,          -- playlist chính chủ trên YouTube
  game_slug text not null references games on delete cascade,
  playlist_title text
);

-- ===== Video & live =====
create type live_state as enum ('none', 'upcoming', 'live', 'completed');

create table videos (
  video_id text primary key,
  title text not null,
  published_at timestamptz not null,
  duration_seconds int,
  view_count bigint not null default 0,
  thumbnail_url text,
  was_live boolean not null default false,
  live_state live_state not null default 'none',
  scheduled_start_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  playlist_ids text[] not null default '{}',
  manual_game_slug text references games on delete set null,  -- admin gán, ưu tiên cao nhất
  auto_game_slug text references games on delete set null,    -- do job phân loại
  stats_updated_at timestamptz,
  created_at timestamptz not null default now()
);
create index videos_game_idx on videos (coalesce(manual_game_slug, auto_game_slug), view_count desc);
create index videos_published_idx on videos (published_at desc);
create index videos_live_idx on videos (live_state) where live_state in ('upcoming', 'live');

create table live_status (
  id boolean primary key default true check (id),  -- ép chỉ có một dòng
  state text not null check (state in ('live', 'upcoming', 'offline')),
  video_id text references videos,
  title text,
  start_time timestamptz,
  concurrent_viewers int,
  checked_at timestamptz not null default now()
);

create table live_samples (                -- dữ liệu cho thống kê F13
  video_id text not null references videos on delete cascade,
  sampled_at timestamptz not null,
  concurrent_viewers int not null,
  primary key (video_id, sampled_at)
);

-- ===== Lịch =====
create table schedule_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Chủ nhật
  time_vn time not null,                 -- giờ Việt Nam (UTC+7, không DST)
  title text not null,
  game_slug text references games on delete set null,
  note text,
  active boolean not null default true
);

-- Ngoại lệ cho một ngày cụ thể (nghỉ, đổi giờ). P1.
create table schedule_overrides (
  date_vn date primary key,
  cancelled boolean not null default false,
  time_vn time,
  title text,
  note text
);

-- ===== Đã chơi =====
create type play_status as enum ('playing', 'finished', 'dropped');
create table played_games (
  game_slug text primary key references games on delete cascade,
  status play_status not null,
  sessions int not null default 0,
  last_played date
);

-- ===== Đề xuất =====
create type suggestion_source as enum ('steam', 'viewer-made', 'other');
create type suggestion_status as enum ('pending', 'played', 'rejected');

create table suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  name_normalized text generated always as (lower(unaccent(name))) stored,
  source suggestion_source not null,
  url text check (url is null or url ~* '^https?://'),
  reason text not null check (char_length(reason) between 5 and 500),
  status suggestion_status not null default 'pending',
  linked_game_slug text references games on delete set null,  -- khi status = 'played'
  steam_app_id int,
  steam_data jsonb,                      -- { headerImage, price, genres }
  upvotes int not null default 0,
  hidden boolean not null default false, -- admin ẩn khi spam
  created_at timestamptz not null default now()
);
create index suggestions_trgm_idx on suggestions using gin (name_normalized gin_trgm_ops);
create unique index suggestions_steam_uniq on suggestions (steam_app_id) where steam_app_id is not null;

create table suggestion_votes (
  suggestion_id uuid not null references suggestions on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);
-- Trigger: insert → upvotes + 1, delete → upvotes - 1 (viết trong migration)

-- ===== Vận hành =====
create table api_usage (
  day date not null,
  endpoint text not null,
  units int not null default 0,
  primary key (day, endpoint)
);

create table notifications_log (
  video_id text not null,
  channel text not null,                 -- 'telegram' | 'discord' | 'webpush'
  sent_at timestamptz not null default now(),
  primary key (video_id, channel)        -- chống gửi trùng
);

-- ===== P1/P2 =====
create table push_subscriptions (
  endpoint text primary key,
  user_id uuid references profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references videos on delete cascade,
  at_seconds int not null check (at_seconds >= 0),
  text text not null check (char_length(text) between 3 and 300),
  author_id uuid not null references profiles on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table fan_art (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  storage_path text not null,            -- bucket 'fan-art'
  title text,
  credit_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
```

## RLS (bật trên tất cả bảng)

| Bảng | select | insert | update | delete |
|---|---|---|---|---|
| games, game_keywords, playlist_game_map, schedule_slots, schedule_overrides, played_games, videos, live_status, live_samples | mọi người | admin | admin | admin |
| suggestions | mọi người (`hidden = false`), admin thấy hết | đăng nhập, `author_id = auth.uid()` | admin (status, hidden, linked_game_slug); tác giả sửa `reason` trong 15 phút | admin |
| suggestion_votes | mọi người | `user_id = auth.uid()` | – | `user_id = auth.uid()` |
| profiles | mọi người | trigger khi tạo user | chủ sở hữu | – |
| quotes, fan_art | mọi người (`approved = true`), tác giả thấy của mình, admin thấy hết | đăng nhập, `author_id = auth.uid()`, `approved = false` | admin | admin, tác giả |
| push_subscriptions | chủ sở hữu | đăng nhập | – | chủ sở hữu |
| api_usage, notifications_log, admins | – (chỉ service role) | – | – | – |

Job cron dùng service role nên bỏ qua RLS. Vì vậy mọi kiểm tra quyền của job phải nằm ở phía route (`CRON_SECRET`).

## Realtime

Chỉ bật Realtime cho `live_status`, bằng lệnh `alter publication supabase_realtime add table live_status;`. Các bảng khác không cần realtime, vì cache + revalidate là đủ.

## Trigger

- `on auth.users insert` → tạo `profiles` từ `raw_user_meta_data` (name, avatar_url).
- `suggestion_votes` insert/delete → cập nhật `suggestions.upvotes`.
- Chặn tự vote cho đề xuất của mình (tùy chọn, quyết định ở P0).

## Seed

`supabase/seed.sql` lấy dữ liệu từ `src/lib/mock-data.ts` (games, keywords, lịch mẫu) để môi trường dev giống prototype.
