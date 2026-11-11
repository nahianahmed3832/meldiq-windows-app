import { detectPlatform, type DeviceHints } from "./device";

/** A suggestion only. Ambiguous Windows architectures keep the browser fallback. */
export function recommendedDownload(hints: DeviceHints): "android" | "windows" | "web" {
  const platform = detectPlatform(hints);
  if (platform === "android") return "android";
  if (platform === "windows" && /(?:x64|amd64|x86_64|win64|wow64)/i.test(hints.userAgent) && !/arm|aarch/i.test(hints.userAgent)) return "windows";
  return "web";
}
