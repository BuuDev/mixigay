"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useDebounced } from "@/shared/hooks/use-debounced";
import { AnimatePresence, m, pop } from "@/shared/motion";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { createSuggestion, searchSimilar, type SimilarItem } from "../actions";
import { steamAppIdFromUrl, type SteamDetails } from "../lib/steam";
import type { SuggestionSource, SuggestionStatus } from "../types";
import { fieldClass, PLAY_LABEL, SOURCE, STATUS } from "./labels";
import { SimilarHint } from "./similar-hint";

function similarLabel(s: SimilarItem): string {
  if (s.kind === "game") return `${s.name} – ${PLAY_LABEL[s.status] ?? "có trong danh sách game"}`;
  return `${s.name} (${STATUS[s.status as SuggestionStatus]?.label ?? s.status}, ${s.upvotes} vote)`;
}

/** Suggestion form for signed-in fans (Supabase mode). */
export function SuggestionForm() {
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
    <Card className="p-4 lg:sticky lg:top-20">
      <form ref={formRef} action={formAction} className="space-y-3">
        <h2 className="font-semibold">Đề xuất game cho Độ</h2>
        <label className="block text-sm">
          Nguồn
          <select name="source" value={source} onChange={(e) => setSource(e.target.value as SuggestionSource)} className={fieldClass}>
            {Object.entries(SOURCE).map(([value, { label }]) => (
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
        <AnimatePresence>
          {steam && (
            <m.div variants={pop} initial="hidden" animate="visible" exit="exit" className="flex gap-2 rounded-md border border-border p-2 text-xs">
              {steam.headerImage && (
                <div className="relative aspect-[460/215] w-24 shrink-0 overflow-hidden rounded-sm">
                  <Image src={steam.headerImage} alt="" fill sizes="6rem" className="object-cover" />
                </div>
              )}
              <div>
                <div className="font-medium">{steam.name}</div>
                <div className="text-muted">
                  {steam.price} · {steam.genres.join(", ")}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
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
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang gửi…" : "Gửi đề xuất"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live")}>
            {result.message}
          </p>
        )}
      </form>
    </Card>
  );
}
