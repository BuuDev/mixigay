-- Production reference data only (run once on a fresh production project).
-- The game catalogue + title keywords used to classify videos, and the official weekly
-- schedule (22:22, off Wed/Sun, Sat 23:00). Nothing fan-made, no sample videos, no
-- illustrative "played" counts: admins enter those, and sync-videos fetches real videos.
-- Re-running is safe: every insert skips rows that already exist.

insert into public.games (slug, name, is_vlog, sort_order) values
  ('delta-force', 'Delta Force', false, 0),
  ('gta-v', 'GTA V', false, 1),
  ('business-sim', 'Giả lập kinh doanh', false, 2),
  ('the-isle', 'The Isle (khủng long)', false, 3),
  ('party-games', 'Game nhóm', false, 4),
  ('action-horror', 'Hành động / kinh dị', false, 5),
  ('viewer-made', 'Game Bộ tộc làm', false, 6),
  ('an-lieng', 'Âm nhạc · An Liễng', false, 7),
  ('pubg', 'PUBG', false, 8),
  ('tam-su', 'Tâm sự & tấu hài', true, 9),
  ('vlog', 'Vlog & IRL', true, 10) on conflict do nothing;
insert into public.game_keywords (game_slug, keyword) values
  ('delta-force', 'delta force'),
  ('delta-force', 'ao làng df'),
  ('delta-force', 'df'),
  ('delta-force', 'harmonica'),
  ('delta-force', 'giáo án tân thủ'),
  ('gta-v', 'gta'),
  ('business-sim', 'simulator'),
  ('business-sim', 'business tour'),
  ('business-sim', 'probably stolen'),
  ('business-sim', 'tiệm'),
  ('business-sim', 'shop'),
  ('the-isle', 'the isle'),
  ('the-isle', 'khủng long'),
  ('the-isle', 't-rex'),
  ('party-games', 'goose goose duck'),
  ('party-games', 'peak'),
  ('party-games', 'machine party'),
  ('party-games', 'carry the glass'),
  ('party-games', 'dude, trust me'),
  ('action-horror', 'phantom blade'),
  ('action-horror', 'project threshold'),
  ('action-horror', 'scum'),
  ('action-horror', 'kinh dị'),
  ('viewer-made', 'fan thiết kế'),
  ('viewer-made', 'thành viên bộ tộc'),
  ('viewer-made', 'stream escape'),
  ('viewer-made', 'game viewer'),
  ('an-lieng', 'an liễng'),
  ('an-lieng', 'ca hát'),
  ('an-lieng', 'moi xoang'),
  ('an-lieng', 'nà ná na na'),
  ('pubg', 'pubg'),
  ('tam-su', 'tâm sự'),
  ('tam-su', 'bóc phốt'),
  ('tam-su', 'kể chuyện'),
  ('tam-su', 'unbox'),
  ('tam-su', 'chia sẻ'),
  ('tam-su', 'quiz'),
  ('tam-su', 'hoạt cảnh'),
  ('tam-su', 'dự án ma'),
  ('tam-su', 'kì án'),
  ('tam-su', 'nhậu'),
  ('tam-su', 'quyết định'),
  ('vlog', 'vlog'),
  ('vlog', 'độ đi date'),
  ('vlog', 'irl'),
  ('vlog', 'ăn cưới'),
  ('vlog', 'đi ăn') on conflict do nothing;
-- schedule_slots has no natural unique key: only fill it while it is still empty.
insert into public.schedule_slots (day_of_week, time_vn, title, game_slug, note)
select v.* from (values
  (1::smallint, '22:22'::time, 'Live tối Thứ Hai', null::text, null::text),
  (2::smallint, '22:22'::time, 'Live tối Thứ Ba', null::text, null::text),
  (4::smallint, '22:22'::time, 'Live tối Thứ Năm', null::text, null::text),
  (5::smallint, '22:22'::time, 'Live tối Thứ Sáu', null::text, null::text),
  (6::smallint, '23:00'::time, 'Live tối Thứ Bảy', null::text, 'Thứ Bảy lên sóng lúc 23:00')
) as v(day_of_week, time_vn, title, game_slug, note)
where not exists (select 1 from public.schedule_slots);
