import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import { Suspense } from "react";
import { AuthButton } from "@/features/auth/components/auth-button";
import { LiveDockSlot } from "@/features/live/components/live-dock-slot";
import { BgMusicPlayer } from "@/features/music/components/bg-music-player";
import { BottomNav } from "@/shared/layout/bottom-nav";
import { SiteFooter } from "@/shared/layout/site-footer";
import { SiteHeader } from "@/shared/layout/site-header";
import { SITE_URL } from "@/shared/lib/links";
import { MotionProvider } from "@/shared/motion/motion-provider";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
// Handwritten lines of an invitation (section eyebrows, polaroid captions) — never body text.
const script = Dancing_Script({ variable: "--font-dancing", subsets: ["latin", "vietnamese"], weight: ["600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Góc Bộ Tộc – lịch stream, video, đề xuất game cho anh Độ Mixi",
  description: "Trang do fan tự làm: lịch stream, link live, video theo game và đề xuất game cho anh Độ Mixi. Không liên kết chính thức với Kênh MixiGaming.",
};

export const viewport: Viewport = { themeColor: "#121018", colorScheme: "dark", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${script.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <MotionProvider>
          <SiteHeader
            account={
              <Suspense fallback={null}>
                <AuthButton />
              </Suspense>
            }
          />
          <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-safe py-6">{children}</main>
          <SiteFooter />
          <BgMusicPlayer />
          <LiveDockSlot />
          <BottomNav />
        </MotionProvider>
      </body>
    </html>
  );
}
