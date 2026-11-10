import type { Metadata } from "next";
import Link from "next/link";
import { SceneArt } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang – Góc Bộ Tộc", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <SceneArt scene="20-di-ngu" size={176} sizes="(min-width: 640px) 176px, 128px" className="size-32 sm:size-44" />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Không tìm thấy trang này</h1>
      <p className="max-w-prose text-sm text-muted">
        Đường dẫn có thể đã đổi hoặc gõ nhầm. Cú Đêm ngủ quên mất rồi, anh em quay về trang chủ hoặc xem lịch live nhé.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass("primary", "md", "min-h-11")}>
          Về trang chủ
        </Link>
        <Link href="/lich" className={buttonClass("secondary", "md", "min-h-11")}>
          Xem lịch live
        </Link>
      </div>
    </div>
  );
}
