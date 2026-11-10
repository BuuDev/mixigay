import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NAME_BLOCK_STEMS } from "./lexicon";

describe("lexicon ↔ database seed", () => {
  it("public.banned_terms is seeded with exactly NAME_BLOCK_STEMS", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261110090000_moderation.sql"), "utf8");
    const block = sql.match(/insert into public\.banned_terms \(term\) values([\s\S]*?);/);
    expect(block, "seed statement").not.toBeNull();
    const seeded = [...block![1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(seeded).toEqual([...NAME_BLOCK_STEMS].sort());
  });
});
