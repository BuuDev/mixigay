import { ScreenFlags, UserModeration } from "@/features/admin/components/user-moderation";
import { button, input, primary, Section } from "@/features/admin/ui";
import { formatClock } from "@/features/quotes/lib/moment";
import { serverClient } from "@/server/supabase/server";
import { PENDING_FIRST, RejectedBadge, REJECTED_COLUMNS, type RejectedFields } from "@/features/moderation/components/rejected-badge";
import { formatDate } from "@/shared/lib/format";
import { screenText } from "@/shared/lib/moderation/screen";
import { mapQuizLinks, QUIZ_LINK_SELECT, type QuizLinkRow } from "../lib/mapper";
import { playedMomentUrl, QUIZ_PLATFORM_LABEL } from "../lib/quiz-url";
import type { QuizLink } from "../types";
import { clearQuizLinkPlayed, deleteQuizLink, markQuizLinkPlayed, setQuizLinkApproved } from "./actions";

function LinkSummary({ link: l }: { link: QuizLink }) {
  return (
    <span className="min-w-0 flex-1 space-y-1">
      <span className="block">
        {!l.approved && <span className="mr-1 rounded bg-accent/20 px-1.5 text-xs font-semibold">chờ duyệt</span>}
        <span className="text-muted">
          {QUIZ_PLATFORM_LABEL[l.platform]} · {l.author} · {formatDate(l.createdAt)}
        </span>
        <ScreenFlags flags={screenText([l.title, l.description]).flags} />
      </span>
      <span className="block font-semibold break-words">{l.title}</span>
      {l.description && <span className="block text-xs break-words text-muted">{l.description}</span>}
      <a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="block text-xs break-all underline underline-offset-2">
        {l.url}
      </a>
      {l.authorId && <UserModeration userId={l.authorId} />}
    </span>
  );
}

/** Moderation for the quiz-link board: pending queue, then approved links with the "anh Độ đã chơi" moment. */
export async function QuizAdmin() {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("quiz_links")
    .select(`${QUIZ_LINK_SELECT},${REJECTED_COLUMNS}`)
    .order("approved")
    .order("rejected_at", PENDING_FIRST)
    .order("created_at", { ascending: false })
    .limit(300);
  const raw = (data ?? []) as unknown as (QuizLinkRow & RejectedFields)[];
  const rejectedRows = new Map(raw.filter((r) => r.rejected_at).map((r) => [r.id, r]));
  const links = mapQuizLinks(raw);
  const pending = links.filter((l) => !l.approved && !rejectedRows.has(l.id));
  const rejected = links.filter((l) => !l.approved && rejectedRows.has(l.id));
  const approved = links.filter((l) => l.approved);

  return (
    <div className="space-y-6">
      <Section title="Quiz Bộ Tộc – link chờ duyệt">
        <p className="text-xs text-muted">
          Mở thử từng link trước khi duyệt: phải là quiz thật, chơi được không cần đăng nhập, câu hỏi về anh Độ chỉ dựa trên điều anh Độ đã nói hoặc làm trên
          sóng, không bịa, không xúc phạm, không quảng cáo. Gặp người cố tình phá: dùng Cấm / Cấm ngầm, đừng xóa từng link – xóa sẽ trả lại hạn mức gửi cho họ.
        </p>
        <ul className="divide-y divide-border text-sm">
          {pending.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2">
              <LinkSummary link={l} />
              <form action={setQuizLinkApproved.bind(null, l.id, true)}>
                <button className={primary}>Duyệt</button>
              </form>
              <form action={deleteQuizLink.bind(null, l.id)}>
                <button className={button} title="Xóa hẳn (trả lại hạn mức gửi cho tác giả – với spam hãy dùng Cấm)">
                  Xóa hẳn
                </button>
              </form>
            </li>
          ))}
          {!pending.length && <li className="py-2 text-muted">Không có link nào chờ duyệt.</li>}
        </ul>
      </Section>

      {rejected.length > 0 && (
        <Section title="Link đã từ chối">
          <ul className="divide-y divide-border text-sm">
            {rejected.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 py-1">
                <RejectedBadge row={rejectedRows.get(l.id) ?? {}} />
                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                <form action={setQuizLinkApproved.bind(null, l.id, true)}>
                  <button className={button}>Duyệt lại</button>
                </form>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Quiz đã duyệt – đánh dấu anh Độ đã chơi">
        <p className="text-xs text-muted">
          Chỉ đánh dấu khi đã tận mắt thấy anh Độ chơi quiz này trên sóng. Nhập id video (hoặc dán link YouTube, có ?t= càng tốt) và mốc bắt đầu dạng mm:ss hoặc
          h:mm:ss. Video phải có trong kho video của Góc Bộ Tộc.
        </p>
        <ul className="divide-y divide-border text-sm">
          {approved.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2">
              <LinkSummary link={l} />
              <span className="flex flex-col gap-2">
                {l.playedVideoId ? (
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    Đã chơi:
                    <a
                      href={playedMomentUrl(l.playedVideoId, l.playedAtSeconds)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline underline-offset-2"
                    >
                      {l.playedVideoId}
                      {l.playedAtSeconds !== undefined && ` @ ${formatClock(l.playedAtSeconds)}`}
                    </a>
                    <form action={clearQuizLinkPlayed.bind(null, l.id)}>
                      <button className={button}>Bỏ đánh dấu</button>
                    </form>
                  </span>
                ) : null}
                <form action={markQuizLinkPlayed.bind(null, l.id)} className="flex flex-wrap items-center gap-2">
                  <input name="video" required aria-label="Id hoặc link video YouTube" placeholder="id video / link YouTube" className={input} />
                  <input name="time" aria-label="Mốc thời gian" placeholder="mm:ss" className={`${input} w-24`} />
                  <button className={button}>{l.playedVideoId ? "Sửa mốc" : "Đã chơi"}</button>
                </form>
              </span>
              <form action={setQuizLinkApproved.bind(null, l.id, false)}>
                <button className={button}>Gỡ duyệt</button>
              </form>
              <form action={deleteQuizLink.bind(null, l.id)}>
                <button className={button}>Xóa hẳn</button>
              </form>
            </li>
          ))}
          {!approved.length && <li className="py-2 text-muted">Chưa có link nào được duyệt.</li>}
        </ul>
      </Section>
    </div>
  );
}
