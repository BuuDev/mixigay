"use client";

import Image from "next/image";
import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createSuggestion, searchSimilar, toggleVote, type SimilarItem } from "@/app/de-xuat/actions";
import { formatDate } from "@/lib/format";
import { steamAppIdFromUrl, type SteamDetails } from "@/lib/steam";
import { normalizeName } from "@/lib/text";
import type { Suggestion, SuggestionSource, SuggestionStatus } from "@/lib/types";

const SOURCE_LABEL: Record<SuggestionSource, string> = {
  steam: "Steam",
  "viewer-made": "Game viewer làm",
  other: "Khác",
};

const STATUS: Record<SuggestionStatus, { label: string; className: string }> = {
  pending: { label: "Đang chờ", className: "bg-zinc-500/15 text-muted" },
  played: { label: "Độ đã chơi", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  rejected: { label: "Từ chối", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

const PLAY_LABEL: Record<string, string> = { playing: "Độ đang chơi", finished: "Độ đã phá đảo", dropped: "Độ đã drop" };

interface Props {
  initial: Suggestion[];
  votedIds: string[];
  /** "live" talks to Supabase; "demo" (no backend configured) keeps everything in the browser. */
  mode: "live" | "demo";
  signedIn: boolean;
}

type VoteAction = { id: string; voted: boolean };

export function SuggestionBoard({ initial, votedIds, mode, signedIn }: Props) {
  // Demo mode keeps its own copy; live mode always renders the server's latest props.
  const [demoItems, setDemoItems] = useState(initial);
  const [demoVoted, setDemoVoted] = useState<Set<string>>(new Set());
  const baseItems = mode === "demo" ? demoItems : initial;
  const baseVoted = mode === "demo" ? demoVoted : new Set(votedIds);

  const [optimistic, applyVote] = useOptimistic({ items: baseItems, voted: baseVoted }, (state, { id, voted }: VoteAction) => {
    const next = new Set(state.voted);
    if (voted) next.add(id);
    else next.delete(id);
    return {
      voted: next,
      items: state.items.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + (voted ? 1 : -1) } : s)),
    };
  });
  const [, startTransition] = useTransition();
  const [notice, setNotice] = useState<string>();
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");

  function onVote(id: string) {
    const voted = !optimistic.voted.has(id);
    if (mode === "demo") {
      setDemoVoted((prev) => {
        const next = new Set(prev);
        if (voted) next.add(id);
        else next.delete(id);
        return next;
      });
      setDemoItems((prev) => prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + (voted ? 1 : -1) } : s)));
      return;
    }
    if (!signedIn) {
      setNotice("Đăng nhập Google (góc trên bên phải) để upvote.");
      return;
    }
    startTransition(async () => {
      applyVote({ id, voted });
      const res = await toggleVote(id);
      if (!res.ok) setNotice(res.message ?? "Có lỗi, thử lại sau.");
    });
  }

  const shown = optimistic.items.filter((s) => filter === "all" || s.status === filter).sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "played", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-sm ${filter === f ? "border-accent bg-accent text-white" : "border-border bg-surface"}`}
            >
              {f === "all" ? "Tất cả" : STATUS[f].label}
            </button>
          ))}
        </div>
        {notice && (
          <p role="status" className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm">
            {notice}
          </p>
        )}
        <ul className="mt-4 space-y-3">
          {shown.map((s) => (
            <li key={s.id} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
              <button
                onClick={() => onVote(s.id)}
                className={`flex w-14 shrink-0 flex-col items-center self-start rounded-lg border py-1.5 text-sm ${optimistic.voted.has(s.id) ? "border-accent text-accent" : "border-border"}`}
                aria-pressed={optimistic.voted.has(s.id)}
                aria-label={`Upvote ${s.name}`}
              >
                <span>▲</span>
                <span className="font-semibold tabular-nums">{s.upvotes}</span>
              </button>
              {s.steam?.headerImage && (
                <div className="relative hidden aspect-[460/215] w-36 shrink-0 self-start overflow-hidden rounded-md sm:block">
                  <Image src={s.steam.headerImage} alt="" fill sizes="9rem" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="hover:underline">
                        {s.name}
                      </a>
                    ) : (
                      s.name
                    )}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[s.status].className}`}>{STATUS[s.status].label}</span>
                  <span className="text-xs text-muted">{SOURCE_LABEL[s.source]}</span>
                </div>
                <p className="mt-1 text-sm break-words">{s.reason}</p>
                {s.steam && (
                  <p className="mt-1 text-xs text-muted">
                    {s.steam.price} · {s.steam.genres.join(", ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {s.author} · {formatDate(s.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        {mode === "demo" ? (
          <DemoForm items={demoItems} onAdd={(s) => setDemoItems((prev) => [s, ...prev])} />
        ) : signedIn ? (
          <LiveForm />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm lg:sticky lg:top-20">
            <h2 className="font-semibold">Đề xuất game cho Độ</h2>
            <p className="mt-2 text-muted">Đăng nhập Google (góc trên bên phải) để gửi đề xuất và upvote. Chỉ dùng để chống spam.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function SimilarHint({ items }: { items: { key: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg bg-accent/10 p-2 text-xs">
      Có thể đã có rồi:
      <ul className="mt-1 list-disc pl-4">
        {items.map((s) => (
          <li key={s.key}>{s.label}</li>
        ))}
      </ul>
      Nếu trùng, upvote thay vì tạo mới nhé.
    </div>
  );
}

function similarLabel(s: SimilarItem): string {
  if (s.kind === "game") return `${s.name} – ${PLAY_LABEL[s.status] ?? "có trong danh sách game"}`;
  return `${s.name} (${STATUS[s.status as SuggestionStatus]?.label ?? s.status}, ${s.upvotes} vote)`;
}

const fieldClass = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2";

function LiveForm() {
  const [result, formAction, pending] = useActionState(createSuggestion, null);
  const [name, setName] = useState("");
  const [source, setSource] = useState<SuggestionSource>("steam");
  const [url, setUrl] = useState("");
  const [similar, setSimilar] = useState<SimilarItem[]>([]);
  const [steam, setSteam] = useState<SteamDetails | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const debouncedName = useDebounced(name, 350);
  useEffect(() => {
    let cancelled = false;
    const q = debouncedName.trim().length >= 3 ? debouncedName : "";
    (q ? searchSimilar(q) : Promise.resolve([])).then((items) => !cancelled && setSimilar(items));
    return () => {
      cancelled = true;
    };
  }, [debouncedName]);

  const appId = source === "steam" ? steamAppIdFromUrl(url) : undefined;
  useEffect(() => {
    let cancelled = false;
    (appId ? fetch(`/api/steam/${appId}`).then((r) => (r.ok ? (r.json() as Promise<SteamDetails>) : null)) : Promise.resolve(null))
      .catch(() => null)
      .then((d) => !cancelled && setSteam(d));
    return () => {
      cancelled = true;
    };
  }, [appId]);

  useEffect(() => {
    if (!result?.ok) return;
    formRef.current?.reset();
    // Clearing controlled fields after a successful submit, a response to the action result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName("");
    setUrl("");
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20">
      <h2 className="font-semibold">Đề xuất game cho Độ</h2>
      <label className="block text-sm">
        Nguồn
        <select name="source" value={source} onChange={(e) => setSource(e.target.value as SuggestionSource)} className={fieldClass}>
          {Object.entries(SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Link{source === "steam" && " Steam"}
        <input
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required={source === "steam"}
          placeholder={source === "steam" ? "https://store.steampowered.com/app/..." : "https://..."}
          className={fieldClass}
        />
      </label>
      {steam && (
        <div className="flex gap-2 rounded-lg border border-border p-2 text-xs">
          {steam.headerImage && (
            <div className="relative aspect-[460/215] w-24 shrink-0 overflow-hidden rounded">
              <Image src={steam.headerImage} alt="" fill sizes="6rem" className="object-cover" />
            </div>
          )}
          <div>
            <div className="font-medium">{steam.name}</div>
            <div className="text-muted">
              {steam.price} · {steam.genres.join(", ")}
            </div>
          </div>
        </div>
      )}
      <label className="block text-sm">
        Tên game
        <input
          name="name"
          value={source === "steam" && steam ? steam.name : name}
          onChange={(e) => setName(e.target.value)}
          readOnly={source === "steam" && !!steam}
          required
          minLength={2}
          maxLength={120}
          className={fieldClass}
        />
      </label>
      <SimilarHint items={similar.map((s) => ({ key: `${s.kind}-${s.ref}`, label: similarLabel(s) }))} />
      <label className="block text-sm">
        Lý do ngắn
        <textarea name="reason" required minLength={5} maxLength={500} rows={3} className={fieldClass} />
      </label>
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-accent py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Đang gửi…" : "Gửi đề xuất"}
      </button>
      {result && (
        <p role="status" className={`text-sm ${result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}

function DemoForm({ items, onAdd }: { items: Suggestion[]; onAdd: (s: Suggestion) => void }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<SuggestionSource>("steam");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");

  const query = normalizeName(name);
  const similar =
    query.length >= 3 ? items.filter((s) => normalizeName(s.name).includes(query) || query.includes(normalizeName(s.name))) : [];
  const appId = source === "steam" ? steamAppIdFromUrl(url) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !reason.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      source,
      url: url.trim() || undefined,
      reason: reason.trim(),
      author: "bạn",
      createdAt: new Date().toISOString(),
      upvotes: 1,
      status: "pending",
    });
    setName("");
    setUrl("");
    setReason("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20">
      <h2 className="font-semibold">Đề xuất game cho Độ</h2>
      <p className="text-xs text-muted">Chế độ demo (chưa nối Supabase): đề xuất chỉ lưu tạm trên trình duyệt.</p>
      <label className="block text-sm">
        Tên game
        <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
      </label>
      <SimilarHint
        items={similar.map((s) => ({ key: s.id, label: `${s.name} (${STATUS[s.status].label}, ${s.upvotes} vote)` }))}
      />
      <label className="block text-sm">
        Nguồn
        <select value={source} onChange={(e) => setSource(e.target.value as SuggestionSource)} className={fieldClass}>
          {Object.entries(SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Link
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          placeholder={source === "steam" ? "https://store.steampowered.com/app/..." : "https://..."}
          className={fieldClass}
        />
      </label>
      {appId && <p className="text-xs text-muted">Steam appid {appId} – khi nối Supabase sẽ tự lấy ảnh, giá, thể loại.</p>}
      <label className="block text-sm">
        Lý do ngắn
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={500} rows={3} className={fieldClass} />
      </label>
      <button type="submit" className="w-full rounded-lg bg-accent py-2 font-semibold text-white">
        Gửi đề xuất
      </button>
    </form>
  );
}
