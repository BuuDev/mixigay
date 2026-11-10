import { Suspense } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { getQuoteVideoOptions, getQuotes } from "../server/queries";
import { QuoteComposer, QuoteSignInCard } from "./quote-composer";
import { QuoteDemo } from "./quote-demo";
import { QuoteList } from "./quote-list";

/** "Kho quote": cached public list + the per-viewer form under <Suspense>. */
export async function QuoteSection() {
  if (!isSupabaseConfigured) return <QuoteDemo videos={await getQuoteVideoOptions()} />;
  const quotes = await getQuotes();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="quote-list-heading">
        <h2 id="quote-list-heading" className="sr-only">
          Quote đã duyệt
        </h2>
        <QuoteList quotes={quotes} />
      </section>
      <div className="self-start lg:sticky lg:top-20">
        <Suspense fallback={<QuoteSignInCard />}>
          <QuoteComposer />
        </Suspense>
      </div>
    </div>
  );
}
