/**
 * Facts the website states about Meldiq and its operator. Every business detail that isn't decided yet is a visible
 * placeholder (PENDING), never an invented value: the launch checklist (docs/LAUNCH_BLOCKERS.md) lists each one, and
 * `pendingDetails()` finds any left in the built pages.
 */
export const PENDING = (what: string) => `[To be confirmed: ${what}]`;

export const SITE = {
  name: "Meldiq",
  tagline: "Private by design. Connected by everyone.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://meldiq.app",
  webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL ?? "https://web.meldiq.app",
} as const;

/** The Android app on Google Play (owner, 2026-10-28). */
export const ANDROID_PLAY_URL = "https://play.google.com/store/apps/details?id=com.meldiq.android";

/** The personal subscription approved on November 2, 2026. Spark remains separate community boosting. */
export const MOJO = "Meldiq Plus";
/** The API caps individual files at one decimal gigabyte. */
export const PLUS_UPLOAD_BYTES = 1_000_000_000;
export const ANNOUNCED_PLANS = [{ key: "plus", name: "Meldiq Plus", amountMinor: 499, currency: "USD", interval: "month" }] as const;

/** The operator's details for the legal pages. Unconfirmed ones stay visible placeholders. */
export const OPERATOR = {
  legalName: "GRIIPBUDDY LLC",
  address: "1021 E Lincolnway 10704, Cheyenne, WY 82001, United States",
  registration: "Wyoming filing 2026-002057599",
  supportEmail: "contact@griipbuddy.com",
  privacyEmail: "contact@griipbuddy.com",
  governingLaw: PENDING("governing law and courts"),
  refundWindow: "We review requests based on the purchase terms, the issue reported and applicable consumer law.",
  minimumAge: "13 years old",
  dpo: PENDING("data protection contact or representative, where required"),
} as const;

/** When the legal drafts were last changed (shown on each page). */
export const LEGAL_UPDATED = "2026-11-12";

export function isPending(value: string): boolean {
  return value.startsWith("[To be confirmed:");
}

/** Every placeholder still in [text] (used by tests and the launch check). */
export function pendingDetails(text: string): string[] {
  return [...new Set(text.match(/\[To be confirmed: [^\]]+\]/g) ?? [])];
}
