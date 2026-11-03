import Link from "next/link";
import { useEffect, useState } from "react";
import { appFor, browserHints, detectPlatform, type Platform } from "../lib/device";
import { SITE } from "../lib/site";

interface AppButtonsProps {
  /** "hero": light buttons on the teal hero; "page": on a light surface. */
  tone?: "hero" | "page";
}

/**
 * "Open Meldiq on the web" (always first, on the left), then the app for the visitor's device: the Play Store on
 * Android, "coming soon" where the app isn't out yet, and all downloads where Meldiq has no app (Linux, unknown). The
 * build renders the neutral "Get the app"; the browser swaps in its own suggestion once loaded.
 */
export function AppButtons({ tone = "page" }: AppButtonsProps) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => setPlatform(detectPlatform(browserHints())), []);
  const app = platform ? appFor(platform) : null;
  const primary = tone === "hero" ? "btn btn-light" : "btn btn-primary";
  const secondary = tone === "hero" ? "btn btn-outline-light" : "btn btn-secondary";

  return (
    <div className="hero-actions" data-platform={platform ?? "pending"}>
      <a href={SITE.webAppUrl} className={primary}>
        Open Meldiq on the web
      </a>
      {app?.href ? (
        <a href={app.href} className={secondary} rel="noopener">
          {app.action}
        </a>
      ) : app ? (
        <span className={`${secondary} coming-soon`} role="status" aria-disabled="true">
          {app.action}
        </span>
      ) : (
        <Link href="/download" className={secondary}>
          {platform === null ? "Get the app" : "All downloads"}
        </Link>
      )}
    </div>
  );
}
