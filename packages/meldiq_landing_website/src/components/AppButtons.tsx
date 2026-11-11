import Link from "next/link";
import { useEffect, useState } from "react";
import { appFor, browserHints, detectPlatform, type Platform } from "../lib/device";
import { SITE } from "../lib/site";
import { WINDOWS_DOWNLOAD } from "../lib/windowsDownload";

const webApp = new URL(SITE.webAppUrl).href;

export function AppButtons({ downloadPage = false }: { downloadPage?: boolean }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => setPlatform(detectPlatform(browserHints())), []);
  const app = platform ? appFor(platform) : null;
  const nativeApp = app?.href ? app : null;

  return (
    <div data-platform={platform ?? "pending"}>
      <div className="ref-actions">
        <a className={`button ${downloadPage && nativeApp ? "secondary" : "primary"}`} href={webApp}>
          Open Meldiq in your browser {!downloadPage && <span aria-hidden="true">→</span>}
        </a>
        {nativeApp?.href ? (
          <a
            className={`button ${downloadPage ? "primary" : "secondary"}`}
            href={nativeApp.href}
            download={platform === "windows" ? WINDOWS_DOWNLOAD.filename : undefined}
          >
            {downloadPage ? `Get Meldiq for ${nativeApp.name}` : nativeApp.action}
          </a>
        ) : (
          !downloadPage && (
            <Link className="button secondary" href="/download">
              All downloads
            </Link>
          )
        )}
      </div>
      {downloadPage && platform ? (
        <p className="fine-print">
          {nativeApp
            ? `Recommended for this device: Meldiq for ${nativeApp.name}.`
            : app
              ? `Use Meldiq in your browser on ${app.name}.`
              : "Use Meldiq in your browser on this device."}
        </p>
      ) : null}
    </div>
  );
}
