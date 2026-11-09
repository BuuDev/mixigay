"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitSong } from "../actions";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2";

/** Signed-in fans submit a link; it shows after an admin approves it. */
export function SongForm() {
  const [result, action, pending] = useActionState(submitSong, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result?.ok) form.current?.reset();
  }, [result]);

  return (
    <Card className="p-4">
      <form ref={form} action={action} className="space-y-3">
        <h3 className="font-bold">Gửi bài nhạc nịnh của bạn</h3>
        <p className="text-xs text-muted">Dán link YouTube, SoundCloud, TikTok, Spotify, Zing MP3 hoặc NhacCuaTui. Bài sẽ hiện sau khi được duyệt.</p>
        <label className="block text-sm">
          Tên bài
          <input name="title" required minLength={2} maxLength={120} className={field} />
        </label>
        <label className="block text-sm">
          Người làm nhạc
          <input name="artist" required maxLength={80} className={field} />
        </label>
        <label className="block text-sm">
          Link bài hát
          <input name="url" type="url" required placeholder="https://soundcloud.com/..." className={field} />
        </label>
        <label className="block text-sm">
          Ghi chú (tùy chọn)
          <textarea name="note" maxLength={300} rows={2} className={field} />
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang gửi…" : "Gửi bài"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
      </form>
    </Card>
  );
}
