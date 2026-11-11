import { ANDROID_PLAY_URL, SITE } from "./site";

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";
export const analyticsId = /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : "";
const consentCookie = "meldiq_analytics";
const consentLifetime = 15_552_000;
const storageKey = "meldiq.analytics.preference";
let initialized = false;
let lastPage = "";
declare global {
  interface Window {
    dataLayer?: unknown[];
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export function readAnalyticsChoice(): "allowed" | "denied" | null {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(consentCookie + "="))
    ?.split("=")[1];
  if (value === "allowed" || value === "denied") return value;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved?.expiresAt > Date.now() && (saved.choice === "allowed" || saved.choice === "denied")) return saved.choice;
  } catch {
    // Storage may be blocked or unavailable in this browser.
  }
  return null;
}

export function saveAnalyticsChoice(choice: "allowed" | "denied") {
  document.cookie = `${consentCookie}=${choice}; Path=/; Max-Age=${consentLifetime}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ choice, expiresAt: Date.now() + consentLifetime * 1000 }));
  } catch {
    // The first-party cookie is sufficient when local storage is unavailable.
  }
  if (choice === "denied" && initialized) {
    window[`ga-disable-${analyticsId}`] = true;
    // Remove Google Analytics cookies created on the current host or parent domain.
    for (const entry of document.cookie.split("; ")) {
      const name = entry.split("=")[0];
      if (!/^_ga(?:_[A-Z0-9]+)?$/.test(name ?? "")) continue;
      document.cookie = `${name}=; Path=/; Max-Age=0`;
      document.cookie = `${name}=; Domain=${new URL(SITE.url).hostname}; Path=/; Max-Age=0`;
    }
    window.location.reload();
  }
}

function tag(..._args: unknown[]) {
  window.dataLayer ??= [];
  // The Google tag bootstrap expects the original command arguments.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function safeReferrer(): string | null {
  if (!document.referrer) return "";
  try {
    const referrer = new URL(document.referrer);
    // Google can also read the document directly. Only load the tag when its
    // native referrer has no query, credentials, fragment, or external path.
    if (referrer.search || referrer.hash || referrer.username || referrer.password) return null;
    if (referrer.protocol !== "https:" && referrer.protocol !== "http:") return null;
    if (referrer.pathname !== "/" && referrer.origin !== location.origin) return null;
    if (/^\/(?:account|login|signup|verify-email|forgot-password)(?:[./]|$)/.test(referrer.pathname)) return null;
    return referrer.origin + "/";
  } catch {
    return null;
  }
}

function safeDocument(): boolean {
  if (location.search) return false;
  // Existing in-page section links can contain an ordinary heading ID.
  return !location.hash || (/^#[a-z0-9-]+$/i.test(location.hash) && !!document.getElementById(location.hash.slice(1)));
}

export function recordPublicPage(path: string) {
  if (!analyticsId || readAnalyticsChoice() !== "allowed" || !safeDocument()) return;
  const pageLocation = new URL(path, SITE.url).href;
  const referrer = lastPage || safeReferrer();
  if (referrer === null || lastPage === pageLocation) return;

  if (!initialized) {
    tag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    tag("consent", "update", { analytics_storage: "granted" });
    tag("js", new Date());
    tag("config", analyticsId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: new URL(SITE.url).hostname,
      page_location: pageLocation,
      page_referrer: referrer,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
    script.referrerPolicy = "no-referrer";
    document.head.append(script);
    initialized = true;
  } else {
    tag("set", { page_location: pageLocation, page_referrer: referrer });
  }
  lastPage = pageLocation;
}

export function recordDownloadClick(anchor: HTMLAnchorElement) {
  if (!initialized || readAnalyticsChoice() !== "allowed" || !safeDocument()) return;
  if (anchor.href === ANDROID_PLAY_URL) {
    tag("event", "play_store_click", { platform: "android", page_location: lastPage, transport_type: "beacon" });
  }
}
