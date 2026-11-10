import { serverClient } from "@/server/supabase/server";
import { button, input, primary, Section } from "@/features/admin/ui";
import { mapPoll, POLL_SELECT, type PollRow } from "../lib/mapper";
import { formatVnDateTime, isoToVnLocal, leaderIds, totalVotes, votePercents } from "../lib/results";
import type { Poll } from "../types";
import { PollStateBadge } from "./poll-state-badge";
import { createPoll, createPollFromSuggestions, deleteDraftPoll, setPollClosesAt, setPollStatus, updateDraftPoll } from "./actions";

export async function PollAdmin() {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("polls").select(POLL_SELECT).order("created_at", { ascending: false }).limit(50);
  const polls = ((data ?? []) as PollRow[]).map((r) => mapPoll({ ...r, poll_options: r.poll_options ?? [] }) ?? draftWithoutOptions(r));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Bình chọn của Bộ Tộc – quản lý</h1>
      <p className="text-sm text-muted">
        Bình chọn mới luôn là nháp (fan không thấy). Mở để fan bình chọn: chỉ tài khoản trên 24 giờ, mỗi người một phiếu, đổi được khi còn mở. Trang chủ hiện
        bình chọn đang mở mới nhất, không có thì hiện kết quả lần gần nhất. Giờ nhập theo giờ Việt Nam.
      </p>
      {error && <p className="text-sm text-live-text">Không đọc được danh sách: {error.message}</p>}

      <Section title="Tạo bình chọn">
        <form action={createPoll} className="grid gap-2 sm:max-w-xl">
          <label className="grid gap-1 text-sm">
            Câu hỏi (5–140 ký tự)
            <input name="question" required minLength={5} maxLength={140} placeholder="Tối nay anh Độ nên chơi game gì?" className={input} />
          </label>
          <label className="grid gap-1 text-sm">
            Lựa chọn: mỗi dòng một lựa chọn (2–8, tối đa 80 ký tự)
            <textarea name="options" required rows={5} className={input} placeholder={"Game kinh dị\nGame do fan làm\nĐể anh Độ tự chọn"} />
          </label>
          <label className="grid gap-1 text-sm">
            Tự đóng lúc (để trống = mở tới khi bấm Đóng)
            <input name="closes_at" type="datetime-local" className={input} />
          </label>
          <div>
            <button className={primary}>Tạo nháp</button>
          </div>
        </form>
      </Section>

      <Section title="Tạo từ đề xuất được vote nhiều nhất">
        <p className="text-sm text-muted">
          Lấy các đề xuất game đã duyệt, chưa chơi, không bị ẩn, xếp theo số upvote. Tạo thành nháp để bạn xem lại trước khi mở.
        </p>
        <form action={createPollFromSuggestions} className="flex flex-wrap items-end gap-2">
          <label className="grid flex-1 gap-1 text-sm">
            Câu hỏi
            <input name="question" required minLength={5} maxLength={140} defaultValue="Bộ Tộc muốn anh Độ thử game nào tiếp theo?" className={input} />
          </label>
          <label className="grid gap-1 text-sm">
            Số lựa chọn
            <select name="limit" defaultValue="4" className={input}>
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className={primary}>Tạo nháp từ đề xuất</button>
        </form>
      </Section>

      <Section title="Danh sách bình chọn">
        {polls.length === 0 ? (
          <p className="text-sm text-muted">Chưa có bình chọn nào.</p>
        ) : (
          <ul className="space-y-4">
            {polls.map((p) => (
              <PollRowAdmin key={p.id} poll={p} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** A draft whose options were all removed still needs to be listed (mapPoll drops it). */
function draftWithoutOptions(r: PollRow): Poll {
  return {
    id: r.id,
    question: r.question,
    status: r.status === "open" || r.status === "closed" ? r.status : "draft",
    closesAt: r.closes_at,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    createdAt: r.created_at,
    options: (r.poll_options ?? []).map((o) => ({ id: o.id, label: o.label, position: o.position, votes: o.votes, suggestionId: o.suggestion_id })),
  };
}

function PollRowAdmin({ poll }: { poll: Poll }) {
  const total = totalVotes(poll.options);
  const percents = votePercents(poll.options.map((o) => o.votes));
  const leaders = leaderIds(poll.options);

  return (
    <li className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <PollStateBadge status={poll.status} closesAt={poll.closesAt} />
        <span className="font-semibold">{poll.question}</span>
        <span className="text-xs text-muted">
          {total} phiếu · tạo {formatVnDateTime(poll.createdAt)}
          {poll.closesAt && ` · đóng lúc ${formatVnDateTime(poll.closesAt)}`}
        </span>
      </div>

      <ol className="space-y-1 text-sm">
        {poll.options.map((o, i) => (
          <li key={o.id} className="flex items-center gap-2">
            <span className="w-10 text-right font-mono tabular-nums">{percents[i]}%</span>
            <span className="w-14 text-right text-muted tabular-nums">{o.votes}</span>
            <span className={leaders.includes(o.id) ? "font-semibold text-accent" : ""}>{o.label}</span>
            {o.suggestionId && <span className="text-xs text-muted">(từ đề xuất)</span>}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        {poll.status !== "open" && (
          <form action={setPollStatus.bind(null, poll.id, "open")}>
            <button className={primary} disabled={poll.options.length < 2}>
              {poll.status === "draft" ? "Mở bình chọn" : "Mở lại"}
            </button>
          </form>
        )}
        {poll.status === "open" && (
          <form action={setPollStatus.bind(null, poll.id, "closed")}>
            <button className={button}>Đóng bình chọn</button>
          </form>
        )}
        <form action={setPollClosesAt.bind(null, poll.id)} className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            <span className="sr-only">Tự đóng lúc (giờ Việt Nam)</span>
            <input name="closes_at" type="datetime-local" defaultValue={isoToVnLocal(poll.closesAt)} className={input} />
          </label>
          <button className={button}>Lưu giờ đóng</button>
        </form>
        {poll.status === "draft" && (
          <form action={deleteDraftPoll.bind(null, poll.id)}>
            <button className={button}>Xóa nháp</button>
          </form>
        )}
      </div>

      {poll.status === "draft" && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">Sửa nháp</summary>
          <form action={updateDraftPoll.bind(null, poll.id)} className="mt-2 grid gap-2 sm:max-w-xl">
            <input name="question" required minLength={5} maxLength={140} defaultValue={poll.question} className={input} aria-label="Câu hỏi" />
            <textarea
              name="options"
              required
              rows={5}
              defaultValue={poll.options.map((o) => o.label).join("\n")}
              className={input}
              aria-label="Lựa chọn, mỗi dòng một"
            />
            <div>
              <button className={primary}>Lưu nháp</button>
            </div>
          </form>
        </details>
      )}
    </li>
  );
}
