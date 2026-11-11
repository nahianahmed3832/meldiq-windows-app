/**
 * Prices as the API gives them: an integer in the currency's minor unit (cents for USD, none for JPY), never floating
 * point. Shown with the currency's own number of decimals; nothing is converted or rounded across currencies.
 */
export function minorDigits(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function formatMoney(amountMinor: number, currency: string, locale = "en-US"): string {
  const digits = minorDigits(currency);
  const value = amountMinor / 10 ** digits;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency.toUpperCase()}`;
  }
}

export type Interval = "month" | "year";

export const intervalLabel = (i: Interval): string => (i === "month" ? "month" : "year");
export const intervalAdverb = (i: Interval): string => (i === "month" ? "monthly" : "yearly");

export function billingPeriod(interval: Interval, frequency = 1): string {
  return frequency === 1 ? interval : `${frequency} ${interval}s`;
}

/** "$5.00 / month" */
export function formatPrice(amountMinor: number, currency: string, interval: Interval, locale?: string): string {
  return `${formatMoney(amountMinor, currency, locale)} / ${intervalLabel(interval)}`;
}

/** A yearly price shown per month, rounded down to the minor unit (only as a comparison, never as what is charged). */
export function monthlyEquivalent(amountMinor: number, interval: Interval): number {
  return interval === "year" ? Math.floor(amountMinor / 12) : amountMinor;
}

export function formatDate(ms: number, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(ms));
}

export function formatBytes(n: number): string {
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${u === 0 ? v : Number(v.toFixed(1))} ${units[u]}`;
}
