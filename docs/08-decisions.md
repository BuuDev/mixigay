# 08 – Nhật ký quyết định (ADR)

Mỗi quyết định ghi lại bối cảnh, lựa chọn và hệ quả. Không xóa ADR cũ; nếu thay đổi quyết định, thêm ADR mới ghi "thay thế ADR-xxx".

## ADR-001 – Next.js (TS) + Supabase + Vercel {#adr-001}

**Trạng thái:** Chấp nhận, 2026-11

**Bối cảnh:** Web chủ yếu đọc nội dung, có một phần cần realtime (live) và một phần cần đăng nhập (đề xuất). Một người làm, muốn chạy trong gói miễn phí.

**Quyết định:** Next.js 16 App Router (TypeScript), Supabase (Postgres, Auth Google, Realtime, pg_cron), deploy trên Vercel.

**Phương án đã cân nhắc:** Astro + Supabase nhẹ hơn cho trang tĩnh, nhưng phần đề xuất/admin tương tác nhiều và prototype đã viết bằng Next. Firebase thì không có SQL, nên khó làm truy vấn trgm, thống kê và RLS rõ ràng.

**Hệ quả:** Phụ thuộc giới hạn free tier của Supabase (500 MB DB, project bị tạm dừng nếu 7 ngày không hoạt động) và Vercel Hobby.

## ADR-002 – Chỉ link, không nhúng player {#adr-002}

**Trạng thái:** Chấp nhận

**Quyết định:** Card video/live mở `youtube.com/watch?v=` ở tab mới. Không nhúng iframe làm mặc định.

**Lý do:** Lượt xem, chat và ủng hộ về kênh gốc; tránh bị xem là trang phát lại nội dung; trang nhẹ hơn.

## ADR-003 – Đồng hồ cron là Supabase pg_cron, logic nằm ở Next route handler {#adr-003}

**Trạng thái:** Chấp nhận

**Bối cảnh:** Cần poll mỗi 1 phút. Vercel Cron trên gói Hobby chỉ chạy tối đa 1 lần/ngày. GitHub Actions schedule tối thiểu 5 phút và hay trễ.

**Quyết định:** `pg_cron` + `pg_net` trong Supabase gọi `POST /api/cron/*` trên Vercel, xác thực bằng `CRON_SECRET` lưu trong Supabase Vault. Logic viết bằng TS trong repo Next, không dùng Supabase Edge Functions (Deno).

**Hệ quả:** Một codebase, test bằng cùng công cụ. Đổi lại, mỗi phút tốn một lần gọi function Vercel (~43k lần/tháng, trong hạn mức Hobby). Nếu sau này nâng Vercel Pro thì có thể chuyển sang Vercel Cron mà không phải sửa route.

## ADR-004 – Phát hiện live bằng RSS + `videos.list`, không dùng `search.list` {#adr-004}

**Trạng thái:** Chấp nhận

**Quyết định:** Lấy ứng viên từ RSS (0 quota) + DB + WebSub, rồi `videos.list` (1 đơn vị) để lấy trạng thái. `search.list` (100 đơn vị) chỉ được gọi tay từ admin.

**Hệ quả:** Khoảng 1.500 đơn vị/ngày thay vì vượt quota. Có khả năng bỏ sót buổi live không xuất hiện trong RSS; WebSub và nút admin là phương án dự phòng.

## ADR-005 – Phân loại game: nhãn tay → playlist chính chủ → từ khóa {#adr-005}

**Trạng thái:** Chấp nhận (đã cài một phần trong `src/features/videos/lib/classify.ts`)

**Quyết định:** Thứ tự ưu tiên là `manual_game_slug` > playlist map > từ khóa tiêu đề (game thường trước, vlog sau) > "Chưa phân loại". Vlog là một game có `is_vlog = true`, không phải module riêng.

**Hệ quả:** Admin cần gán tay video chưa nhận diện. Từ khóa nằm trong DB nên sửa không cần deploy lại. Lưu từ khóa/playlist trong admin sẽ phân loại lại toàn bộ (`reclassifyAll`).

## ADR-006 – Chạy được không cần backend (chế độ mock) {#adr-006}

**Trạng thái:** Chấp nhận

