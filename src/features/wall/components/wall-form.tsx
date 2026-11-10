"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { postWallMessage } from "../actions";
import { WALL_MAX, WALL_MIN, wallLength } from "../lib/limits";
import { WallTextarea } from "./wall-textarea";

/** Wall form for signed-in fans (Supabase mode). */
export function WallForm() {
  const [result, formAction, pending] = useActionState(postWallMessage, null);
  const [body, setBody] = useState("");
  const length = wallLength(body);

  useEffect(() => {
    if (!result?.ok) return;
    // Clearing the controlled field after a successful submit, a response to the action result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBody("");
  }, [result]);

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <h3 className="font-semibold">Viết lên tường</h3>
        <WallTextarea value={body} onChange={setBody} />
        <Button type="submit" disabled={pending || length < WALL_MIN || length > WALL_MAX} className="w-full">
          {pending ? "Đang gửi…" : "Gửi lời nhắn"}
        </Button>
        {result && (
          <p role="status" className={cn("text-sm", result.ok ? "text-cleared" : "text-live-text")}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-muted">Tối đa 3 lời nhắn mỗi ngày. Lời nhắn được duyệt trước khi hiện công khai.</p>
      </form>
    </Card>
  );
}
