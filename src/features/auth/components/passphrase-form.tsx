"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { changePassphrase } from "../actions";
import { PASSPHRASE_MIN } from "../lib/handle";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base";

export function PassphraseForm() {
  const [state, action, pending] = useActionState(changePassphrase, null);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        Mã khóa hiện tại
        <input name="current" type="password" required autoComplete="current-password" className={field} />
      </label>
      <label className="block text-sm">
        Mã khóa mới
        <input name="passphrase" type="password" required minLength={PASSPHRASE_MIN} autoComplete="new-password" className={field} />
      </label>
      <label className="block text-sm">
        Nhập lại
        <input name="confirm" type="password" required minLength={PASSPHRASE_MIN} autoComplete="new-password" className={field} />
      </label>
      {state && (
        <p role="status" className={state.ok ? "text-sm text-cleared" : "text-sm text-live-text"}>
          {state.ok ? "Đã đổi mã khóa." : state.message}
        </p>
      )}
      <Button disabled={pending}>{pending ? "Đang đổi…" : "Đổi mã khóa"}</Button>
    </form>
  );
}
