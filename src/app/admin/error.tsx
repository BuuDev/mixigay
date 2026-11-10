"use client";

import { useEffect } from "react";

/**
 * Admin error boundary. In production Next.js hides a Server Action's error message
 * (only a digest reaches the browser), so name the usual causes instead of a blank page.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="space-y-3 rounded-lg border border-live-text/40 bg-surface p-5">
      <h2 className="font-semibold">Không thực hiện được thao tác này</h2>
      <p className="text-sm text-muted">Thường gặp: tác giả đang bị cấm nên không duyệt được bài, nội dung trùng với một bài đã duyệt, hoặc phiên đăng nhập đã hết hạn.</p>
      {process.env.NODE_ENV !== "production" && <p className="text-xs break-all text-muted">{error.message}</p>}
      {error.digest && <p className="text-xs text-muted">Mã lỗi: {error.digest}</p>}
      <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent">
        Thử lại
      </button>
    </div>
  );
}
