import { describe, expect, it } from "vitest";
import { parseAppDetails, steamAppIdFromUrl } from "./steam";
import { normalizeName, safeHttpUrl } from "./text";

describe("steamAppIdFromUrl", () => {
  it("reads the app id from a store link", () => {
    expect(steamAppIdFromUrl("https://store.steampowered.com/app/1966720/Lethal_Company/")).toBe(1966720);
  });
  it("ignores other links", () => {
    expect(steamAppIdFromUrl("https://itch.io/game")).toBeUndefined();
  });
  it("rejects look-alike hosts and paths", () => {
    expect(steamAppIdFromUrl("https://evil.example/store.steampowered.com/app/570")).toBeUndefined();
    expect(steamAppIdFromUrl("https://store.steampowered.com.evil.example/app/570")).toBeUndefined();
    expect(steamAppIdFromUrl("http://store.steampowered.com/app/570")).toBeUndefined();
    expect(steamAppIdFromUrl("https://store.steampowered.com/agecheck/app/570")).toBeUndefined();
    expect(steamAppIdFromUrl("https://store.steampowered.com/app/123456789")).toBeUndefined();
  });
  it("accepts a bare app path", () => {
    expect(steamAppIdFromUrl("https://store.steampowered.com/app/570")).toBe(570);
  });
});

describe("parseAppDetails", () => {
  it("maps price and genres", () => {
    const body = {
      "10": { success: true, data: { name: "CS", header_image: "h.jpg", price_overview: { final_formatted: "120.000₫" }, genres: [{ description: "Hành động" }] } },
    };
    expect(parseAppDetails(10, body)).toEqual({ appId: 10, name: "CS", headerImage: "h.jpg", price: "120.000₫", genres: ["Hành động"] });
  });
  it("labels free games", () => {
    expect(parseAppDetails(1, { "1": { success: true, data: { name: "F", is_free: true } } })?.price).toBe("Miễn phí");
  });
  it("returns undefined for an unknown app", () => {
    expect(parseAppDetails(2, { "2": { success: false } })).toBeUndefined();
  });
});

describe("normalizeName", () => {
  it("strips Vietnamese diacritics and punctuation", () => {
    expect(normalizeName("Bán Trà Sữa Đường Phố!")).toBe("bantrasuaduongpho");
    expect(normalizeName("R.E.P.O.")).toBe("repo");
  });
});

describe("safeHttpUrl", () => {
  it("accepts http(s) links", () => {
    expect(safeHttpUrl(" https://itch.io/x ")).toBe("https://itch.io/x");
  });
  it("rejects other schemes and garbage", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
    expect(safeHttpUrl("")).toBeUndefined();
  });
});
