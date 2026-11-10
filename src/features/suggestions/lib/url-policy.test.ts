import { describe, expect, it } from "vitest";
import { allowedSuggestionUrl } from "./url-policy";

describe("allowedSuggestionUrl", () => {
  it.each([
    "https://store.steampowered.com/app/1966720/Lethal_Company/",
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://zeekerss.itch.io/lethal-company",
    "https://store.epicgames.com/en-US/p/fortnite",
    "https://www.roblox.com/games/1",
  ])("accepts %s", (url) => {
    expect(allowedSuggestionUrl(url)).not.toBeNull();
  });

  it.each([
    ["plain http", "http://store.steampowered.com/app/1"],
    ["unknown host", "https://nhacai88.vip/khuyen-mai"],
    ["look-alike suffix", "https://store.steampowered.com.evil.example/app/1"],
    ["userinfo trick", "https://store.steampowered.com@evil.example/app"],
    ["credentials", "https://user:pw@store.steampowered.com/app/1"],
    ["custom port", "https://store.steampowered.com:8443/app/1"],
    ["shortener", "https://bit.ly/abc"],
    ["javascript", "javascript:alert(1)"],
    ["not a url", "steam lethal company"],
    ["too long", `https://store.steampowered.com/${"a".repeat(500)}`],
    ["hostname containing an allowed one", "https://notyoutube.com/watch"],
  ])("rejects %s", (_label, url) => {
    expect(allowedSuggestionUrl(url)).toBeNull();
  });

  it("is empty-safe", () => {
    expect(allowedSuggestionUrl(undefined)).toBeNull();
    expect(allowedSuggestionUrl("  ")).toBeNull();
  });
});
