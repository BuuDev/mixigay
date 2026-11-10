import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REASONS, REPORT_KINDS } from "./reasons";

const dir = join(process.cwd(), "supabase/migrations");
// The newest migration that (re)defines the check wins.
const sql = readdirSync(dir)
  .sort()
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");
const listIn = (column: string) => {
  const all = [...sql.matchAll(new RegExp(`check \\(${column} in \\(([^)]*)\\)\\)`, "g"))];
  const m = all.at(-1);
  return (m?.[1] ?? "").split(",").map((s) => s.trim().replace(/'/g, ""));
};

describe("report reasons and kinds match the database", () => {
  it("reasons", () => expect([...REASONS].sort()).toEqual(listIn("reason").sort()));
  it("kinds", () => expect([...REPORT_KINDS].sort()).toEqual(listIn("target_kind").sort()));
});
