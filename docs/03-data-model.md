# 03 – Mô hình dữ liệu (Supabase / Postgres)

**Nguồn sự thật là `supabase/migrations/20261109000000_init.sql`.** Đoạn SQL dưới đây là bản tóm tắt để đọc nhanh. Migration thật còn có thêm: hàm `f_unaccent` (IMMUTABLE, để làm cột generated), bảng `admin_emails` + trigger cấp quyền admin, hàm `search_similar(q)`, `add_api_usage`, `set_auto_game`, `set_playlist_members`, và `playlist_game_map.game_slug` có thể null (job tự thêm playlist mới, admin gán game sau). Migration mới tạo bằng `supabase migration new <tên>`.

Kiểu TypeScript tương ứng hiện có ở `src/features/*/types.ts`. Sau khi có DB, sinh type bằng `supabase gen types typescript` ra `src/server/supabase/database.types.ts`, và để `types.ts` map từ đó.

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
  checked_at timestamptz   -- lần cuối live_status ĐỔI (không phải lần cuối kiểm tra)
);
-- poll-live chỉ ghi khi trạng thái / video / tiêu đề / giờ bắt đầu đổi. concurrent_viewers luôn null
-- từ ADR-019 (trang không hiện số người xem). Không còn trong publication Realtime (20261111160000).

create table live_poll_state (             -- hẹn giờ của poll-live (ADR-018), KHÔNG phát Realtime
  id boolean primary key default true check (id),
  checked_at timestamptz,                  -- lần kiểm tra gần nhất
  next_check_at timestamptz not null default now(),
  reason text                              -- live | upcoming_soon | upcoming_wait | slot_window | next_slot | safety | schedule_changed | websub | retry
);
-- RLS: chỉ admin đọc (trang /admin), chỉ service role ghi. public.poll_live_due() (pg_cron dùng)
-- không cấp cho anon/authenticated. Trigger trên schedule_slots / schedule_overrides đặt next_check_at = now().

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
  channel text not null,                 -- 'telegram' | 'discord'
  sent_at timestamptz not null default now(),
  primary key (video_id, channel)        -- chống gửi trùng
);

