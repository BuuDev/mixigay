import type { Metadata } from "next";
import { QuoteSection } from "@/features/quotes/components/quote-section";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconQuote } from "@/shared/ui/icons";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Kho quote – Góc Bộ Tộc" };

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kho quote" icon={<IconQuote size={26} className="text-accent" />} art={<SceneArt scene="13-meme-giai-tri" size={128} />}>
        Những câu nói đáng nhớ trên sóng, do Bộ Tộc gửi kèm đúng mốc thời gian của video. Bấm vào mốc để nghe tận tai trên YouTube.
      </PageHeader>
      <QuoteSection />
    </div>
  );
}
