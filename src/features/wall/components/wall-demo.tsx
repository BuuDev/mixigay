"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { WALL_MAX, WALL_MIN, wallLength } from "../lib/limits";
import type { WallMessage } from "../types";
import { WallList } from "./wall-list";
import { WallTextarea } from "./wall-textarea";

/** Mock mode (no Supabase): new messages only live in this browser tab. */
export function WallDemo({ initial }: { initial: WallMessage[] }) {
  const [mine, setMine] = useState<WallMessage[]>([]);
  const [body, setBody] = useState("");
  const length = wallLength(body);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (length < WALL_MIN || length > WALL_MAX) return;
    setMine((prev) => [
      { id: crypto.randomUUID(), body: body.trim(), author: "bạn", authorVerified: false, createdAt: new Date().toISOString(), approved: false },
      ...prev,
    ]);
    setBody("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <WallList messages={initial} pending={mine} />
      <Card className="self-start p-4">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold">Viết lên tường</h3>
          <p className="text-xs text-muted">Chế độ demo (chưa nối Supabase): lời nhắn chỉ lưu tạm trên trình duyệt.</p>
          <WallTextarea value={body} onChange={setBody} />
          <Button type="submit" disabled={length < WALL_MIN || length > WALL_MAX} className="w-full">
            Gửi lời nhắn
          </Button>
        </form>
      </Card>
    </div>
  );
}
