import type { Metadata } from "next";
import { SuggestionBoard } from "@/components/suggestion-board";
import { getSuggestions } from "@/lib/data";

export const metadata: Metadata = { title: "Đề xuất game – Góc Fan Độ" };

export default async function SuggestPage() {
  const suggestions = await getSuggestions();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fan đề xuất game</h1>
      <SuggestionBoard initial={suggestions} />
    </div>
  );
}
