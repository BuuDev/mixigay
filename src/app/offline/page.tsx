import type { Metadata } from "next";
import { Mascot } from "@/shared/ui/brand-art";
import { buttonClass } from "@/shared/ui/button";

// Precached by public/sw.js and shown for any page that cannot load while offline.
// Static, and it must keep working without JavaScript: the reload is a plain link.
export const metadata: Metadata = { title: "Offline – Góc Bộ Tộc", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {/* Raw file, not an optimizer URL: public/sw.js precaches it for this page. */}
      <Mascot pose="sleep" size={120} unoptimized />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Bạn đang offline…</h1>
      <p className="max-w-prose text-sm text-muted">Mạng đang chập chờn nên Góc Bộ Tộc chưa tải được trang này. Kiểm tra kết nối rồi thử lại nhé.</p>
      {/* Empty href = this same URL: reloads the page the visitor asked for, not /offline. */}
      <a href="" className={buttonClass("primary", "md", "min-h-11")}>
        Tải lại trang
      </a>
    </div>
  );
}
