"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { acceptInvite } from "../actions";
import { PASSPHRASE_MIN_PRIVILEGED as PASSPHRASE_MIN } from "../lib/handle";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base";

/** The invited person chooses their own passphrase; nobody else ever knows it. */
export function InviteForm({ token, handle }: { token: string; handle: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="handle" value={handle} autoComplete="username" />
      <label className="block text-sm">
        Đặt mã khóa (ít nhất {PASSPHRASE_MIN} ký tự, nên là một câu dài; không chứa tên đăng nhập)
        <input name="passphrase" type="password" required minLength={PASSPHRASE_MIN} autoComplete="new-password" className={field} />
      </label>
      <label className="block text-sm">
        Nhập lại mã khóa
        <input name="confirm" type="password" required minLength={PASSPHRASE_MIN} autoComplete="new-password" className={field} />
      </label>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-live-text">
          {state.message}
        </p>
      )}
      <Button className="w-full" disabled={pending}>
        {pending ? "Đang vào…" : "Nhận lời mời"}
      </Button>
    </form>
  );
}
