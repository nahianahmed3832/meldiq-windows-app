import { describe, expect, it } from "vitest";
import { APPS, appFor, detectPlatform } from "../src/lib/device";
import { FOOTER, HEADER_LINKS } from "../src/content/navigation";

const UA = {
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ipadAsMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromebook: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

describe("device detection", () => {
  it("recognises each platform from the browser's hints", () => {
    expect(detectPlatform({ userAgent: UA.android })).toBe("android");
    expect(detectPlatform({ userAgent: UA.iphone })).toBe("ios");
    expect(detectPlatform({ userAgent: UA.ipadAsMac, maxTouchPoints: 0 })).toBe("macos");
    // iPadOS says it's a Mac; its touch screen gives it away.
    expect(detectPlatform({ userAgent: UA.ipadAsMac, maxTouchPoints: 5 })).toBe("ios");
    expect(detectPlatform({ userAgent: UA.windows })).toBe("windows");
    expect(detectPlatform({ userAgent: UA.linux })).toBe("linux");
    expect(detectPlatform({ userAgent: UA.chromebook })).toBe("linux");
    expect(detectPlatform({ userAgent: "", platform: "Windows" })).toBe("windows");
    expect(detectPlatform({ userAgent: "curl/8" })).toBe("unknown");
    // The user agent wins over a contradicting platform hint.
    expect(detectPlatform({ userAgent: UA.windows, platform: "MacIntel" })).toBe("windows");
    expect(detectPlatform({ userAgent: "", platform: "Android" })).toBe("android");
  });

  it("suggests the Play Store on Android, coming soon where an app isn't out, and nothing where there's no app", () => {
    expect(appFor("android")).toMatchObject({ href: "https://play.google.com/store/apps/details?id=com.meldiq.android" });
    expect(appFor("windows")).toMatchObject({ href: expect.stringMatching(/^\/downloads\/windows\//), action: "Download for Windows" });
    for (const p of ["ios", "macos"] as const) expect(appFor(p)).toMatchObject({ href: null, action: expect.stringMatching(/coming soon/) });
    expect(appFor("linux")).toBeNull();
    expect(appFor("unknown")).toBeNull();
    expect(APPS.map((a) => a.platform)).toEqual(["android", "ios", "macos", "windows"]);
  });
});

describe("navigation content", () => {
  it("has a label and a site path or https address for every link", () => {
    for (const l of [...HEADER_LINKS, ...FOOTER.flatMap((c) => c.links)]) {
      expect(l.label.trim()).not.toBe("");
      expect(l.href).toMatch(/^(\/|https:\/\/)/);
    }
    expect(FOOTER.map((c) => c.title)).toEqual(["Product", "Account", "Legal"]);
  });
});
