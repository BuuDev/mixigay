import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generatePassphrase, handleKey, handleProblem, PASSPHRASE_WORD_COUNT, passphraseProblem } from "./handle";

describe("handleKey (mirror of public.name_key)", () => {
  it.each([
    ["Bộ Tộc Mixi", "botocmixi"],
    ["Độ Mixi", "domixi"],
    ["Đ ộ M i x i", "domixi"],
    ["Dоmіxі", "domixi"], // Cyrillic о, і
    ["  Fan_Cứng-2007 ", "fancung2007"],
  ])("%s → %s", (input, key) => expect(handleKey(input)).toBe(key));

  it("uses the same look-alike table as the migration", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261110120000_admin_access_official.sql"), "utf8");
    const src = readFileSync(join(process.cwd(), "src/features/auth/lib/handle.ts"), "utf8");
    const [, from, to] = sql.match(/translate\(coalesce\(t, ''\),\s*'([^']*)',\s*'([^']*)'\)/) ?? [];
    expect(src).toContain(`LOOKALIKE_FROM = "${from}"`);
    expect(src).toContain(`LOOKALIKE_TO = "${to}"`);
  });
});

describe("validation", () => {
  it("handle length counts letters and digits only", () => {
    expect(handleProblem("a b")).not.toBeNull();
    expect(handleProblem("Fan Cứng")).toBeNull();
    expect(handleProblem("x".repeat(25))).not.toBeNull();
  });
  it("passphrase length", () => {
    expect(passphraseProblem("ngan")).not.toBeNull();
    expect(passphraseProblem("1234567")).not.toBeNull();
    expect(passphraseProblem("du-dai-roi-1234")).toBeNull();
  });
  it("refuses common, numeric, repeated and handle-based passphrases", () => {
    for (const weak of ["1234567890", "matkhau123", "aaaaaaaaaaaa", "9876543210123", "MixiGaming!!"]) expect(passphraseProblem(weak)).not.toBeNull();
    expect(passphraseProblem("fancung2007-oke", { handle: "Fan Cứng 2007" })).not.toBeNull();
    expect(passphraseProblem(generatePassphrase(), { handle: "fan cung" })).toBeNull();
  });
  it("8 characters is enough for every account, admins included", () => {
    expect(passphraseProblem("ngan-7c")).not.toBeNull();
    expect(passphraseProblem("lua-trai8")).toBeNull();
    expect(passphraseProblem("lua-trai8", { privileged: true })).toBeNull();
    expect(passphraseProblem("12345678", { privileged: true })).not.toBeNull();
  });
});

describe("generatePassphrase", () => {
  it("is four words and four digits", () => {
    expect(generatePassphrase()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{4}$/);
  });
  it("has a large enough word list", () => {
    expect(PASSPHRASE_WORD_COUNT).toBeGreaterThanOrEqual(120);
  });
  it("differs between calls", () => {
    expect(new Set(Array.from({ length: 20 }, () => generatePassphrase())).size).toBe(20);
  });
});
