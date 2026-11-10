import { describe, expect, it } from "vitest";
import { mapThemeWindow } from "./mapper";

const row = { id: "1", theme: "tet", label: "Tết 2027", starts_on: "2027-02-01", ends_on: "2027-02-10" };

describe("mapThemeWindow", () => {
  it("maps a valid row", () => {
    expect(mapThemeWindow(row)).toEqual({ id: "1", theme: "tet", label: "Tết 2027", startsOn: "2027-02-01", endsOn: "2027-02-10" });
  });

  it("drops rows the stylesheet cannot render", () => {
    expect(mapThemeWindow({ ...row, theme: "halloween" })).toBeNull();
    expect(mapThemeWindow({ ...row, starts_on: "01/02/2027" })).toBeNull();
    expect(mapThemeWindow({ ...row, ends_on: "2027-01-31" })).toBeNull();
  });
});
