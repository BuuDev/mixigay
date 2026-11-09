"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
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

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");

function steamAppId(url: string) {
  return url.match(/store\.steampowered\.com\/app\/(\d+)/)?.[1];
}

export function SuggestionBoard({ initial }: { initial: Suggestion[] }) {
  const [items, setItems] = useState(initial);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const [name, setName] = useState("");
  const [source, setSource] = useState<SuggestionSource>("steam");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");

  const query = normalize(name);
  const similar = query.length >= 3 ? items.filter((s) => normalize(s.name).includes(query) || query.includes(normalize(s.name))) : [];
  const appId = source === "steam" ? steamAppId(url) : undefined;

  function toggleVote(id: string) {
    const has = voted.has(id);
    setVoted((prev) => {
      const next = new Set(prev);
      if (has) next.delete(id);
      else next.add(id);
      return next;
    });
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + (has ? -1 : 1) } : s)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !reason.trim()) return;
    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        source,
        url: url.trim() || undefined,
        reason: reason.trim(),
        author: "bạn",
        createdAt: new Date().toISOString(),
        upvotes: 1,
        status: "pending",
      },
      ...prev,
    ]);
    setName("");
    setUrl("");
    setReason("");
  }

  const shown = items.filter((s) => filter === "all" || s.status === filter).sort((a, b) => b.upvotes - a.upvotes);

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
        <ul className="mt-4 space-y-3">
          {shown.map((s) => (
            <li key={s.id} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
              <button
                onClick={() => toggleVote(s.id)}
                className={`flex w-14 shrink-0 flex-col self-start items-center rounded-lg border py-1.5 text-sm ${voted.has(s.id) ? "border-accent text-accent" : "border-border"}`}
                aria-pressed={voted.has(s.id)}
                aria-label={`Upvote ${s.name}`}
              >
                <span>▲</span>
                <span className="font-semibold tabular-nums">{s.upvotes}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {s.name}
                      </a>
                    ) : (
                      s.name
                    )}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[s.status].className}`}>{STATUS[s.status].label}</span>
                  <span className="text-xs text-muted">{SOURCE_LABEL[s.source]}</span>
                </div>
                <p className="mt-1 text-sm">{s.reason}</p>
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
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20">
          <h2 className="font-semibold">Đề xuất game cho Độ</h2>
          <p className="text-xs text-muted">Bản prototype: chưa cần đăng nhập, đề xuất chỉ lưu tạm trên trình duyệt.</p>
          <label className="block text-sm">
            Tên game
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          {similar.length > 0 && (
            <div className="rounded-lg bg-accent/10 p-2 text-xs">
              Có thể đã có người đề xuất:
              <ul className="mt-1 list-disc pl-4">
                {similar.map((s) => (
                  <li key={s.id}>
                    {s.name} ({STATUS[s.status].label}, {s.upvotes} vote) – upvote thay vì tạo mới nhé
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label className="block text-sm">
            Nguồn
            <select value={source} onChange={(e) => setSource(e.target.value as SuggestionSource)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
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
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          {appId && <p className="text-xs text-muted">Steam appid {appId} – bản thật sẽ tự lấy ảnh, giá, thể loại.</p>}
          <label className="block text-sm">
            Lý do ngắn
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={200} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <button type="submit" className="w-full rounded-lg bg-accent py-2 font-semibold text-white">
            Gửi đề xuất
          </button>
        </form>
      </aside>
    </div>
  );
}
