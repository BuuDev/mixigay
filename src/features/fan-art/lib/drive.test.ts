import { describe, expect, it } from "vitest";
import { canonicalDriveUrl, driveImageUrl, extractDriveFileId } from "./drive";

describe("extractDriveFileId", () => {
  it.each([
    ["https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view?usp=sharing", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"],
    ["https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/edit", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"],
    ["https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"],
    ["https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"],
    ["https://docs.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view", "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"],
  ])("extracts fileId from %s", (url, expected) => {
    expect(extractDriveFileId(url)).toBe(expected);
  });

  it.each([
    "http://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view",
    "https://evil.example/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view",
    "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz012345",
    "https://drive.google.com/file/d/short/view",
    "not-a-url",
  ])("rejects %s", (url) => {
    expect(extractDriveFileId(url)).toBeNull();
  });

  it("formats canonicalDriveUrl and driveImageUrl", () => {
    expect(canonicalDriveUrl("1AbCdEfGhIjKlMnOpQrStUvWxYz012345")).toBe(
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view",
    );
    expect(driveImageUrl("1AbCdEfGhIjKlMnOpQrStUvWxYz012345", 800)).toBe(
      "https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345&sz=w800",
    );
  });
});

