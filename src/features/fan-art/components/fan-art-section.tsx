"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { submitFanArt } from "../actions";
import { driveImageUrl, extractDriveFileId } from "../lib/drive";

export { FanArtGallery } from "./fan-art-gallery";

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

/**
 * Signed-in fans paste their personal Google Drive share link.
 * Shows an instant live image preview so they can verify "Anyone with the link can view" before submitting.
 */
export function FanArtForm() {
  const [result, action, pending] = useActionState(submitFanArt, null);
  const [rawUrl, setRawUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fileId = extractDriveFileId(rawUrl);
  const previewSrc = fileId ? driveImageUrl(fileId, 800) : null;

  useEffect(() => {
    if (result?.ok) {
      formRef.current?.reset();
    }
  }, [result]);

  return (
    <Card className="p-4">
      <form
        ref={formRef}
        action={action}
        onReset={() => {
          setRawUrl("");
          setPreviewError(false);
        }}
        className="space-y-3"
      >
        <h3 className="font-bold">Gửi tranh Fan Art qua Google Drive</h3>
        <div className="rounded-md border border-border/80 bg-background/60 p-2.5 text-xs text-muted">
          <p className="font-semibold text-foreground">Cách gửi không tốn dung lượng server:</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5">
            <li>Tải tranh lên Google Drive cá nhân của bạn.</li>
            <li>
              Bấm Chuột phải → Chia sẻ → đổi quyền thành <strong>“Bất kỳ ai có đường liên kết đều có thể xem”</strong>.
            </li>
            <li>Dán link vào ô bên dưới để xem thử ảnh hiện ngay tại chỗ.</li>
          </ol>
        </div>

        <label className="block text-sm">
          Tên bức vẽ
          <input name="title" required minLength={2} maxLength={120} placeholder="VD: Anh Độ Mixi bên bếp lửa 22:22" className={field} />
        </label>

        <label className="block text-sm">
          Tác giả / Bút danh
          <input name="artist" required maxLength={80} placeholder="Tên hoặc biệt danh của bạn" className={field} />
        </label>

        <label className="block text-sm">
          Link ảnh Google Drive cá nhân
          <input
            name="driveUrl"
            type="url"
            required
            value={rawUrl}
            onChange={(e) => {
              setRawUrl(e.target.value);
              setPreviewError(false);
            }}
            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
            className={field}
          />
        </label>

        {rawUrl.trim().length > 0 && !fileId && (
          <p className="text-xs text-live-text">Link chưa đúng định dạng file Google Drive (`https://drive.google.com/file/d/&lt;ID&gt;/view`).</p>
        )}

        {previewSrc && (
          <div className="space-y-1.5 rounded-lg border border-border bg-background p-2.5">
            <p className="text-xs font-semibold text-accent">Xem trước ảnh từ Google Drive:</p>
            {!previewError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewSrc}
                alt="Xem trước tranh từ Google Drive"
                referrerPolicy="no-referrer"
                onError={() => setPreviewError(true)}
                className="max-h-48 w-full rounded object-contain"
              />
            ) : (
              <p className="text-xs text-live-text">
                Không tải được ảnh xem trước. Hãy kiểm tra chắc chắn file đã bật chế độ <strong>“Bất kỳ ai có đường liên kết đều xem được”</strong> và là file
                ảnh (PNG/JPG/WEBP).
              </p>
            )}
          </div>
        )}

        <label className="block text-sm">
          Lời nhắn / Câu chuyện bức tranh (tùy chọn)
          <textarea name="note" maxLength={300} rows={2} placeholder="Kỷ niệm hoặc cảm hứng khi vẽ bức này…" className={field} />
        </label>

        <Button type="submit" disabled={pending || !fileId} className="w-full">
          {pending ? "Đang gửi tranh…" : "Gửi tranh chờ duyệt"}
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
