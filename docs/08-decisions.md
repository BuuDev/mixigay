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

