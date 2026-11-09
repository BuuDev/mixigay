import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REASONS, REPORT_KINDS } from "./reasons";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261110110000_reports_song_votes_steam.sql"), "utf8");
const listIn = (column: string) => {
  const m = sql.match(new RegExp(`${column} text not null check \\(${column} in \\(([^)]*)\\)\\)`));
  return (m?.[1] ?? "").split(",").map((s) => s.trim().replace(/'/g, ""));
};

describe("report reasons and kinds match the database", () => {
  it("reasons", () => expect([...REASONS].sort()).toEqual(listIn("reason").sort()));
  it("kinds", () => expect([...REPORT_KINDS].sort()).toEqual(listIn("target_kind").sort()));
});
