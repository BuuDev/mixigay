import { describe, expect, it } from "vitest";
import type { ThemeWindow } from "../types";
import { activeThemeAt, activeThemeOn } from "./pick";

const w = (id: string, theme: ThemeWindow["theme"], startsOn: string, endsOn: string): ThemeWindow => ({ id, theme, label: id, startsOn, endsOn });

describe("activeThemeOn", () => {
  const tet = w("a", "tet", "2027-02-01", "2027-02-10");

  it("is null with no windows or outside every window", () => {
    expect(activeThemeOn([], "2027-02-05")).toBeNull();
    expect(activeThemeOn([tet], "2027-01-31")).toBeNull();
    expect(activeThemeOn([tet], "2027-02-11")).toBeNull();
  });

  it("includes both the first and the last day", () => {
    expect(activeThemeOn([tet], "2027-02-01")).toBe("tet");
    expect(activeThemeOn([tet], "2027-02-10")).toBe("tet");
  });

  it("handles a one-day window", () => {
    expect(activeThemeOn([w("b", "birthday", "2027-03-15", "2027-03-15")], "2027-03-15")).toBe("birthday");
  });

  it("lets the window that started latest win an overlap, in any order", () => {
    const cup = w("c", "mixi-cup", "2027-02-05", "2027-02-20");
    expect(activeThemeOn([tet, cup], "2027-02-06")).toBe("mixi-cup");
    expect(activeThemeOn([cup, tet], "2027-02-06")).toBe("mixi-cup");
    expect(activeThemeOn([tet, cup], "2027-02-04")).toBe("tet");
    expect(activeThemeOn([tet, cup], "2027-02-15")).toBe("mixi-cup");
  });

  it("breaks a same-start tie by the earlier end, then by id", () => {
    const long = w("x", "tet", "2027-02-01", "2027-02-28");
    const short = w("y", "birthday", "2027-02-01", "2027-02-03");
    expect(activeThemeOn([long, short], "2027-02-02")).toBe("birthday");
    const twin = w("w", "mixi-cup", "2027-02-01", "2027-02-28");
    expect(activeThemeOn([long, twin], "2027-02-10")).toBe("mixi-cup");
    expect(activeThemeOn([twin, long], "2027-02-10")).toBe("mixi-cup");
  });
});

describe("activeThemeAt (Vietnam day boundaries)", () => {
  const tet = w("a", "tet", "2027-02-01", "2027-02-10");

  it("starts at 00:00 Vietnam time, which is 17:00 UTC the day before", () => {
    expect(activeThemeAt([tet], new Date("2027-01-31T16:59:59Z"))).toBeNull();
    expect(activeThemeAt([tet], new Date("2027-01-31T17:00:00Z"))).toBe("tet");
  });

  it("ends after 23:59 Vietnam time on the last day", () => {
    expect(activeThemeAt([tet], new Date("2027-02-10T16:59:59Z"))).toBe("tet");
    expect(activeThemeAt([tet], new Date("2027-02-10T17:00:00Z"))).toBeNull();
  });
});
