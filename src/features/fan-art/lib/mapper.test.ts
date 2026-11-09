import { describe, expect, it } from "vitest";
import { mapFanArt } from "./mapper";

describe("mapFanArt", () => {
  it("maps valid Google Drive fan_art row to FanArtItem with thumbnail URL", () => {
    const item = mapFanArt({
      id: "art-1",
      title: "Chân dung Tộc Trưởng",
      artist: "Fan A",
      drive_url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view",
      drive_file_id: "1AbCdEfGhIjKlMnOpQrStUvWxYz012345",
      note: "Vẽ bằng iPad",
      approved: true,
      created_at: "2026-11-08T00:00:00Z",
    });
    expect(item).not.toBeNull();
    expect(item?.driveFileId).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz012345");
    expect(item?.imageUrl).toContain("1AbCdEfGhIjKlMnOpQrStUvWxYz012345");
  });

  it("returns null when both drive_url and drive_file_id are invalid", () => {
    const item = mapFanArt({
      id: "art-bad",
      title: "Bad",
      artist: "Fan",
      drive_url: "https://evil.example/x.png",
      drive_file_id: "bad",
      note: null,
      approved: true,
      created_at: "2026-11-08T00:00:00Z",
    });
    expect(item).toBeNull();
  });
});

