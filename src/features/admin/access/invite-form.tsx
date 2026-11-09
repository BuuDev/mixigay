"use client";

import { useActionState, useState } from "react";
import { createInvite } from "./actions";
import { button, input, primary } from "../ui";

export function CreateInviteForm() {
  const [state, action, pending] = useActionState(createInvite, null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-wrap items-center gap-2 text-sm">
        <select name="role" className={input} aria-label="Vai trò" defaultValue="official">
          <option value="official">Chính chủ (anh Độ / team kênh) – ✓ + quản trị</option>
          <option value="admin">Quản trị viên (mod)</option>
        </select>
        <input name="handle" required placeholder="Tên đăng nhập, vd: domixi" className={input} aria-label="Tên đăng nhập" />
        <input name="display" required placeholder="Tên hiển thị (tên anh Độ dùng trên kênh)" maxLength={50} className={input} aria-label="Tên hiển thị" />
        <button className={primary} disabled={pending}>
          {pending ? "Đang tạo…" : "Tạo link mời"}
        </button>
      </form>
      {state && !state.ok && <p className="text-sm text-live-text">{state.message}</p>}
      {state?.ok && (
        <div className="rounded-md border border-accent/60 p-3 text-sm">
          <p className="font-semibold">Link mời (chỉ hiện một lần, dùng 1 lần, hết hạn sau {state.expiresHours} giờ):</p>
          <p className="mt-1 font-mono text-xs break-all">{state.link}</p>
          <button type="button" className={`${button} mt-2`} onClick={() => navigator.clipboard?.writeText(state.link).then(() => setCopied(true))}>
            {copied ? "Đã chép ✓" : "Chép link"}
          </button>
          <p className="mt-2 text-xs text-muted">
            Gửi riêng cho đúng người (tin nhắn trực tiếp), không đăng công khai. Người nhận tự đặt mã khóa; bạn không biết mã đó.
          </p>
        </div>
      )}
    </div>
  );
}
