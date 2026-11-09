import { describe, expect, it } from "vitest";
import { OFFICIAL_LINKS } from "./links";

// Guards the donate box: only the verified official hosts, https, unique ids.
const ALLOWED_HOSTS = new Set(["zypage.com", "streamlabs.com", "www.youtube.com", "shop.mixigaming.com", "www.facebook.com", "discord.com"]);

describe("OFFICIAL_LINKS", () => {
  it("only points at verified official hosts over https", () => {
    for (const link of OFFICIAL_LINKS) {
      const url = new URL(link.href);
      expect(url.protocol).toBe("https:");
      expect(ALLOWED_HOSTS.has(url.hostname), link.href).toBe(true);
    }
  });

  it("has unique ids and includes the donate link", () => {
    const ids = OFFICIAL_LINKS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(OFFICIAL_LINKS.find((l) => l.id === "donate")?.href).toBe("https://zypage.com/mixigaming");
  });
});
