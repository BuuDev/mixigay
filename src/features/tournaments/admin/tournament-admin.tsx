import { button, input, primary, Section } from "@/features/admin/ui";
import { KIND_LABEL, STATUS_LABEL } from "../lib/tournaments";
import { getTournaments } from "../server/queries";
import { TOURNAMENT_KINDS, TOURNAMENT_STATUSES, type Tournament } from "../types";
import { deleteResult, deleteTournament, saveResult, saveTournament } from "./actions";

export async function TournamentAdmin() {
  const tournaments = await getTournaments();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Giải đấu – quản lý</h1>
      <p className="max-w-prose text-sm text-muted">
        Ngày và kết quả là thông tin về người thật: chỉ nhập theo sóng chính thức của anh Độ hoặc thông báo chính chủ, kèm link video hoặc link nguồn.
      </p>
      <Section title="Thêm giải">
        <TournamentForm />
      </Section>
      {tournaments.map((t) => (
        <Section key={t.slug} title={t.name}>
          <TournamentForm tournament={t} />
          <Results tournament={t} />
          <form action={deleteTournament.bind(null, t.slug)} className="border-t border-border pt-2">
            <button className={button}>Xóa giải “{t.name}” (cả kết quả)</button>
          </form>
        </Section>
      ))}
    </div>
  );
}

function TournamentForm({ tournament: t }: { tournament?: Tournament }) {
  return (
    <form action={saveTournament} className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {t && <input type="hidden" name="original" value={t.slug} />}
      <label className="flex flex-col gap-1">
        Slug
        <input name="slug" required pattern="[a-z0-9\-]{3,60}" defaultValue={t?.slug} placeholder="ao-lang-delta-force" className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Tên giải
        <input name="name" required minLength={2} maxLength={120} defaultValue={t?.name} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Loại
        <select name="kind" defaultValue={t?.kind ?? "other"} className={input}>
          {TOURNAMENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Trạng thái
        <select name="status" defaultValue={t?.status ?? "upcoming"} className={input}>
          {TOURNAMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Bắt đầu (giờ VN)
        <input name="starts_on" type="date" defaultValue={t?.startsOn ?? ""} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Kết thúc (giờ VN)
        <input name="ends_on" type="date" defaultValue={t?.endsOn ?? ""} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Video sóng (ID hoặc link YouTube)
        <input name="video_id" defaultValue={t?.videoId ?? ""} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        Link nguồn (https)
        <input name="source_url" type="url" defaultValue={t?.sourceUrl ?? ""} className={input} />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
        Mô tả (≤ 600 ký tự)
        <textarea name="description" maxLength={600} rows={2} defaultValue={t?.description ?? ""} className={input} />
      </label>
      <div className="flex items-end">
        <button className={primary}>{t ? "Lưu giải" : "Thêm giải"}</button>
      </div>
    </form>
  );
}

function Results({ tournament: t }: { tournament: Tournament }) {
  return (
    <div className="space-y-2 border-t border-border pt-2 text-sm">
      <h3 className="font-semibold">Kết quả</h3>
      {t.results.map((r) => (
        // Rank is the key: to move a row, add it at the new rank and delete the old one.
        <form key={r.rank} action={saveResult} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="tournament" value={t.slug} />
          <input type="hidden" name="rank" value={r.rank} />
          <span className="w-10 font-mono">#{r.rank}</span>
          <input name="name" required maxLength={120} defaultValue={r.name} aria-label={`Tên hạng ${r.rank}`} className={input} />
          <input name="note" maxLength={200} defaultValue={r.note ?? ""} placeholder="Ghi chú" aria-label={`Ghi chú hạng ${r.rank}`} className={input} />
          <button className={primary}>Lưu</button>
          <button formAction={deleteResult.bind(null, t.slug, r.rank)} className={button}>
            Xóa
          </button>
        </form>
      ))}
      <form action={saveResult} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="tournament" value={t.slug} />
        <input
          name="rank"
          type="number"
          min={1}
          max={64}
          required
          defaultValue={(t.results.at(-1)?.rank ?? 0) + 1}
          aria-label="Hạng"
          className={`${input} w-16`}
        />
        <input name="name" required maxLength={120} placeholder="Tên đội / người chơi" aria-label="Tên" className={input} />
        <input name="note" maxLength={200} placeholder="Ghi chú" aria-label="Ghi chú" className={input} />
        <button className={primary}>Thêm hạng</button>
      </form>
    </div>
  );
}
