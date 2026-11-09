"use client";

import { useState } from "react";
import { normalizeName } from "@/shared/lib/text";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { steamAppIdFromUrl } from "../lib/steam";
import type { Suggestion, SuggestionSource } from "../types";
import { fieldClass, SOURCE, STATUS } from "./labels";
import { SimilarHint } from "./similar-hint";

/** Mock mode (no Supabase): suggestions only live in this browser tab. */
export function DemoForm({ items, onAdd }: { items: Suggestion[]; onAdd: (s: Suggestion) => void }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<SuggestionSource>("steam");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");

  const query = normalizeName(name);
  const similar = query.length >= 3 ? items.filter((s) => normalizeName(s.name).includes(query) || query.includes(normalizeName(s.name))) : [];
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
    <Card className="p-4 lg:sticky lg:top-20">
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-semibold">Đề xuất game cho anh Độ</h2>
        <p className="text-xs text-muted">Chế độ demo (chưa nối Supabase): đề xuất chỉ lưu tạm trên trình duyệt.</p>
        <label className="block text-sm">
          Tên game
          <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
        </label>
        <SimilarHint items={similar.map((s) => ({ key: s.id, label: `${s.name} (${STATUS[s.status].label}, ${s.upvotes} vote)` }))} />
        <label className="block text-sm">
          Nguồn
          <select value={source} onChange={(e) => setSource(e.target.value as SuggestionSource)} className={fieldClass}>
            {Object.entries(SOURCE).map(([value, { label }]) => (
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
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            maxLength={500}
            rows={3}
            placeholder="VD: Game giải đố độ khó thiếu nhi nhưng đảm bảo tốn 2 tiếng đọc lệnh..."
            className={fieldClass}
          />
        </label>
        <Button type="submit" className="w-full">
          Gửi đề xuất
        </Button>
      </form>
    </Card>
  );
}
