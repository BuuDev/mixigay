import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// House rule (docs/07-conventions.md, "Xưng hô"): user-facing copy says
// "anh Độ" / "anh Độ Mixi", never a bare "Độ". Verbatim quotes of the channel's
// own titles and fixed names are allowed below.
const ALLOWED = ["Độ Mixi miệt mài vẽ dự án ma", "đạo diễn Độ Mixi", "Độ đi date", "Độ khó thiếu nhi", "DesmouĐộ", "Bố Độ", "Phùng Thanh Độ"];
const BARE = /(?<![\p{L}])Độ(?![\p{L}])/u;
// "Độ" as the common noun "degree/level" ("Độ khó", "Độ cảm động", "Độ hype"…) is not the name.
const DEGREE = /^Độ (khó|cảm động|tâm huyết|hype|uy tín|chính xác|dài|nét|phủ|mặn|lầy|bựa|hot|nổi tiếng|ổn định)/u;
const RESPECTFUL = /(anh|Anh) Độ$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(tsx?|mts)$/.test(name) && !/\.test\.ts$|mock\.ts$/.test(name) ? [p] : [];
  });
}

describe("respectful address", () => {
  it("never names Độ without “anh” in user-facing copy", () => {
    const offenders: string[] = [];
    for (const file of files(join(process.cwd(), "src"))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const t = line.trim();
          if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("import")) return;
          let rest = line;
          for (const ok of ALLOWED) rest = rest.split(ok).join("");
          const m = BARE.exec(rest);
          if (m && !RESPECTFUL.test(rest.slice(0, m.index + 2)) && !DEGREE.test(rest.slice(m.index))) offenders.push(`${file.replace(process.cwd() + "/", "")}:${i + 1}: ${t.slice(0, 120)}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
