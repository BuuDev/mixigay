import Image from "next/image";
import { getGames } from "@/features/videos/server/queries";
import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { serverClient } from "@/server/supabase/server";
import { PENDING_FIRST, RejectedBadge, REJECTED_COLUMNS, type RejectedFields } from "@/features/moderation/components/rejected-badge";
import { deleteSuggestion, mirrorSuggestionArt, removeSuggestionArt, updateSuggestion } from "./actions";
import { thumbnailUrlFor } from "../lib/mapper";
import { parseThumbnailReview } from "../lib/image-policy";
import { button, GameSelect, input, primary, Section } from "@/features/admin/ui";

export async function SuggestionAdmin() {
  const supabase = await serverClient();
  const [{ data }, games] = await Promise.all([
    supabase
      .from("suggestions")
      .select(
        `id,author_id,name,url,source,status,upvotes,hidden,approved,reason,linked_game_slug,steam_app_id,steam_data,thumbnail_path,created_at,${REJECTED_COLUMNS},profiles!author_id(display_name),suggestion_art_reviews(review)`,
      )
      .order("approved")
      .order("hidden")
      .order("rejected_at", PENDING_FIRST)
      .order("created_at", { ascending: false })
      .limit(300),
    getGames(),
  ]);
  const rows = (data ?? []) as unknown as (RejectedFields & {
    id: string;
    author_id: string;
    name: string;
    url: string | null;
    approved: boolean;
    status: string;
    upvotes: number;
    hidden: boolean;
    reason: string;
    linked_game_slug: string | null;
    source: string;
    steam_app_id: number | null;
    steam_data: { headerImage?: unknown } | null;
    thumbnail_path: string | null;
    suggestion_art_reviews: { review: unknown } | null;
    created_at: string;
    profiles: { display_name: string } | null;
  })[];
  return (
    <Section title="Đề xuất – duyệt trước khi hiện">
      <p className="text-xs text-muted">
        Đề xuất mới chỉ hiện công khai khi tick “duyệt”. Gặp người cố tình phá: dùng Cấm / Cấm ngầm (ẩn hết bài của họ), đừng xóa từng bài – xóa sẽ trả lại hạn
        mức gửi cho họ.
      </p>
      <ul className="divide-y divide-border text-sm">
        {rows.map((s) => (
          <li key={s.id} className={`space-y-1 py-2 ${s.hidden ? "opacity-50" : ""}`}>
            <div>
              <RejectedBadge row={s} />
              {!s.approved && !s.hidden && !s.rejected_at && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
              <strong>{s.name}</strong> · {s.upvotes} vote · {s.profiles?.display_name} · {formatDate(s.created_at)}
              <ScreenFlags flags={screenText([s.name, s.reason, s.url]).flags} />
            </div>
            <p className="text-muted">{s.reason}</p>
            {s.url && <p className="text-xs break-all text-muted">{s.url}</p>}
            <ArtReview row={s} />
            <UserModeration userId={s.author_id} />
            <form action={updateSuggestion} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <select name="status" defaultValue={s.status} className={input}>
                <option value="pending">Đang chờ</option>
                <option value="played">Anh Độ đã chơi</option>
                <option value="rejected">Từ chối</option>
              </select>
              <GameSelect games={games} value={s.linked_game_slug} empty="— liên kết game —" />
              <label className="flex items-center gap-1">
                <input type="checkbox" name="approved" defaultChecked={s.approved} /> duyệt
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="hidden" defaultChecked={s.hidden} /> ẩn (spam)
              </label>
              <button className={primary}>Lưu</button>
              <button
                formAction={deleteSuggestion.bind(null, s.id)}
                className={button}
                title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng ẩn hoặc Cấm)"
              >
                Xóa hẳn
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const VERDICT = { ok: "quét: ổn", review: "quét: cần xem", block: "quét: chặn" } as const;

/** Stored game art, big enough to judge, with the automated verdict and the art actions. */
function ArtReview({
  row,
}: {
  row: {
    id: string;
    name: string;
    steam_app_id: number | null;
    steam_data: { headerImage?: unknown } | null;
    thumbnail_path: string | null;
    suggestion_art_reviews: { review: unknown } | null;
  };
}) {
  const url = thumbnailUrlFor(row.thumbnail_path);
  const review = parseThumbnailReview(row.suggestion_art_reviews?.review);
  const canMirror = Boolean(row.steam_app_id && typeof row.steam_data?.headerImage === "string");
  if (!url && !canMirror) return null;
  return (
    <div className="flex flex-wrap items-start gap-3">
      {url && (
        // unoptimized: show the exact stored bytes, not an optimizer copy that outlives "Gỡ ảnh".
        <Image
          src={url}
          alt={`Ảnh của ${row.name}`}
          width={320}
          height={180}
          unoptimized
          className="aspect-video w-80 rounded-sm border border-border object-cover"
        />
      )}
      <div className="space-y-1 text-xs">
        {review && (
          <div className={review.verdict === "ok" ? "text-cleared" : "text-live-text"}>
            {VERDICT[review.verdict]} ({review.source === "steam" ? "ảnh Steam" : "fan tải lên"}){review.reasons.length > 0 && `: ${review.reasons.join("; ")}`}
          </div>
        )}
        <form className="flex flex-wrap gap-2">
          {canMirror && (
            <button formAction={mirrorSuggestionArt.bind(null, row.id)} className={button}>
              Lưu ảnh Steam về
            </button>
          )}
          {url && (
            <button formAction={removeSuggestionArt.bind(null, row.id, false)} className={button}>
              Gỡ ảnh
            </button>
          )}
          {url && review && (
            <button formAction={removeSuggestionArt.bind(null, row.id, true)} className={button} title="Gỡ ảnh và từ chối mọi lần tải lại đúng ảnh này">
              Gỡ ảnh + chặn vĩnh viễn
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
