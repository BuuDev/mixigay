-- Dev seed generated from src/lib/mock-data.ts (fake video ids). Applied by `supabase db reset`.

insert into public.games (slug, name, is_vlog, sort_order) values
  ('pubg', 'PUBG', false, 0),
  ('gta-v', 'GTA V Roleplay', false, 1),
  ('cs2', 'Counter-Strike 2', false, 2),
  ('lol', 'Liên Minh Huyền Thoại', false, 3),
  ('horror', 'Game kinh dị', false, 4),
  ('viewer-made', 'Game viewer làm', false, 5),
  ('vlog', 'Vlog', true, 6);

insert into public.game_keywords (game_slug, keyword) values
  ('pubg', 'pubg'),
  ('pubg', 'battlegrounds'),
  ('gta-v', 'gta'),
  ('gta-v', 'rp'),
  ('gta-v', 'mixi city'),
  ('cs2', 'cs2'),
  ('cs2', 'csgo'),
  ('cs2', 'counter-strike'),
  ('lol', 'lmht'),
  ('lol', 'liên minh'),
  ('lol', 'league of legends'),
  ('horror', 'kinh dị'),
  ('horror', 'horror'),
  ('horror', 'phasmophobia'),
  ('viewer-made', 'game viewer'),
  ('viewer-made', 'game fan làm'),
  ('vlog', 'vlog'),
  ('vlog', 'du lịch'),
  ('vlog', 'ăn'),
  ('vlog', 'review'),
  ('vlog', 'đi chơi');

insert into public.schedule_slots (day_of_week, time_vn, title, game_slug, note) values
  (1, '20:00', 'PUBG leo rank', 'pubg', null),
  (2, '20:00', 'Mixi City RP', 'gta-v', null),
  (3, '20:00', 'CS2 cùng Refund', 'cs2', null),
  (4, '21:00', 'Đêm kinh dị', 'horror', 'Có thể lùi 30 phút'),
  (5, '20:00', 'Thử game viewer làm', 'viewer-made', null),
  (6, '14:00', 'Stream ban ngày – game tự chọn', null, null),
  (0, '20:00', 'Mixi City RP', 'gta-v', null);

insert into public.played_games (game_slug, status, sessions, last_played) values
  ('pubg', 'playing', 412, '2026-11-08'),
  ('gta-v', 'playing', 268, '2026-11-07'),
  ('cs2', 'playing', 97, '2026-11-06'),
  ('horror', 'finished', 35, '2026-11-05'),
  ('lol', 'dropped', 6, '2026-10-30'),
  ('viewer-made', 'finished', 12, '2026-11-01');

insert into public.videos (video_id, title, published_at, duration_seconds, view_count, was_live, manual_game_slug, auto_game_slug) values
  ('demoVid0001', 'PUBG – Top 1 với 18 kill, anh em Refund gánh còng lưng', '2026-11-08T16:00:00Z', 18720, 1240000, true, null, 'pubg'),
  ('demoVid0002', 'Mixi City RP #142 – Ông chủ quán net bị truy nã', '2026-11-07T16:00:00Z', 16800, 2310000, true, null, 'gta-v'),
  ('demoVid0003', 'CS2 – Pha clutch 1v4 không thể tin nổi', '2026-11-06T16:00:00Z', 14700, 870000, true, null, 'cs2'),
  ('demoVid0004', 'Phasmophobia – Đêm kinh dị hét khản cổ', '2026-11-05T17:00:00Z', 11880, 1560000, true, null, 'horror'),
  ('demoVid0005', 'Vlog Đà Lạt – đi ăn lẩu gà lá é cùng team', '2026-11-03T05:00:00Z', 1440, 3120000, false, null, 'vlog'),
  ('demoVid0006', 'Thử game viewer làm: Độ đi giao trà sữa', '2026-11-01T16:00:00Z', 10560, 990000, true, null, 'viewer-made'),
  ('demoVid0007', 'LMHT – Trở lại Summoner''s Rift sau 3 năm', '2026-10-30T16:00:00Z', 13200, 1870000, true, null, 'lol'),
  ('demoVid0008', 'Review bàn phím cơ anh em tặng', '2026-10-28T05:00:00Z', 1080, 640000, false, null, 'vlog'),
  ('demoVid0009', 'Stream tâm sự cuối tuần – trả lời câu hỏi anh em', '2026-10-26T13:00:00Z', 9000, 520000, true, null, null),
  ('demoVid0010', 'Mixi City RP #141 – Phi vụ ngân hàng thế kỷ', '2026-10-25T16:00:00Z', 17700, 2050000, true, null, 'gta-v'),
  ('demoVid0011', 'PUBG – Bo cuối nghẹt thở map Erangel', '2026-10-23T16:00:00Z', 18000, 1010000, true, null, 'pubg'),
  ('demoVid0012', 'Một ngày ở Hà Giang không có wifi', '2026-10-20T05:00:00Z', 1860, 2740000, false, 'vlog', null);

-- Make yourself admin locally: insert into public.admin_emails (email) values ('you@example.com');
