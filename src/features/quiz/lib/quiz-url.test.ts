import { describe, expect, it } from "vitest";
import { playedMomentUrl, QUIZ_PLATFORM_LIST, quizPlatform } from "./quiz-url";

describe("quizPlatform", () => {
  it.each([
    ["https://kahoot.it/challenge/01234567?challenge-id=abc", "kahoot"],
    ["https://create.kahoot.it/details/abc/1234-5678", "kahoot"],
    ["https://play.kahoot.it/v2/?quizId=abc", "kahoot"],
    ["https://www.kahoot.it/x", "kahoot"],
    ["https://quizizz.com/join?gc=123456", "wayground"],
    ["https://wayground.com/admin/quiz/abc", "wayground"],
    ["https://www.wayground.com/join?gc=1", "wayground"],
    ["https://wordwall.net/vi/resource/12345/do-vui", "wordwall"],
    ["https://quizlet.com/vn/123/bo-toc-flash-cards/", "quizlet"],
    ["https://www.blooket.com/set/abc", "blooket"],
    ["https://forms.gle/AbCdEf123", "google-forms"],
    ["https://docs.google.com/forms/d/e/1FAIpQ/viewform", "google-forms"],
  ])("accepts %s", (url, platform) => {
    expect(quizPlatform(url)).toBe(platform);
  });

  it("is case-insensitive like the SQL ~* check", () => {
    expect(quizPlatform("HTTPS://Create.Kahoot.IT/details/abc")).toBe("kahoot");
    expect(quizPlatform("https://DOCS.google.com/Forms/d/abc")).toBe("google-forms");
  });

  it.each([
    "http://kahoot.it/challenge/1",
    "kahoot.it/challenge/1",
    "https://kahoot.it",
    "https://kahoot.it/",
    "https://kahoot.it.evil.com/x",
    "https://kahoot.it@evil.com/x",
    "https://kahoot.it:443/x",
    "https://evilkahoot.it/x",
    "https://evil.kahoot.it/x",
    "https://www.create.kahoot.it/x",
    "https://kahoot.it.com/x",
    "https://kahoot.itx/x",
    "https://wordwall.net.evil.io/x",
    "https://www.forms.gle/abc",
    "https://forms.gle.evil.com/abc",
    "https://docs.google.com/document/d/abc",
    "https://docs.google.com/formsx/d/abc",
    "https://docs.google.com.evil.com/forms/abc",
    "https://google.com/forms/abc",
    "https://kahoot.it/has space",
    " https://kahoot.it/x",
    "https://kahoot.it/x\n",
    "javascript:alert(1)//kahoot.it/x",
    "",
  ])("rejects %j", (url) => {
    expect(quizPlatform(url)).toBeNull();
  });

  it("rejects links longer than 300 characters", () => {
    const base = "https://kahoot.it/";
    expect(quizPlatform(base + "a".repeat(300 - base.length))).toBe("kahoot");
    expect(quizPlatform(base + "a".repeat(301 - base.length))).toBeNull();
  });

  it("lists every platform for messages", () => {
    expect(QUIZ_PLATFORM_LIST).toBe("Kahoot, Wayground (Quizizz), Wordwall, Quizlet, Blooket hoặc Google Forms");
  });
});

describe("playedMomentUrl", () => {
  it("links to the YouTube moment, keeping t=0", () => {
    expect(playedMomentUrl("dQw4w9WgXcQ", 125)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=125s");
    expect(playedMomentUrl("dQw4w9WgXcQ", 0)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0s");
    expect(playedMomentUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});
