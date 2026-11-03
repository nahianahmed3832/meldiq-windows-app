import { ANDROID_PLAY_URL } from "./site";
import { WINDOWS_DOWNLOAD } from "./windowsDownload";

/**
 * Which Meldiq app suits the visitor's device. Read from the browser only (never sent anywhere), and only to choose
 * which download to suggest: every app stays listed on /download whatever this says.
 */
export type Platform = "android" | "ios" | "macos" | "windows" | "linux" | "unknown";

export interface DeviceHints {
  userAgent: string;
  /** navigator.userAgentData.platform where the browser has it (Chromium), else navigator.platform. */
  platform?: string;
  /** iPadOS reports itself as a Mac; a touch screen tells them apart. */
  maxTouchPoints?: number;
}

export function detectPlatform({ userAgent, platform = "", maxTouchPoints = 0 }: DeviceHints): Platform {
  // The user agent names the system most precisely; the platform hint only fills in when it says nothing.
  const fromAgent = platformFrom(userAgent.toLowerCase(), maxTouchPoints);
  return fromAgent !== "unknown" ? fromAgent : platformFrom(platform.toLowerCase(), maxTouchPoints);
}

function platformFrom(text: string, maxTouchPoints: number): Platform {
  if (text.includes("android")) return "android";
  if (/iphone|ipad|ipod|^ios$/.test(text)) return "ios";
  if (text.includes("macintosh") || text.startsWith("mac")) return maxTouchPoints > 1 ? "ios" : "macos";
  if (text.includes("windows") || text.startsWith("win")) return "windows";
  if (text.includes("linux") || text.includes("cros") || text === "chrome os") return "linux";
  return "unknown";
}

export interface AppOffer {
  platform: Exclude<Platform, "linux" | "unknown">;
  /** "Android", "iPhone and iPad", … */
  name: string;
  /** Where to get it; null while it isn't available. */
  href: string | null;
  /** The button's words. */
  action: string;
}

/** Meldiq's apps, in the order the download page lists them. Change availability here. */
export const APPS: readonly AppOffer[] = [
  { platform: "android", name: "Android", href: ANDROID_PLAY_URL, action: "Get it on Google Play" },
  { platform: "ios", name: "iPhone and iPad", href: null, action: "iPhone app coming soon" },
  { platform: "macos", name: "Mac", href: null, action: "Mac app coming soon" },
  { platform: "windows", name: "Windows", href: WINDOWS_DOWNLOAD.href, action: "Download for Windows" },
];

/** The app to suggest on [platform]; null where Meldiq has no app (Linux, unknown): the web app is the suggestion. */
export function appFor(platform: Platform): AppOffer | null {
  return APPS.find((a) => a.platform === platform) ?? null;
}

/** The browser's own hints (call only in the browser, after the page has loaded). */
export function browserHints(): DeviceHints {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return { userAgent: nav.userAgent, platform: nav.userAgentData?.platform ?? nav.platform, maxTouchPoints: nav.maxTouchPoints };
}
