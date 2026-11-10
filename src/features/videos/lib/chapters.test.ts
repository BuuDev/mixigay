import { describe, expect, it } from "vitest";
import { formatTimestamp, isValidChapterList, latestStreamWithChapters, parseChapterLine, parseChapters, parseTimestamp, toChapters } from "./chapters";

describe("parseTimestamp", () => {
  it("reads m:ss, mm:ss and h:mm:ss", () => {
    expect(parseTimestamp("0:00")).toBe(0);
    expect(parseTimestamp("12:30")).toBe(750);
    expect(parseTimestamp("1:02:03")).toBe(3723);
    expect(parseTimestamp("75:10")).toBe(4510);
  });

  it("rejects out-of-range fields", () => {
    expect(parseTimestamp("1:60")).toBeNull();
    expect(parseTimestamp("1:60:00")).toBeNull();
    expect(parseTimestamp("12")).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("pads minutes only when there are hours", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(5)).toBe("0:05");
    expect(formatTimestamp(750)).toBe("12:30");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });
});

describe("parseChapterLine", () => {
  it.each([
    ["0:00 Intro", 0, "Intro"],
    ["1:02:03 – Boss", 3723, "Boss"],
    ["(12:30) Phần hai", 750, "Phần hai"],
    ["[05:00] Phần ba", 300, "Phần ba"],
    ["• 3:15 - Nghỉ giải lao", 195, "Nghỉ giải lao"],
    ["10:00: Hỏi đáp", 600, "Hỏi đáp"],
    ["Kết thúc - 2:00:00", 7200, "Kết thúc"],
    ["Kết thúc (1:00:00)", 3600, "Kết thúc"],
  ])("%s", (line, t, title) => {
    expect(parseChapterLine(line)).toEqual({ t, title });
  });

  it("ignores lines without a timestamp or without a title", () => {
    expect(parseChapterLine("Đăng ký kênh nhé")).toBeNull();
    expect(parseChapterLine("0:00")).toBeNull();
    expect(parseChapterLine("0:00 - ")).toBeNull();
    expect(parseChapterLine("Live lúc 20:00 tối nay")).toBeNull();
    expect(parseChapterLine("0:001 nope")).toBeNull();
    expect(parseChapterLine("")).toBeNull();
  });

  it("collapses whitespace and caps long titles", () => {
    expect(parseChapterLine("0:00   Mở    đầu  ")?.title).toBe("Mở đầu");
    expect(parseChapterLine(`0:00 ${"a".repeat(300)}`)?.title).toHaveLength(100);
  });
});

describe("parseChapters", () => {
  const desc = [
    "Buổi stream tối nay:",
    "",
    "0:00 Mở đầu",
    "1:02 Phần 1",
    "https://example.com",
    "12:30 – Phần 2",
    "1:02:03 (Kết)",
    "",
    "Cảm ơn mọi người!",
  ].join("\n");

  it("parses a valid list and skips unrelated lines", () => {
    expect(parseChapters(desc)).toEqual([
      { t: 0, title: "Mở đầu" },
      { t: 62, title: "Phần 1" },
      { t: 750, title: "Phần 2" },
      { t: 3723, title: "(Kết)" },
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseChapters("0:00 A\r\n0:30 B\r\n1:00 C")).toHaveLength(3);
  });

  it("requires the first chapter at 0:00", () => {
    expect(parseChapters("0:10 A\n1:00 B\n2:00 C")).toBeNull();
  });

  it("starts at the first 0:00 line, ignoring earlier timestamps", () => {
    expect(parseChapters("Live lúc 20:00\n0:00 A\n1:00 B\n2:00 C")?.map((c) => c.t)).toEqual([0, 60, 120]);
  });

  it("requires at least three chapters", () => {
    expect(parseChapters("0:00 A\n1:00 B")).toBeNull();
  });

  it("stops at the first timestamp that does not ascend", () => {
    expect(parseChapters("0:00 A\n1:00 B\n2:00 C\n1:30 D\n3:00 E")?.map((c) => c.title)).toEqual(["A", "B", "C"]);
  });

  it("rejects chapters shorter than 10 seconds", () => {
    expect(parseChapters("0:00 A\n0:05 B\n1:00 C")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseChapters("")).toBeNull();
    expect(parseChapters(undefined)).toBeNull();
    expect(parseChapters(null)).toBeNull();
  });
});

describe("isValidChapterList", () => {
  it("applies YouTube's rule", () => {
    expect(
      isValidChapterList([
        { t: 0, title: "A" },
        { t: 10, title: "B" },
        { t: 20, title: "C" },
      ]),
    ).toBe(true);
    expect(isValidChapterList([])).toBe(false);
  });
});

describe("toChapters", () => {
  it("accepts a valid jsonb array", () => {
    const json = [
      { t: 0, title: "A" },
      { t: 60, title: "B" },
      { t: 120, title: "C" },
    ];
    expect(toChapters(json)).toEqual(json);
  });

  it("drops malformed values", () => {
    expect(toChapters(null)).toBeUndefined();
    expect(toChapters({ t: 0 })).toBeUndefined();
    expect(
      toChapters([
        { t: 0, title: "A" },
        { t: "x", title: "B" },
        { t: 120, title: "C" },
      ]),
    ).toBeUndefined();
    expect(toChapters([{ t: 0, title: "A" }])).toBeUndefined();
  });
});

describe("latestStreamWithChapters", () => {
  const ch = [
    { t: 0, title: "A" },
    { t: 60, title: "B" },
    { t: 120, title: "C" },
  ];
  it("picks the newest past stream that has chapters", () => {
    const videos = [
      { id: "old", wasLive: true, publishedAt: "2026-11-01T00:00:00Z", chapters: ch },
      { id: "new", wasLive: true, publishedAt: "2026-11-05T00:00:00Z", chapters: ch },
      { id: "upload", wasLive: false, publishedAt: "2026-11-09T00:00:00Z", chapters: ch },
      { id: "bare", wasLive: true, publishedAt: "2026-11-08T00:00:00Z" },
    ];
    expect(latestStreamWithChapters(videos)?.id).toBe("new");
    expect(latestStreamWithChapters([])).toBeUndefined();
  });
});