**Quyết định:** Khi thiếu `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, mỗi `features/*/server/queries.ts` trả dữ liệu mẫu (`features/*/mock.ts`), `SuggestionBoard` chạy chế độ demo, auth và admin tắt.

**Lý do:** CI build không cần secret; người mới clone về là chạy được ngay; làm UI không phụ thuộc DB.

**Hệ quả:** Mỗi getter phải giữ cả hai nhánh. Không được import `mock-data.ts` ở chỗ nào khác ngoài `data.ts`.

## ADR-007 – Chia mã nguồn theo tính năng {#adr-007}

**Trạng thái:** Chấp nhận, 2026-11

**Bối cảnh:** Spec v2 thêm khoảng 10 khối mới (intro, RSVP, tường, hộp quà, timeline, gallery, skin…). Cấu trúc cũ chia theo loại file (`lib/`, `components/`, một `data.ts` và một `types.ts` chung) khiến mỗi tính năng phải sửa nhiều file dùng chung, và các file chung phình to dần.

**Quyết định:** `src/app` chỉ làm routing. Mỗi tính năng là một folder `src/features/<x>` chứa types, mock, lib (thuần), server (queries/job), actions, hooks, components, admin. Phần không thuộc tính năng nào nằm ở `src/shared` (UI, design, motion, lib) và `src/server` (hạ tầng). ESLint chặn import ngược tầng (`eslint.config.mjs`).

**Hệ quả:** Thêm hay xóa một tính năng gần như chỉ đụng tới folder của nó cộng với một page. Đổi lại phải chấp nhận vài chỗ import chéo giữa các tính năng (ví dụ `live` dùng `schedule/lib`). Không dùng barrel để khỏi trộn code server và client.

## ADR-008 – Animation: CSS cho nền, Motion cho tương tác {#adr-008}

**Trạng thái:** Chấp nhận, 2026-11

**Quyết định:** Hiệu ứng lặp/nền (tàn lửa, pulse) và hover dùng CSS. Hiệu ứng vào/ra, chuỗi nhiều bước và cử chỉ dùng `motion@14` (motion/react) qua một entry duy nhất là `@/shared/motion`: `LazyMotion` tải feature theo yêu cầu, `strict` để buộc dùng `m.*`, `MotionConfig reducedMotion="user"`. Chuyển cảnh giữa các route (React `<ViewTransition>`) để dành, khi cần thì ghi ADR mới.

**Phương án loại:** chỉ dùng CSS + WAAPI (phải tự viết exit animation và sequencing, code dài khi số hiệu ứng tăng); nạp toàn bộ `motion` (bundle lớn).

**Hệ quả:** Thêm khoảng 15–20 KB (gzip) cho domAnimation, chỉ tải khi có component dùng `m.*`. Mọi giá trị thời lượng/easing lấy từ token (`motion.css` ↔ `tokens.ts`).

## ADR-009 – Nhận diện Góc Bộ Tộc, chỉ nền tối, asset sinh từ brand.html {#adr-009}

**Trạng thái:** Chấp nhận, 2026-11

**Quyết định:** Dùng bộ nhận diện v2 trong `docs/design/brand.html`. Bỏ chế độ sáng. Logo, mascot, minh họa và skin được sinh bằng `npm run brand` (icon: xem [ADR-010](#adr-010)). Component dùng tên màu ngữ nghĩa, ánh xạ tới token `--td-*`; skin theo dịp chỉ đổi token qua `data-theme`.

**Hệ quả:** Designer cập nhật brand.html, chạy lại `npm run brand` là xong, không phải sửa tay asset. Phần icon được thay bằng ADR-010.

## ADR-010 – Icon dùng Phosphor duotone thay cho bộ vẽ tay {#adr-010}

**Trạng thái:** Chấp nhận, 2026-11 (thay phần icon của ADR-009)

**Quyết định:** Mọi icon lấy từ `@phosphor-icons/react` (MIT), kiểu `duotone`, qua một entry duy nhất là `src/shared/ui/icons.tsx`. Import bản SSR theo từng file (`dist/ssr/<Tên>`) nên dùng được trong cả Server và Client Component và chỉ đóng gói icon thực sự dùng. Lớp nền duotone tô bằng `--td-icon-tint` (mặc định `--td-ember-glow`), nên skin theo dịp tự đổi màu icon. `npm run brand` không còn sinh icon; mục Icon trong brand.html chỉ còn để tham khảo.

**Phương án loại:** tự vẽ thêm icon vào brand.html (chất lượng không đều, thiếu người vẽ); Lucide (chỉ có nét, không có kiểu hai màu); `@iconify/react` (mặc định tải icon từ API ngoài lúc chạy); Fluent Emoji/IconPark đa màu (màu cố định, không theo skin).

**Hệ quả:** Thêm một dependency. Nét Phosphor (lưới 256, nét ~1.5px ở 24px) khác bộ cũ, nên đổi toàn bộ 15 icon cùng lúc để không lẫn hai phong cách. Linh vật Cú Tộc và minh họa vẫn sinh từ brand.html.

## ADR-011 – Tên “Góc Bộ Tộc”, ảnh anh Độ làm nội dung kiểu thiệp mời {#adr-011}

**Trạng thái:** Chấp nhận, 2026-11-09 (đổi tên của ADR-009)

**Quyết định:** Chủ dự án bỏ tên “Tộc Đêm”, chỉ dùng từ ngữ của Bộ Tộc và về anh Độ; tên trang là **Góc Bộ Tộc**. Wordmark trong header là logomark lửa trại + chữ “GÓC BỘ TỘC” bằng font của trang (không sinh `logo-full-*.svg` nữa). Token CSS vẫn giữ tiền tố `--td-*` để khỏi đổi hàng trăm chỗ; đó là tên nội bộ, người xem không thấy. Theo yêu cầu của chủ dự án, ảnh anh Độ và tranh fan vẽ (`public/album`, `src/features/album`) được dùng làm nội dung theo kiểu thiệp cưới online: ảnh bìa khung vòm (đẩy chậm, vệt sáng, parallax), album polaroid xòe ra khi cuộn tới + lightbox, ảnh hiện lên từ đống lửa ở màn mở đầu. Logo MixiGaming và Refund Gaming trong ảnh gốc không được dùng (luật “không dùng nhận diện MixiGaming”), kể cả khi nằm trong tranh fan (đã bỏ tranh “phòng stream” vì có biển neon Mixi Gaming). Logo nhà tài trợ/sự kiện trong ảnh được làm mờ. Ảnh gốc chủ dự án gửi nằm ở `assets-raw/` (gitignore), không bao giờ ở `public/`.

**Hệ quả:** Mỗi ảnh có chú thích, alt và dòng nguồn; trang Giới thiệu là kênh xin gỡ. Ảnh chụp thật có bản quyền của người chụp: khi biết tác giả, thêm tên vào `credit`. Mọi chuyển động nền tắt khi người xem bật giảm chuyển động.

## ADR-012 – Chuẩn UI 2026: thanh tab trên điện thoại, View Transitions, WCAG 2.2 AA {#adr-012}

**Trạng thái:** Chấp nhận, 2026-11-09

**Bối cảnh:** Đo bằng Lighthouse, desktop đạt 99–100 điểm, nhưng trang chủ trên điện thoại chỉ 54 điểm hiệu năng:
- ảnh bìa nằm trong `ScrollReveal`, nên chờ JS mới vẽ; 89% thời gian LCP là chờ render;
- mười component render lại mỗi giây;
- a11y còn lỗi tương phản, link không gạch chân, tên nút không khớp chữ hiển thị;
- header 8 link bị cắt chữ trên điện thoại và tablet.

**Quyết định:**
- Ghi bộ chuẩn "Chuẩn UI 2026" vào `docs/07-conventions.md`.
- Thêm thanh tab dưới đáy cho màn < 1024px, mục "Thêm" mở bằng `popover` gốc của trình duyệt.
- Chuyển cảnh album polaroid → lightbox bằng React `<ViewTransition>`.
- Thêm `useNow("minute")`.
- Sửa token màu `--td-muted`, thêm `--td-live-fill` và `--td-live-text`.
- Dòng chữ nhỏ trên tiêu đề dùng font viết tay Dancing Script.
- Cài skill `frontend-design` (plugin chính thức của Anthropic). Chép hai bộ skill MIT sau khi đã đọc: `vercel-react-view-transitions` và `web-quality-skills`; không chạy `npx skills`.

**Phương án loại:**
- *UI UX Pro Max / Taste Skill:* thư viện style đại trà, dễ kéo web về giao diện chung chung.
- *Header cuộn ngang trên điện thoại:* chữ bị cắt, khó bấm.
- *Hamburger menu:* các mục chính bị giấu đi, xa vùng ngón cái.

**Hệ quả:**
- Trang chủ trên điện thoại: thời gian chặn luồng chính giảm 1.630 → 50 ms; a11y 100 trên 9 trang công khai.
- LCP mô phỏng trên mạng chậm vẫn khoảng 5 s, chủ yếu do lượng JS; LCP đo thật trên máy là 0,15 s.
- Giảm JS (Motion, các chunk chưa dùng) để lại cho đợt sau.

## ADR-013 – Tài khoản riêng tư: tên Bộ Tộc + mã khóa, không email, link mời cho chính chủ {#adr-013}

**Trạng thái:** Chấp nhận, 2026-11-10 (thay phần "Auth Google" của ADR-001)

**Bối cảnh:** Chủ dự án lo rằng bắt đăng nhập Gmail sẽ làm lộ thông tin: của anh Độ (mọi admin đều thấy email, email nằm trong DB của một web fan) và của người xem. Anh Độ cũng sẽ lo cho thông tin của người xem.

**Quyết định:**
- Bỏ đăng nhập Google. Mọi tài khoản là tên Bộ Tộc + mã khóa. Mã khóa do trang sinh (4 từ + 4 số, khoảng 41 bit) hoặc do người dùng tự đặt (≥ 8 ký tự, chặn mã phổ biến; chủ dự án quyết định 2026-11-10).
- Supabase Auth vẫn quản lý phiên và băm mật khẩu, nhưng mỗi user dùng một địa chỉ ảo `*.invalid`. Đăng ký công khai tắt: chỉ server của app tạo tài khoản, kèm giới hạn theo IP đã băm, giới hạn toàn site và Turnstile (tùy chọn).
- Anh Độ, team kênh và mod vào bằng link mời dùng một lần, hết hạn sau 48 giờ, tự đặt mã khóa. Chỉ chủ trang tạo được lời mời.

**Phương án loại:**
- *Gmail kèm danh sách email admin:* lộ email cho mọi admin.
- *Anonymous sign-in của Supabase:* ai cũng gọi được từ trình duyệt, dễ bị tạo clone hàng loạt; mất cookie là mất tài khoản.
- *Discord/Facebook OAuth:* vẫn đưa danh tính mạng xã hội cho trang.

**Hệ quả:**
- Mất mã khóa thì không khôi phục được (trang có ghi rõ). Chủ trang cấp lại quyền bằng link mời mới.
- Không còn tài khoản Google làm rào chắn chống clone. Thay bằng: giới hạn tạo tài khoản, luật tài khoản < 24 giờ (không vote, 2 đề xuất/ngày), duyệt trước, cấm và cấm ngầm, Turnstile.
- Service role có thêm một ngoại lệ, đã ghi trong `docs/07-conventions.md`.


## ADR-014 – Linh vật Cú Đêm, tranh anh Độ + Cú Đêm làm minh họa, nhạc nền bật ở lần chạm đầu {#adr-014}

**Bối cảnh:** Chủ dự án thêm hai bộ tranh (mỗi bộ 20 cảnh theo các mục của trang): linh vật cú “Cú Đêm” và tranh hoạt hình anh Độ cùng Cú Đêm. Chủ dự án cũng muốn nhạc nền tự phát khi vào trang.

**Quyết định:**
- **Cú Đêm thay Cú Tộc** làm linh vật của trang (`Mascot` trong `src/shared/ui/brand-art.tsx`, ảnh ở `public/art/cu-dem/`). Linh vật vẫn là nhân vật của trang, không phải hình anh Độ. Logo vẫn là logomark lửa trại.
- Tranh **anh Độ + Cú Đêm** (`public/art/do-mixi/`) chỉ dùng làm **minh họa nội dung** trong trang (đầu trang, empty state), có alt ghi rõ là tranh fan làm. Không bao giờ dùng làm logo, favicon, icon app, manifest hay ảnh chia sẻ OG.
- Một số tranh có chữ “Refund Gaming”/“MIXI”. Như thumbnail YouTube, chữ đó được chấp nhận khi tranh là nội dung minh họa, không được chấp nhận ở nhận diện trang ([01-product](01-product.md)).
- Bỏ hẳn 4 tranh: cú cầm đồ có logo LEGO (thương hiệu bên thứ ba), và các cảnh quyên góp / top donate (trang không nhận tiền dưới mọi hình thức).
- Ảnh gốc PNG (49 MB) để ở `design-src/` (gitignore). Trang dùng bản WebP 640×640 (~1,3 MB cả hai bộ), sinh bằng sharp.
- **Nhạc nền:** bài mặc định là **Airport Lounge** (`BGM_DEFAULT_SLUG`), trình phát thử phát ngay khi tải trang; trình duyệt thường chặn âm thanh tự phát trước khi người xem tương tác, khi đó nhạc bật ở **lần chạm hoặc bấm phím đầu tiên**, âm lượng nhỏ (30/100), có nút tắt. Ai bấm “Tắt hẳn nhạc” thì lần sau không tự bật (lưu `localStorage` key `gbt:bgm`). Không tự bật ở `/admin`, `/moi` và `/gui-anh-do`. Mở “Nghe trực tiếp” một bài khác thì nhạc nền tự dừng.

**Hệ quả:** COMPONENTS §12 đổi bảng pose sang ảnh Cú Đêm. `npm run brand` không còn sinh mascot dùng trên trang (file `public/brand/mascot/*` cũ để lại cho tới khi dọn brand.html). Safari đôi khi vẫn chặn widget SoundCloud tự phát; khung phát có ghi chú bấm ▶.

## ADR-015 – Không làm Web Push / nút chuông thông báo {#adr-015}

**Bối cảnh:** Đã viết xong Web Push (bảng `push_subscriptions`, nút 🔔, gửi khi live). Chủ dự án quyết định bỏ.

**Quyết định:** Không làm Web Push. Người xem muốn biết anh Độ lên sóng thì bấm chuông trên kênh YouTube, YouTube đã báo realtime. Trang không giữ thêm một kênh thông báo nữa.

**Hệ quả:** Gỡ code, dependency `web-push`, khóa VAPID khỏi `.env.example`; bảng `push_subscriptions` đã xóa ở project dev và migration được đánh dấu reverted. Kênh Telegram/Discord thông báo live (đã có từ trước) và WebSub (phát hiện video mới) vẫn giữ.

## ADR-016 – Được phép dùng logo MixiGaming và ảnh anh Độ làm nhận diện {#adr-016}

**Bối cảnh:** Các ADR trước (ADR-011, ADR-014) cấm dùng logo MixiGaming / Refund Gaming và ảnh anh Độ làm nhận diện trang. Ngày 2026-11-10 chủ dự án xác nhận ảnh và logo của anh Độ đã được cho phép sử dụng, muốn dùng làm nhận diện luôn và không cần ghi nguồn.

**Quyết định:**
- Logo MixiGaming (ảnh đại diện kênh: gương mặt + chữ MIXIGAMING) là nhận diện: huy hiệu ở header, favicon, icon app/PWA, ảnh chia sẻ OG. File ở `public/brand/official/`, sinh bằng sharp từ ảnh đại diện và banner kênh lấy qua YouTube Data API (`channels.list`, nguồn chính chủ).
- Ảnh anh Độ dùng tự do trong nội dung, không cần dòng ghi nguồn. Chỉ lấy từ nguồn anh Độ sở hữu: ảnh/banner kênh, thumbnail video của kênh, ảnh chủ dự án đưa vào repo. Không tải ảnh báo chí hay ảnh của người khác chụp: quyền anh Độ cho không phủ bản quyền của họ.
- Footer vẫn ghi rõ trang do fan làm, không phải kênh chính thức, để fan không nhầm.
- Thay ADR-011/ADR-014 ở phần nhận diện; Cú Đêm vẫn là linh vật của trang.

**Hệ quả:** `AGENTS.md`, `docs/01-product.md` và agent `fan-site-guard` được cập nhật theo quy tắc mới. Nếu sau này anh Độ rút lại sự cho phép, chỉ cần đổi `Logo` trong `src/shared/ui/brand-art.tsx`, icon và ảnh OG về lửa trại.

## ADR-017 – Bật layout animation (motion `domMax`) cho bảng đề xuất {#adr-017}

**Bối cảnh:** Chủ dự án muốn chuyển động mượt và đưa game mới / game fan làm lên trước. Bảng đề xuất giờ có các tab sắp xếp "Đang hot / Mới đề xuất / Bộ Tộc tự làm / Nhiều vote nhất"; khi đổi tab, các thẻ nên trượt về vị trí mới thay vì nhảy.

**Quyết định:** `src/shared/motion/features.ts` dùng `domMax` (thêm layout animation) thay cho `domAnimation`. Gói này vẫn được `MotionProvider` tải lười, không nằm trong chunk JS đầu tiên. Người bật giảm chuyển động không có layout animation (`layout` chỉ bật khi được phép).

**Hệ quả:** Thêm khoảng 15 KB (gzip) vào chunk motion tải sau. Các component khác có thể dùng `layout` khi thật sự cần, không cần ADR mới.

## ADR-018 – Kiểm tra live theo hẹn giờ, chỉ trong giờ live {#adr-018}

**Bối cảnh:** poll-live chạy mỗi phút quanh lịch (±2 giờ) và 5 phút một lần mọi lúc còn lại: khoảng 1.440 lần gọi Vercel và ~560 đơn vị YouTube mỗi ngày. Mỗi lần kiểm tra còn ghi `checked_at` vào `live_status`, bảng nằm trong Realtime, nên mọi tab đang mở nhận một tin dù không có gì đổi (200 fan ≈ 3,4 triệu tin/tháng, quá hạn mức gói Free). Chủ dự án muốn chỉ kiểm tra trong giờ live, ngừng khi đã thấy trạng thái, không kiểm tra liên tục.

**Quyết định:**
- poll-live tự hẹn lần kiểm tra kế tiếp (`nextCheckAt`, lưu ở bảng mới `live_poll_state`): mỗi phút trong khung 10 phút trước → 60 phút sau slot; tới 2 phút trước giờ hẹn khi đã có stream `upcoming`; 10 phút một lần khi đang live; còn lại ngủ tới khung kế tiếp, tối đa 2 giờ (lưới an toàn).
- pg_cron vẫn tick mỗi phút nhưng chỉ gọi app khi `poll_live_due()` đúng.
- Sửa lịch (trigger) và WebSub thấy video `live`/`upcoming` thì đánh thức hẹn giờ ngay.
- `live_status` chỉ được ghi khi thứ người xem thấy thay đổi; giờ kiểm tra nằm ở `live_poll_state` (không phát Realtime).
- Khi đang live, poll-live chỉ hỏi video đã biết, bỏ RSS; khi video đó kết thúc thì đọc RSS thêm một lần để bắt buổi phát lại.
- Stream hẹn giờ và khung lịch: lấy lần kiểm tra sớm hơn; stream hẹn giờ quá 1 giờ chưa lên sóng thì thôi theo dõi dày.
- Trước khi gọi YouTube, poll-live tự đặt hẹn giờ +5 phút, nên lỗi lặp lại tốn tối đa 12 lần gọi/giờ thay vì 60. Trigger đánh thức khi sửa lịch là **theo dòng**: câu lệnh bị RLS lọc còn 0 dòng (khách cầm anon key) không đánh thức được.

**Hệ quả:** ~30–110 lần gọi Vercel và đơn vị YouTube mỗi ngày (ngày không lịch gần 0 + 12 lần an toàn); khoảng 25 tin Realtime/fan/ngày. Đổi lại: biểu đồ người xem (`live_samples`) còn 10 phút một điểm; trang báo hết live chậm tối đa 10 phút; live ngoài lịch phụ thuộc WebSub (thường trễ vài phút) hoặc lưới an toàn 2 giờ. Thay phần "poll dày/thưa" của ADR-003 (pg_cron vẫn là đồng hồ).

