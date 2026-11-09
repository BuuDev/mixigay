import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Suspense } from "react";
import { AuthButton } from "@/features/auth/components/auth-button";
import { LiveDockSlot } from "@/features/live/components/live-dock-slot";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tộc Đêm – lịch stream, video, đề xuất game cho Độ Mixi",
  description: "Trang do fan tự làm: lịch stream, link live, video theo game và đề xuất game cho Độ Mixi. Không liên kết chính thức.",
};

export const viewport: Viewport = { themeColor: "#121018", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <MotionProvider>
          <SiteHeader
            account={
              <Suspense fallback={null}>
                <AuthButton />
              </Suspense>
            }
          />
          <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          <SiteFooter />
          <LiveDockSlot />
        </MotionProvider>
      </body>
    </html>
  );
}