-- ===== P1/P2 =====
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
  title text not null check (char_length(btrim(title)) between 2 and 120),
  artist text not null check (char_length(btrim(artist)) between 1 and 80),
  drive_url text not null,               -- link Google Drive công khai ("Anyone with the link")
  drive_file_id text not null,           -- ID file Google Drive (10–80 ký tự)
  note text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table quiz_links (               -- quiz fan làm sẵn (Kahoot, Wayground, Wordwall…) cho anh Độ chơi
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  title text not null,                   -- 5–120
  url text not null,                     -- chỉ nền tảng quiz, unique (không phân biệt hoa thường)
  description text,                      -- ≤300
  played_video_id text references videos on delete set null,  -- admin đánh dấu "anh Độ đã chơi"
  played_at_seconds int,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
```

## RLS (bật trên tất cả bảng)

| Bảng | select | insert | update | delete |
|---|---|---|---|---|
| games, game_keywords, playlist_game_map, schedule_slots, schedule_overrides, played_games, videos, live_status, live_samples | mọi người | admin | admin | admin |
| suggestions | mọi người (`approved and not hidden`), tác giả và admin thấy hết | đăng nhập, không bị cấm, chỉ 4 cột `name, source, url, reason` (column grant), giới hạn ở trigger (xem "Chống phá hoại") | admin | admin |
| suggestion_votes | chỉ phiếu của mình | `user_id = auth.uid()`, tài khoản ≥ 24 giờ (hoặc `trust ≥ 1`), không bị cấm, đề xuất đã duyệt và không bị ẩn, ≤ 60 phiếu/giờ | – | `user_id = auth.uid()` |
| polls | mọi người (`status <> 'draft'`), admin thấy cả nháp; cột `created_by` không public (column grant) | admin | admin | admin |
| poll_options | như poll của nó (nháp chỉ admin) | admin (không ghi được `votes`) | admin (không ghi được `votes`) | admin |
| poll_votes | chỉ phiếu của mình | `user_id = auth.uid()`, chỉ cột `poll_id, option_id`, bình chọn đang mở (`poll_is_open`), tài khoản ≥ 24 giờ, không bị cấm, ≤ 60 lần ghi/giờ | chủ phiếu, chỉ cột `option_id`, cùng điều kiện như insert | chủ phiếu, khi bình chọn còn mở |
| profiles | mọi người | trigger khi tạo user | chủ sở hữu, chỉ cột `display_name` (trigger làm sạch, cắt 50 ký tự) | – |
| banned_terms | admin | admin | admin | admin |
| quotes | mọi người (`approved = true`), tác giả thấy của mình, admin thấy hết | đăng nhập, `author_id = auth.uid()`, `approved = false` | admin | admin (tác giả muốn gỡ thì báo admin) |
| fan_songs, fan_art, quiz_links | `approved`, hoặc tác giả, hoặc admin | đăng nhập, không bị cấm, `author_id = auth.uid()`, `approved = false`, giới hạn ở trigger | admin | **chỉ admin** |
| banned_image_hashes | admin | admin | – | admin |
| moderation_log | admin | – (chỉ trigger `log_content_moderation` và `moderate_user`, security definer) | – | – |
| blocked_terms | admin | admin | – | admin (server đọc bằng service role) |
| api_usage | admin | – (service role qua `add_api_usage`) | – | – |
| admins | chính mình | – | – | – |
| notifications_log, admin_alerts, account_logins, invites, auth_attempts | – (chỉ service role) | – | – | – |

Job cron dùng service role nên bỏ qua RLS. Vì vậy mọi kiểm tra quyền của job phải nằm ở phía route (`CRON_SECRET`).

## Realtime

Không dùng (ADR-019, migration `20261111160000_live_without_realtime.sql` gỡ `live_status` và `poll_options` khỏi publication). Trạng thái live đi qua `/api/live` trên CDN theo hẹn giờ của poll-live (`live_next_check_at()`, công khai, chỉ trả thời điểm); số phiếu bình chọn lấy lúc tải trang cộng phiếu của chính mình.

## Lọc video trong DB (`20261111140000_video_filter_in_db.sql`)

- `videos.game_slug` (generated, stored) = `coalesce(manual_game_slug, auto_game_slug, 'unclassified')`; không ai ghi trực tiếp được.
- Index một phần `(game_slug, view_count desc, published_at desc)` và `(game_slug, published_at desc)` với `where not is_short and live_state <> 'upcoming'`, đúng hai cách sắp xếp của `/video`.
- `video_game_counts()`: số video mỗi `game_slug` (bỏ Shorts và chỗ chờ), anon gọi được (dữ liệu công khai).

## Trigger

- `on auth.users insert` → tạo `profiles` từ `raw_user_meta_data` (name, avatar_url).
- `suggestion_votes` insert/delete → cập nhật `suggestions.upvotes`.
- Tác giả **không** còn tự upvote (đề xuất chưa duyệt thì không vote được).
- `profiles_sanitize_name`: làm sạch `display_name` (xem "Chống phá hoại").
- Admin chỉ được cấp qua **lời mời** (`invites`, xem mục "Định danh"). Cơ chế cũ cấp admin theo email đã xác nhận (`admin_emails`) đã bị gỡ ở `20261110120000`.
- Kiểm chứng toàn bộ các quy tắc trên: `npm run db:check` (`scripts/check-sql.mjs`).

## Seed

`supabase/seed.sql` lấy dữ liệu từ `src/features/*/mock.ts` (games, keywords, lịch mẫu) để môi trường dev giống prototype.

## Chống phá hoại (P0)

Migration `supabase/migrations/20261110090000_moderation.sql`. Postgres là cổng chặn; app (`src/shared/lib/moderation`) chỉ lọc chữ thêm và báo lỗi dễ hiểu. Mọi quy tắc có assert trong `npm run db:check` (mục "Moderation").

| Lớp | Quy tắc |
|---|---|
| Duyệt trước | `suggestions.approved` mặc định `false`, fan không ghi được cột này. Chỉ đề xuất đã duyệt mới hiện công khai, có trong `search_similar` và nhận vote. Tác giả thấy bản chờ duyệt của mình trên `/de-xuat`. |
| Giới hạn | Đề xuất: 5/ngày, cách nhau 10 phút, tài khoản < 24 giờ tối đa 2/ngày, toàn site 40/giờ. Nhạc: 3/ngày, tài khoản mới 1/ngày, toàn site 20/giờ. Vote: 60/giờ. Tuổi tài khoản tính theo `profiles.created_at`. |
| Chống trùng | Chỉ đề xuất **đã duyệt** (và bản của chính mình) mới giữ tên, để bản rác chờ duyệt không chiếm được tên game sắp ra. Unique index `suggestions_name_key_live` chỉ tính bản đã duyệt, nên admin không duyệt được bản thứ hai. |
| Ký tự ẩn | `strip_invisible()` xóa zero-width/Hangul filler/bidi rồi gộp khoảng trắng trước khi đếm độ dài (`reason` ≥ 5 thật). |
| Link | https, ≤ 500 ký tự, không `user@host`, không punycode, không link rút gọn (check trong DB). App chỉ nhận host trong `src/features/suggestions/lib/url-policy.ts` và chỉ render link khi host hợp lệ. |
| Tên hiển thị | Trigger đổi thành `Fan ####` khi tên rỗng sau khi bỏ ký tự ẩn, chứa URL/tên miền, hoặc chứa từ trong `banned_terms` (so sau khi bỏ dấu và ký tự đặc biệt). Không bao giờ báo lỗi, để đăng nhập không hỏng. `banned_terms` = `NAME_BLOCK_STEMS` trong `lexicon.ts` (test so khớp). |
| Cấm | `profiles.trust` (API không đọc được cột này; `profiles` chỉ cho đọc `id, display_name, avatar_url, created_at`): −2 cấm ngầm (vẫn gửi được nhưng không ai thấy), −1 cấm (không gửi, không vote), 0 thường, 1–2 tin cậy (dành cho sau này). `moderate_user(uid, 'ban' \| 'shadow' \| 'unban')` và `reset_display_name(uid)`: `security definer`, kiểm tra `is_admin()`; cấm sẽ ẩn mọi đề xuất, gỡ duyệt mọi bài nhạc, xóa mọi vote và reset tên. Người bị cấm ngầm: bài mới sinh ra đã ẩn, vote "thành công" nhưng không lưu, không bị tính vào giới hạn toàn site. Trigger `block_banned_approval` chặn duyệt bài của người có `trust < 0`. |
| Lọc chữ (app) | `screenText()` chặn cờ bạc/tục tĩu/link rút gọn với thông báo chung chung; tên miền trong chữ và cụm "nạp tiền", "cá độ"… chỉ gắn cờ cho admin. |

## Ảnh game (`game-art`): ảnh Steam lưu về + thumbnail fan tải lên

Migration `supabase/migrations/20261110190000_game_art.sql`. Code: `src/features/suggestions/lib/image-policy.ts` (quy tắc thuần) và `server/game-art.ts` (sharp, Vision, Storage).

| Thành phần | Ghi chú |
|---|---|
| `suggestions.thumbnail_path` | Đường dẫn trong bucket, check `^suggestions/<uuid>.webp$`. **Không** có trong column grant của fan; chỉ server (service role) ghi sau khi làm sạch ảnh, admin gỡ được. Ảnh hiện trước tiên trong `GameThumb` (rồi tới ảnh Steam, rồi thumbnail stream). |
| `suggestion_art_reviews(suggestion_id, review)` | jsonb `{verdict, reasons[], source: "upload"\|"steam", sha256, originalSha256}`, server (service role) ghi, **chỉ admin đọc** (RLS). Tách bảng riêng vì `suggestions` cho đọc công khai mọi cột. `sha256` là của file WebP đã lưu, `originalSha256` của file gốc. |
| `banned_image_hashes(sha256, reason, created_at, created_by)` | Ảnh admin đã "Gỡ ảnh + chặn vĩnh viễn". RLS: chỉ admin đọc/thêm/xóa; server đọc bằng service role để từ chối tải lại đúng ảnh đó. |
| Bucket `game-art` | Đọc công khai qua URL, tối đa 1 MB, chỉ `image/webp`. Không có policy ghi cho anon/authenticated: chỉ service role tải lên/xóa. Migration chỉ tạo bucket khi có schema `storage` (PGlite của `db:check` không có). |

Luồng tải ảnh (fan, nguồn không phải Steam): ≤ 3 MB → nhận dạng JPG/PNG/WebP theo magic bytes → sharp (từ chối ảnh động, cạnh > 8000 px; xoay theo EXIF, cắt 640×360, WebP q80, bỏ hết metadata/GPS) → so `banned_image_hashes` → insert đề xuất bằng quyền fan → Google Vision SafeSearch + OCR (nếu có `GOOGLE_VISION_API_KEY`; "chặn" thì xóa đề xuất vừa tạo và báo lỗi chung chung) → lưu Storage + `thumbnail_path`. Đề xuất vẫn chờ admin duyệt như cũ. Đề xuất Steam: sau khi gửi (`after()`) và khi admin duyệt, server tải ảnh header Steam về một lần (`mirrorSteamArt`, 5 s, lỗi thì bỏ qua).

## fan_songs (Góc nhạc — "nhạc nịnh")

Migration `supabase/migrations/20261109120000_fan_songs.sql`.

| Cột | Ghi chú |
|---|---|
| `title` (2–120), `artist` (1–80), `url`, `note` (≤300), `thumbnail_url` | Fan chỉ được insert 5 cột này (column grant) |
| `thumbnail_url` | Ảnh bìa, server lấy từ oEmbed của SoundCloud/Spotify hoặc `i.ytimg.com` của YouTube lúc gửi; admin bấm "Lấy lại ảnh bìa" được. Check trong DB chỉ nhận host `i[0-9].sndcdn.com`, `i.ytimg.com`, `i.scdn.co`, `image-cdn-xx.spotifycdn.com` (trình duyệt tải ảnh này, nên không cho trỏ tới server lạ). TikTok để trống vì link ảnh hết hạn. Migration `20261110160000_quiz_links_song_art.sql` |
| `url` | `https://` tới YouTube, youtu.be, SoundCloud, TikTok, Spotify, Zing MP3, NhacCuaTui, có đường dẫn (check trong DB + `songPlatform()` trong app); **unique chỉ trong các bài đã duyệt**, để bản chờ duyệt của người khác không chiếm được link |
| `approved` | mặc định `false`; chỉ admin đổi |

| select | insert | update | delete |
|---|---|---|---|
| `approved`, hoặc tác giả, hoặc admin | đăng nhập, không bị cấm, `author_id = auth.uid()`, giới hạn ở trigger (xem "Chống phá hoại") | admin | **chỉ admin** (nếu tác giả xóa được thì vòng gửi→xóa sẽ lách giới hạn/ngày) |

## fan_art (Tranh vẽ Bộ Tộc qua link Google Drive cá nhân — 0 MB lưu trữ server)

Migration `supabase/migrations/20261110100000_fan_art_and_quiz.sql`.

| Cột | Ghi chú |
|---|---|
| `title` (2–120), `artist` (1–80), `drive_url` (≤500), `drive_file_id` (10–80), `note` (≤300) | Fan chỉ được insert 5 cột này (column grant). Ảnh lưu trên Google Drive cá nhân của fan (chế độ "Bất kỳ ai có đường liên kết đều xem được"), server không tốn dung lượng lưu file |
| `drive_file_id` | Chỉ chấp nhận `[A-Za-z0-9_-]{10,80}`, unique trong các tranh `approved` |
| `approved` | Mặc định `false`; admin xem trước ảnh trực tiếp trong `/admin/fan-art` rồi mới duyệt |

## quiz_links (Quiz Bộ Tộc làm cho anh Độ chơi)

Migration `supabase/migrations/20261110160000_quiz_links_song_art.sql` (thay `quiz_questions`: trang không tự làm câu hỏi nữa, chỉ gom link quiz fan đã làm).

| Cột | Ghi chú |
|---|---|
| `title` (5–120), `url`, `description` (≤300) | Fan chỉ được insert 3 cột này; `approved` mặc định `false` |
| `url` | `https://` tới `kahoot.it`, `quizizz.com`/`wayground.com`, `wordwall.net`, `quizlet.com`, `blooket.com` (cho phép tiền tố `www.`/`create.`/`play.`), `forms.gle`, `docs.google.com/forms`. Check trong DB + `quizPlatform()` trong app. Unique theo `lower(url)` |
| `played_video_id`, `played_at_seconds` | Chỉ admin đặt, khi anh Độ đã chơi trên sóng; trang dẫn ra YouTube đúng mốc giờ |
| Giới hạn | 3 link/ngày, tài khoản < 24h chỉ 1; chặn duyệt nếu tác giả bị cấm; báo cáo được (`target_kind = 'quiz_link'`); `moderate_user` gỡ khi cấm |

## Báo cáo nội dung, vote nhạc nịnh, giới hạn Steam

Migration `supabase/migrations/20261110110000_reports_song_votes_steam.sql`. Các quy tắc đều có assert trong `npm run db:check` (các mục "Reports", "Fan song votes", "Steam lookup budget").

| Bảng / hàm | Quy tắc |
|---|---|
| `reports(target_kind, target_id, reason, note, resolved)` | Fan đã đăng nhập, không bị cấm, chỉ được ghi 4 cột. Mỗi fan chỉ báo cáo một lần cho mỗi mục (unique). Tối đa 20 báo cáo mỗi ngày. Mục bị báo cáo phải đang hiển thị: đề xuất đã duyệt, bài nhạc đã duyệt, hoặc hồ sơ. **Người báo cáo không đọc lại được** báo cáo, kể cả của mình, nên insert từ app không được `.select()`/`RETURNING`. Chỉ admin xem và xử lý. Báo cáo không tự ẩn nội dung, để tránh bị hội đồng báo cáo; admin quyết định ở `/admin` (mục "Hàng đợi duyệt"). |
| `fan_song_votes(song_id, user_id)` + `fan_songs.upvotes` | Giống `suggestion_votes`: tài khoản ≥ 24 giờ, chỉ vote bài đã duyệt, 60 phiếu/giờ. Phiếu của người bị cấm ngầm "thành công" nhưng không được lưu. `moderate_user` gỡ luôn các phiếu này. |
| `steam_lookups` + `take_steam_lookup()` | Route `/api/steam/[appId]` gọi trước mỗi lần tra cứu: mỗi fan 20 lần / 10 phút, quá thì trả 429. API không đọc được bảng này. |

## Định danh: tên Bộ Tộc + mã khóa, link mời, huy hiệu chính chủ

Migration `supabase/migrations/20261110120000_admin_access_official.sql`, [ADR-013](08-decisions.md#adr-013). Các quy tắc đều có assert trong `npm run db:check` (mục "Accounts & invites").

- **Không ai đưa email, số điện thoại hay tài khoản Google.**
  - Tài khoản = tên đăng nhập (`account_logins.handle_key`) + mã khóa. Đăng ký công khai tắt trong Supabase.
  - Server tạo user bằng service role, với địa chỉ ảo `u-<uuid>@id.gocbotoc.invalid`, chỉ nằm trong `auth.users` và `account_logins`. API không đọc được bảng này.
- `name_key()`: khóa so sánh cho tên. Đổi chữ trông giống chữ Latin (Cyrillic, Greek) về Latin, bỏ dấu, chữ thường, chỉ giữ chữ và số. Phải khớp với `src/features/auth/lib/handle.ts`, có test kiểm tra.
- **Tên dành riêng** (`reserved_name_terms`):
  - `is_reserved_name()` dùng `name_key()` và đổi thêm số thành chữ (0→o, 1→i, 3→e, 4→a, 5→s);
  - tài khoản chưa xác minh dùng tên dành riêng sẽ bị đổi thành "Fan ####" (trigger `sanitize_display_name`, không bao giờ báo lỗi);
  - tạo tài khoản fan với tên đăng nhập dành riêng bị từ chối ngay ở server;
  - migration quét lại mọi tên đang có.
- **Vai trò:**
  - `admins.owner` là chủ trang: quản lý admin và lời mời;
  - admin thường chỉ kiểm duyệt nội dung;
  - `profiles.verified` là huy hiệu "✓ Chính chủ": ai cũng đọc được, fan không tự bật được.
- **Lời mời** (`invites`):
  - token 64 ký tự hex, chỉ lưu bản băm SHA-256, dùng một lần, hết hạn sau 48 giờ;
  - `issue_invite()`: chủ trang tạo lời mời `admin` / `official`; lời mời `owner` chỉ tạo được từ SQL editor;
  - `peek_invite()` / `consume_invite()`: chỉ service role gọi được.
  - `consume_invite` cấp quyền admin và, với lời mời `official`, bật huy hiệu rồi đặt tên hiển thị của lời mời.
- `list_access()`, `revoke_invite()`, `remove_admin()`: chỉ chủ trang.
  - Danh sách chỉ có tên hiển thị và tên đăng nhập, không có email.
  - `remove_admin` khóa tuần tự, không cho tự bỏ quyền mình hay bỏ quyền chủ trang, và gỡ huy hiệu (nên tên dành riêng bị reset theo).
- **Giới hạn** (`auth_attempts` + `take_auth_attempt()`, chỉ service role; khóa là IP đã băm HMAC, không lưu IP gốc):
  - tạo tài khoản 3/giờ/IP, 60/giờ toàn site;
  - đăng nhập 5 lần / 10 phút / tên và 30 / 10 phút / IP;
  - đổi lời mời 10/giờ/IP.
- Gỡ bỏ: bảng `admin_emails`, các trigger cấp admin theo email đã xác nhận, và ảnh đại diện lấy từ tài khoản ngoài. `handle_new_user` chỉ còn tạo profile.
- Trigger `auth_users_keep_synthetic_email` chặn đổi sang email thật qua Auth API (`PUT /auth/v1/user`), vì đổi được thì có thể dùng /recover, /otp.
- Đăng nhập chỉ đếm **lần sai** (`auth_attempts_exceeded` + `note_auth_failure`), để người lạ cố tình nhập sai không khóa được tài khoản của người khác:
  - 5 lần sai / 10 phút cho mỗi cặp tên + mạng;
  - 50 lần sai / giờ cho mỗi tên;
  - 30 lần sai / 10 phút cho mỗi mạng (IPv6 tính theo dải /64).
- Mã khóa:
  - ≥ 8 ký tự cho mọi tài khoản, kể cả admin / chính chủ / chủ trang (chủ dự án chọn ngày 2026-11-10, theo NIST SP 800-63B);
  - không phải mã phổ biến, không toàn số, không chứa tên đăng nhập;
  - đổi mã khóa phải nhập mã hiện tại.

## Bức tường Bộ Tộc, gộp `live_samples`

Migration `supabase/migrations/20261110130000_wall_attendance_stats.sql`. Có assert trong `npm run db:check` (các mục "Wall messages", "Attendance", "live_samples compaction").

| Bảng / hàm | Quy tắc |
|---|---|
| `wall_messages(body ≤ 140, approved)` | **Duyệt trước** (COMPONENTS.md §5). Fan chỉ ghi `body`. Giới hạn: 3 tin/ngày, tài khoản < 24 giờ 1 tin/ngày, toàn site 60 tin/giờ. Ký tự ẩn bị xóa trước khi đếm độ dài. Chỉ admin xóa được (tác giả xóa được thì sẽ lách giới hạn/ngày). Không duyệt được tin của người bị cấm hoặc cấm ngầm (`block_banned_approval`). |
| ~~`attendance(date_vn, user_id)`~~ | **Đã xóa** (ADR-019, `20261111150000_drop_room_and_rsvp.sql`) cùng `attendance_count()` và trigger. |
| `compact_live_samples()` | (Từ ADR-019 poll-live không ghi mẫu mới; hàm giữ lại cho dữ liệu cũ.) Mẫu cũ hơn 30 ngày: giữ 1 mẫu mỗi 5 phút cho mỗi video. Chạy hằng ngày bằng pg_cron (`supabase/cron.sql`), chỉ là SQL, không tốn quota YouTube. API không gọi được. |
| `moderate_user` | Cấm / cấm ngầm còn gỡ duyệt mọi tin trên tường. |

Chấp nhận theo thiết kế (đã qua review):
- Người bị cấm ngầm có thể nhận ra mình bị cấm, vì lượt điểm danh "thành công" nhưng tải lại trang thì mất. Phiếu vote bị cấm ngầm cũng có hành vi tương tự.
- Một nhóm tài khoản có thể làm đầy giới hạn 60 tin/giờ toàn site của Bức tường. Cấm hoặc cấm ngầm các tài khoản đó sẽ trả lại hạn mức, vì giới hạn chỉ đếm tác giả có `trust ≥ 0`.

## Trung tâm kiểm duyệt (20261110200000)

Migration `supabase/migrations/20261110200000_moderation_center.sql`. Có assert trong `npm run db:check` (mục "Moderation center (20261110200000)" và "Blocked terms").

**Từ chối thay vì xóa.** Giới hạn/ngày đếm các dòng đang có, nên xóa bài rác là trả lại hạn mức cho người spam. Bài bị từ chối vẫn nằm trong bảng, vẫn bị đếm, chỉ tác giả và admin thấy.

| Thành phần | Quy tắc |
|---|---|
| `rejected_at timestamptz`, `rejected_reason text (≤ 300)` | Có trên 7 bảng: `suggestions`, `fan_songs`, `fan_art`, `quiz_links`, `quotes`, `glossary_entries`, `wall_messages`. **Không** có trong column grant insert của fan; admin đặt qua policy `*_admin_update` sẵn có (cả 7 bảng đều grant update toàn bảng cho `authenticated`, policy giới hạn admin). Check `<bảng>_rejected_not_approved`: `rejected_at is null or not approved`. |
| Trigger `clear_rejection_on_approve()` | BEFORE UPDATE (`<bảng>_clear_rejection`). Đặt `rejected_at` mới → ép `approved = false`. Duyệt (`approved` false→true) một bài đã bị từ chối → xóa `rejected_at`, `rejected_reason`. |
| "Chờ duyệt" | `approved = false and rejected_at is null` (riêng `suggestions`: thêm `and not hidden`). Partial index `<bảng>_pending_idx (created_at desc)` cho hàng đợi. |
| `moderation_log(id, kind, target_id, author_id, actor_id, action, reason, snapshot, created_at)` | `kind`: `suggestion`, `fan_song`, `fan_art`, `quiz_link`, `quote`, `glossary_entry`, `wall_message`, `profile`. `action`: `approve`, `unapprove`, `reject`, `delete`, `ban`, `shadow`, `unban`. `reason` ≤ 300, `snapshot` ≤ 200 (cắt từ cột nội dung lúc ghi). `actor_id = auth.uid()` (null nếu là job service role). RLS: chỉ admin đọc; không ai insert/update/delete trực tiếp, kể cả admin. Index `(created_at desc)`, `(author_id, created_at desc)`, `(target_id)`. |
| Trigger `log_content_moderation(kind, cột snapshot)` | AFTER UPDATE OF `approved, rejected_at` OR DELETE trên 7 bảng (`<bảng>_log_moderation`). Cột snapshot: suggestions→`name`, fan_songs/fan_art/quiz_links→`title`, quotes/wall_messages→`body`, glossary_entries→`term`. DELETE→`delete`; `rejected_at` null→có→`reject` (`reason = rejected_reason`); `approved` false→true→`approve`; true→false không kèm từ chối mới→`unapprove`. Bỏ qua khi `app.moderation_bulk = 'on'` và khi bài bị xóa dây chuyền do tài khoản tác giả bị xóa. |
| `moderate_user(uid, mode)` | Giữ nguyên hành vi, thêm đúng **một** dòng log `kind = 'profile'`, `target_id = author_id = uid`, `action = mode`. Đặt `app.moderation_bulk = 'on'` (local trong transaction) trước các lệnh gỡ hàng loạt, nên cấm một người không sinh hàng trăm dòng log. |
| `blocked_terms(term, category, created_by, created_at)` | `term` viết thường, 2–60 ký tự (PK); `category`: `gambling`, `profanity`, `spam`. RLS: chỉ admin đọc/thêm/xóa. Server app đọc bằng service role; **không công khai**, để người spam không đọc được danh sách mà lách. |

## Bình chọn (polls) (20261110220000)

"Bình chọn của Bộ Tộc": admin tạo câu hỏi (ví dụ "Tối nay anh Độ nên chơi game gì?"), fan chọn một lựa chọn. Migration `supabase/migrations/20261110220000_polls.sql`. Có assert trong `npm run db:check` (mục "Polls (20261110220000)"). Admin quản lý ở `/admin/binh-chon`; trang chủ hiện bình chọn đang mở mới nhất, không có thì hiện kết quả lần gần nhất (`src/features/polls`).

| Bảng / hàm | Quy tắc |
|---|---|
| `polls(id, question 5–140, status draft/open/closed, closes_at, opened_at, closed_at, created_by, created_at)` | Mới tạo luôn là `draft` (fan không thấy). Đang mở = `status = 'open'` và (`closes_at` null hoặc ở tương lai): hết giờ thì DB tự từ chối phiếu, không cần job. Trigger `poll_status_times` đặt `opened_at`/`closed_at` khi đổi trạng thái. `created_by` không có column grant select. |
| `poll_options(id, poll_id, label 1–80, position, suggestion_id, votes)` | Tối đa 8 lựa chọn mỗi poll (trigger `limit_poll_options`, khóa theo poll). `votes` chỉ trigger ghi: không có trong column grant, kể cả admin. `suggestion_id` trỏ về đề xuất game (on delete set null). |
| `poll_votes(poll_id, user_id, option_id, created_at)`, PK `(poll_id, user_id)` | Một phiếu mỗi người mỗi poll. Đổi ý = `update option_id` (cùng hàng). FK `(option_id, poll_id) → poll_options(id, poll_id)`, nên không chọn được lựa chọn của poll khác. Insert/update/delete chỉ khi `poll_is_open(poll_id)`; insert/update cần `can_vote()` (tài khoản ≥ 24 giờ hoặc `trust ≥ 1`) và `not is_banned()`. |
| `poll_vote_events(user_id, at)` + trigger `limit_poll_votes` | Sổ đếm giới hạn: mỗi lần bỏ phiếu hoặc đổi phiếu ghi một dòng; quá 60 lần/giờ → `rate_limited`. Phiếu của người bị cấm ngầm (`trust = -2`) "thành công" nhưng không được lưu (trigger trả `null`). Không ai đọc/ghi bảng này ngoài trigger. |
| Trigger `count_poll_votes` | AFTER INSERT/UPDATE/DELETE trên `poll_votes`, security definer, `pg_advisory_xact_lock(hashtext('poll:' || poll_id))`: +1/−1 vào `poll_options.votes`; đổi ý thì −1 lựa chọn cũ, +1 lựa chọn mới. |
| Trigger `withdraw_poll_votes_on_ban` | AFTER UPDATE OF `trust` trên `profiles`: khi `trust` xuống < 0 (cấm hoặc cấm ngầm), xóa mọi phiếu bình chọn của người đó (số phiếu tự trừ). Dùng trigger để `moderate_user` không cần phiên bản mới. |
| `create_poll_from_suggestions(p_question, p_limit)` | Chỉ admin (security definer, kiểm tra `is_admin()`). Tạo poll **nháp** với 2–8 lựa chọn là các đề xuất đã duyệt, không ẩn, chưa bị từ chối, `status = 'pending'`, xếp theo `upvotes` giảm dần; `label` = tên đề xuất, `suggestion_id` được gán. Ít hơn 2 đề xuất phù hợp → lỗi `not_enough_suggestions`. |
| `poll_is_open(poll_id)` | Security definer, dùng trong policy và trong action để báo "Bình chọn này đã đóng rồi." |

- App: đọc poll qua `getPollBoard()` (`"use cache"`, tag `polls`, `cacheLife("minutes")`), phiếu của người xem qua `getMyPollVote()` (theo request, không cache). Vote dùng `revalidateTag(TAGS.polls, "max")` như vote đề xuất; số phiếu trên thẻ được cập nhật bằng Realtime.
- Embed `poll_options` từ `polls` phải ghi rõ khóa `poll_options!poll_options_poll_id_fkey(...)`, vì `poll_votes` tạo thêm một đường nối nhiều-nhiều.
- Kết quả chỉ hiện sau khi fan đã chọn (khách và poll đã đóng thấy kết quả ngay), để lựa chọn đầu tiên không bị đám đông dẫn dắt.
