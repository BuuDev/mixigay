import { describe, expect, it } from "vitest";
import { checkSourceUrl } from "./source";

const ok = (raw: string) => checkSourceUrl(raw).ok;

describe("checkSourceUrl", () => {
  it("accepts YouTube links on every official host", () => {
    expect(checkSourceUrl("https://www.youtube.com/watch?v=PoFdB4XcLe8")).toEqual({
      ok: true,
      url: "https://www.youtube.com/watch?v=PoFdB4XcLe8",
      label: "YouTube",
    });
    expect(ok("https://m.youtube.com/watch?v=PoFdB4XcLe8")).toBe(true);
    expect(ok("https://youtu.be/PoFdB4XcLe8")).toBe(true);
    expect(ok("https://www.youtube.com/@MixiGaming3con")).toBe(true);
  });

  it("accepts the listed Vietnamese news sites, including their subdomains", () => {
    for (const host of [
      "kenh14.vn",
      "gamek.vn",
      "thanhnien.vn",
      "tuoitre.vn",
      "vnexpress.net",
      "zingnews.vn",
      "znews.vn",
      "tienphong.vn",
      "dantri.com.vn",
      "vietnamnet.vn",
    ]) {
      expect(ok(`https://${host}/bai-viet-123.htm`), host).toBe(true);
    }
    expect(ok("https://m.kenh14.vn/bai.chn")).toBe(true);
    expect(checkSourceUrl("https://kenh14.vn/a.chn")).toMatchObject({ label: "Kenh14" });
  });

  it("accepts only the official Facebook page and group", () => {
    expect(checkSourceUrl("https://www.facebook.com/MixiGaming")).toMatchObject({ ok: true, label: "Facebook chính chủ" });
    expect(ok("https://facebook.com/mixigaming/posts/123")).toBe(true);
    expect(ok("https://www.facebook.com/groups/mixigaming/")).toBe(true);
    expect(ok("https://www.facebook.com/someone.else")).toBe(false);
    expect(ok("https://www.facebook.com/MixiGamingFake")).toBe(false);
    expect(ok("https://www.facebook.com/groups/other")).toBe(false);
  });

  it("rejects http, other schemes and look-alike hosts with a clear message", () => {
    expect(checkSourceUrl("http://kenh14.vn/a.chn")).toEqual({ ok: false, message: "Link nguồn phải bắt đầu bằng https://." });
    expect(ok("javascript:alert(1)")).toBe(false);
    expect(ok("https://kenh14.vn.evil.com/a")).toBe(false);
    expect(ok("https://notkenh14.vn/a")).toBe(false);
    expect(ok("https://youtube.com.example.org/watch")).toBe(false);
    expect(ok("https://user:pw@youtube.com/watch?v=x")).toBe(false);
    const other = checkSourceUrl("https://bit.ly/abc");
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.message).toContain("chưa được nhận");
  });

  it("rejects empty, malformed and over-long links", () => {
    expect(ok("")).toBe(false);
    expect(ok("kenh14.vn/a")).toBe(false);
    expect(ok(`https://kenh14.vn/${"a".repeat(300)}`)).toBe(false);
  });

  it("drops the fragment", () => {
    expect(checkSourceUrl("https://youtu.be/abc#t=10")).toMatchObject({ url: "https://youtu.be/abc" });
  });
});
