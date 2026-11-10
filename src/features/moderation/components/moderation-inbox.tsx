import Image from "next/image";
import Link from "next/link";
import { ScreenFlags } from "@/features/admin/components/user-moderation";
import { button, input, primary, Section } from "@/features/admin/ui";
import { formatDate } from "@/shared/lib/format";
import { chipClass } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { approveItem, approveSelected, banAuthorAndReject, rejectItem, rejectSelected } from "../actions";
import { CONTENT_KINDS, KIND_LIST, linkHost, type ContentKind } from "../lib/kinds";
import { accountAge, INBOX_LIMIT_MAX, INBOX_STEP, inboxHref, itemRef, REASON_MAX, REJECT_PRESETS, trustLabel } from "../lib/review";
import { getInbox, getPendingCounts, totalPending, type InboxEntry } from "../server/inbox";

const BULK_FORM = "duyet-bulk";

/** The shared approval inbox: every kind of fan content waiting for a decision, newest first. */
export async function ModerationInbox({ kind, limit }: { kind?: ContentKind; limit: number }) {
  const [counts, inbox] = await Promise.all([getPendingCounts(), getInbox({ kind, limit })]);
  const total = totalPending(counts);
  return (
    <Section title="Hộp duyệt – mọi nội dung fan gửi đang chờ">
      <p className="text-xs text-muted">
        Duyệt thì nội dung hiện công khai. Từ chối thì giữ lại bản ghi (không trả lại hạn mức gửi) và tác giả thấy lý do trong trang tài khoản. Gặp người cố
        tình phá: dùng “Cấm tác giả + từ chối”. Link chỉ hiện tên miền; tự mở khi cần, đừng bấm link lạ.
      </p>

      <nav aria-label="Lọc theo loại" className="flex flex-wrap gap-2">
        <Link href={inboxHref(undefined)} className={chipClass(!kind)} aria-current={!kind ? "page" : undefined}>
          Tất cả ({total})
        </Link>
        {KIND_LIST.map((k) => (
          <Link key={k.kind} href={inboxHref(k.kind)} className={chipClass(kind === k.kind)} aria-current={kind === k.kind ? "page" : undefined}>
            {k.label} ({counts[k.kind]})
          </Link>
        ))}
        <Link href="/admin" className={chipClass(false)}>
          Báo cáo mở ({counts.reports})
        </Link>
      </nav>

      {inbox.items.length === 0 ? (
        <EmptyState title="Không còn gì chờ duyệt">{kind ? `Mục “${CONTENT_KINDS[kind].label}” đã sạch hàng chờ.` : "Bộ Tộc ngoan hôm nay."}</EmptyState>
      ) : (
        <>
          <form id={BULK_FORM} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2 text-sm">
            <span className="text-muted">Các mục đã chọn:</span>
            <button formAction={approveSelected} className={primary}>
              Duyệt các mục đã chọn
            </button>
            <ReasonFields />
            <button formAction={rejectSelected} className={button}>
              Từ chối các mục đã chọn
            </button>
          </form>

          <h3 className="sr-only">Mục chờ duyệt</h3>
          <ul className="divide-y divide-border text-sm">
            {inbox.items.map((item) => (
              <InboxCard key={itemRef(item.kind, item.id)} item={item} now={inbox.now} />
            ))}
          </ul>

          {inbox.hasMore && limit < INBOX_LIMIT_MAX && (
            <Link href={inboxHref(kind, limit + INBOX_STEP)} className={button}>
              Xem thêm
            </Link>
          )}
          {inbox.hasMore && limit >= INBOX_LIMIT_MAX && <p className="text-xs text-muted">Còn nữa: xử lý bớt rồi tải lại trang.</p>}
        </>
      )}
    </Section>
  );
}

function ReasonFields() {
  return (
    <>
      <select name="preset" defaultValue={REJECT_PRESETS[0]} aria-label="Lý do từ chối" className={input}>
        {REJECT_PRESETS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input
        name="note"
        maxLength={REASON_MAX}
        placeholder="Ghi thêm (tùy chọn, bắt buộc khi chọn Khác)"
        aria-label="Ghi thêm lý do"
        className={`${input} w-64`}
      />
    </>
  );
}

function InboxCard({ item, now }: { item: InboxEntry; now: number }) {
  const def = CONTENT_KINDS[item.kind];
  const host = linkHost(item.url);
  const trust = trustLabel(item.author.trust);
  const ref = itemRef(item.kind, item.id);
  return (
    <li className="flex flex-wrap items-start gap-3 py-3">
      <label className="flex items-center gap-1 pt-0.5 text-xs">
        <input type="checkbox" name="item" value={ref} form={BULK_FORM} className="size-5" />
        <span className="sr-only">Chọn {item.title}</span>
      </label>
      {item.imageUrl && (
        // unoptimized: Drive / Storage / song-cover hosts are shown as-is, and the admin sees the exact bytes.
        <Image
          src={item.imageUrl}
          alt={`Ảnh của ${item.title}`}
          width={160}
          height={90}
          unoptimized
          referrerPolicy="no-referrer"
          className="aspect-video w-40 shrink-0 rounded-sm border border-border object-cover"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded bg-accent/20 px-1.5 text-xs font-semibold">{def.label}</span>
          <span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
          <ScreenFlags flags={item.flags} />
        </div>
        <h4 className="line-clamp-3 font-semibold break-words">{item.title}</h4>
        {item.extra && <p className="text-xs text-muted">{item.extra}</p>}
        {item.body && <p className="line-clamp-4 break-words text-muted">{item.body}</p>}
        {item.url && (
          <p className="text-xs break-all text-muted">
            Link tới: <span className="font-mono text-foreground">{host ?? "(link không hợp lệ)"}</span>
          </p>
        )}
        <p className="text-xs text-muted">
          {item.author.displayName}
          {item.author.createdAt && ` · ${accountAge(item.author.createdAt, now)}`}
          {trust && <span className="font-semibold text-live-text"> · {trust}</span>}
          {item.author.rejectedCount > 0 && ` · đã bị từ chối ${item.author.rejectedCount} lần`}
          {item.author.pendingCount > 1 && ` · ${item.author.pendingCount} mục đang chờ`}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <form action={approveItem.bind(null, item.kind, item.id)}>
            <button className={primary}>Duyệt</button>
          </form>
          <details className="group">
            <summary className={`${button} cursor-pointer list-none`}>Từ chối…</summary>
            <form action={rejectItem.bind(null, item.kind, item.id)} className="mt-2 flex flex-wrap items-center gap-2">
              <ReasonFields />
              <button className={button}>Từ chối</button>
            </form>
          </details>
          <form action={banAuthorAndReject.bind(null, item.kind, item.id, item.authorId)}>
            <button className={button} title="Từ chối mục này rồi cấm tác giả: ẩn mọi bài cũ, gỡ mọi vote">
              Cấm tác giả + từ chối
            </button>
          </form>
          <Link href={def.adminHref} className="text-xs underline underline-offset-2">
            Mở trang quản lý loại này
          </Link>
        </div>
      </div>
    </li>
  );
}
