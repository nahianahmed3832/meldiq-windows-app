import { describe, expect, it } from "vitest";
import { recommendedDownload } from "../src/lib/downloadRecommendation";
describe("download recommendations", () => {
  it("suggests supported Android and explicit x64 Windows devices", () => {
    expect(recommendedDownload({ userAgent: "Mozilla Android 16" })).toBe("android");
    expect(recommendedDownload({ userAgent: "Mozilla Windows NT 10.0; Win64; x64" })).toBe("windows");
  });
  it.each(["Windows NT 10.0", "Windows NT 10.0; ARM64", "Windows NT 10.0; Win64; ARM64", "iPhone", "Macintosh", "Linux", ""])(
    "keeps a browser fallback for %s",
    (userAgent) => {
      expect(recommendedDownload({ userAgent })).toBe("web");
    },
  );
});
