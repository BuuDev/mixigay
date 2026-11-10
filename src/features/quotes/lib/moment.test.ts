import { describe, expect, it } from "vitest";
import { formatClock, isVideoId, parseClock, parseTimeParam, parseYouTubeLink, quoteMomentUrl, resolveMoment } from "./moment";

const ID = "dQw4w9WgXcQ";

describe("parseTimeParam", () => {
  it.each([
    ["125", 125],
    ["125s", 125],
    ["0", 0],
    ["2m", 120],
    ["1h", 3600],
    ["1h2m3s", 3723],
    ["1H02M03S", 3723],
    ["2m5s", 125],
    ["1h5s", 3605],
    ["86400", 86400],
  ])("%s → %d", (raw, expected) => expect(parseTimeParam(raw)).toBe(expected));

  it.each(["", "abc", "-5", "1.5", "5s2m", "1h2m3s4", "86401", "25h", "1:02", "s", "hms"])("rejects %j", (raw) => expect(parseTimeParam(raw)).toBeNull());
});

describe("parseClock", () => {
  it.each([
    ["12:34", 754],
    ["0:05", 5],
    ["00:00", 0],
    ["90:00", 5400],
    ["1:02:03", 3723],
    ["01:02:03", 3723],
    [" 2:05 ", 125],
    ["125", 125],
    ["1h2m3s", 3723],
  ])("%s → %d", (raw, expected) => expect(parseClock(raw)).toBe(expected));

  it.each(["", "   ", "1:2", "1:60", "1:61:00", "1:2:03", "1:02:03:04", "a:bc", "12:", ":12", "1:-1", "24:00:01"])("rejects %j", (raw) =>
    expect(parseClock(raw)).toBeNull(),
  );
});

describe("formatClock", () => {
  it("pads minutes and seconds under an hour", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(125)).toBe("02:05");
    expect(formatClock(3599)).toBe("59:59");
  });
  it("adds hours from an hour on", () => {
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3723)).toBe("1:02:03");
    expect(formatClock(36000 + 61)).toBe("10:01:01");
  });
  it("round-trips through parseClock", () => {
    for (const s of [0, 59, 754, 3723, 86400]) expect(parseClock(formatClock(s))).toBe(s);
  });
});

describe("quoteMomentUrl", () => {
  it("links the exact second, even 0", () => {
    expect(quoteMomentUrl(ID, 125)).toBe(`https://www.youtube.com/watch?v=${ID}&t=125s`);
    expect(quoteMomentUrl(ID, 0)).toBe(`https://www.youtube.com/watch?v=${ID}&t=0s`);
  });
});

describe("isVideoId", () => {
  it("accepts 11-char ids only", () => {
    expect(isVideoId(ID)).toBe(true);
    expect(isVideoId("a-b_c-d_e-f")).toBe(true);
    expect(isVideoId("short")).toBe(false);
    expect(isVideoId(`${ID}x`)).toBe(false);
    expect(isVideoId("dQw4w9WgXc!")).toBe(false);
  });
});

describe("parseYouTubeLink", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}&t=1h2m3s`, 3723],
    [`https://www.youtube.com/watch?v=${ID}&t=125`, 125],
    [`https://www.youtube.com/watch?t=125s&v=${ID}`, 125],
    [`https://youtu.be/${ID}?t=125`, 125],
    [`https://youtu.be/${ID}?si=abc&t=2m5s`, 125],
    [`youtu.be/${ID}?t=125`, 125],
    [`www.youtube.com/watch?v=${ID}&t=10s`, 10],
    [`https://m.youtube.com/watch?v=${ID}&t=30`, 30],
    [`https://www.youtube.com/live/${ID}?t=600`, 600],
    [`https://www.youtube.com/shorts/${ID}?t=3`, 3],
    [`https://www.youtube.com/embed/${ID}?start=90`, 90],
    [`https://www.youtube.com/watch?v=${ID}#t=1m`, 60],
    [`HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}&t=5`, 5],
  ])("%s", (link, seconds) => expect(parseYouTubeLink(link)).toEqual({ videoId: ID, seconds }));

  it("returns null seconds when the link has no or a broken t", () => {
    expect(parseYouTubeLink(`https://youtu.be/${ID}`)).toEqual({ videoId: ID, seconds: null });
    expect(parseYouTubeLink(`https://www.youtube.com/watch?v=${ID}&t=abc`)).toEqual({ videoId: ID, seconds: null });
    expect(parseYouTubeLink(`https://www.youtube.com/watch?v=${ID}&t=99999`)).toEqual({ videoId: ID, seconds: null });
  });

  it.each([
    "",
    "not a link",
    `https://evil.example/watch?v=${ID}&t=5`,
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://www.youtube.com/watch?v=short&t=5`,
    `https://www.youtube.com/@MixiGaming3con`,
    `https://www.youtube.com/playlist?list=PL123`,
    `https://youtu.be/`,
    `javascript:alert(1)`,
    `https://youtu.be/${ID} extra`,
  ])("rejects %j", (link) => expect(parseYouTubeLink(link)).toBeNull());
});

describe("resolveMoment", () => {
  it("uses the picked video and typed time", () => {
    expect(resolveMoment({ videoId: ID, time: "12:34" })).toEqual({ ok: true, videoId: ID, atSeconds: 754 });
  });
  it("uses the link's id and t when no time is typed", () => {
    expect(resolveMoment({ videoId: "AAAAAAAAAAA", link: `https://youtu.be/${ID}?t=125` })).toEqual({ ok: true, videoId: ID, atSeconds: 125 });
  });
  it("prefers a typed time over the link's t", () => {
    expect(resolveMoment({ link: `https://youtu.be/${ID}?t=125`, time: "0:10" })).toEqual({ ok: true, videoId: ID, atSeconds: 10 });
  });
  it("accepts a link without t plus a typed time", () => {
    expect(resolveMoment({ link: `https://youtu.be/${ID}`, time: "1:00:00" })).toEqual({ ok: true, videoId: ID, atSeconds: 3600 });
  });
  it("explains what is missing", () => {
    expect(resolveMoment({})).toMatchObject({ ok: false });
    expect(resolveMoment({ videoId: ID })).toMatchObject({ ok: false, message: expect.stringContaining("mốc thời gian") });
    expect(resolveMoment({ link: `https://youtu.be/${ID}` })).toMatchObject({ ok: false });
    expect(resolveMoment({ link: "https://example.com" })).toMatchObject({ ok: false, message: expect.stringContaining("Link") });
    expect(resolveMoment({ videoId: ID, time: "1:2" })).toMatchObject({ ok: false, message: expect.stringContaining("phút:giây") });
    expect(resolveMoment({ videoId: "bad", time: "1:00" })).toMatchObject({ ok: false });
  });
  it("rejects a moment past the end of the video when its length is known", () => {
    const max = (id: string) => (id === ID ? 600 : undefined);
    expect(resolveMoment({ videoId: ID, time: "10:01" }, max)).toMatchObject({ ok: false, message: expect.stringContaining("10:00") });
    expect(resolveMoment({ videoId: ID, time: "10:00" }, max)).toMatchObject({ ok: true, atSeconds: 600 });
    expect(resolveMoment({ videoId: "AAAAAAAAAAA", time: "5:00:00" }, max)).toMatchObject({ ok: true });
  });
});
