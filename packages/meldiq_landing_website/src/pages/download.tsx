import Link from "next/link";
import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { ANDROID_PLAY_URL, SITE } from "../lib/site";
import { WINDOWS_DOWNLOAD } from "../lib/windowsDownload";
import { browserHints } from "../lib/device";
import { recommendedDownload } from "../lib/downloadRecommendation";

export default function Download() {
  const [recommended, setRecommended] = useState<"windows" | "android" | "web">("web");
  useEffect(() => setRecommended(recommendedDownload(browserHints())), []);
  const badge = (platform: typeof recommended) => (
    <span className={`platform-note${recommended === platform ? " recommended" : ""}`}>
      {recommended === platform ? (platform === "web" ? "A good place to start" : "Suggested for your device") : "Available now"}
    </span>
  );
  return (
    <Layout
      title="Download for Windows & Android or Use the Web App"
      description="Choose the right Meldiq client. Get Windows x64, install Android from Google Play, or open the web app. Find release details and setup help."
    >
      <section className="interior-hero download-intro wrap">
        <span className="ref-kicker">One account. Your devices.</span>
        <h1>
          Meldiq, <em>wherever you are.</em>
        </h1>
        <p>Give your conversations their own window, take them with you, or open a tab. Pick the option that works for you.</p>
      </section>
      <section className="platform-grid wrap" aria-label="Choose your platform">
        <article className={`platform-card${recommended === "windows" ? " suggested" : ""}`}>
          <div className="platform-top">
            <span className="ref-kicker">Desktop</span>
            {badge("windows")}
          </div>
          <h2>Windows</h2>
          <p>A dedicated home for your communities, messages and calls.</p>
          <dl className="release-facts">
            <div>
              <dt>Version</dt>
              <dd>{WINDOWS_DOWNLOAD.version}</dd>
            </div>
            <div>
              <dt>Architecture</dt>
              <dd>Windows x64</dd>
            </div>
            <div>
              <dt>Installer</dt>
              <dd>{WINDOWS_DOWNLOAD.sizeLabel}</dd>
            </div>
          </dl>
          <a className={`button ${recommended === "windows" ? "primary" : "secondary"}`} href={WINDOWS_DOWNLOAD.href} download={WINDOWS_DOWNLOAD.filename}>
            Download for Windows <span aria-hidden="true">↓</span>
          </a>
          <a className="inline-link" href="#windows-details">
            Release &amp; installation details →
          </a>
        </article>
        <article className={`platform-card${recommended === "android" ? " suggested" : ""}`}>
          <div className="platform-top">
            <span className="ref-kicker">Mobile</span>
            {badge("android")}
          </div>
          <h2>Android</h2>
          <p>Your people, in your pocket. Get the official app from Google Play.</p>
          <p className="platform-detail">Google Play shows the current version, device requirements and availability for your region.</p>
          <a className={`button ${recommended === "android" ? "primary" : "secondary"}`} href={ANDROID_PLAY_URL}>
            Get it on Google Play <span aria-hidden="true">↗</span>
          </a>
          <span className="fine-print">Install through the official store.</span>
        </article>
        <article className={`platform-card${recommended === "web" ? " suggested" : ""}`}>
          <div className="platform-top">
            <span className="ref-kicker">Browser</span>
            {badge("web")}
          </div>
          <h2>Web app</h2>
          <p>Start a conversation without installing anything. Your account comes with you.</p>
          <p className="platform-detail">Use a recent Chrome, Edge, Firefox or Safari. Also the available option for Mac, Linux, iPhone and iPad.</p>
          <a className={`button ${recommended === "web" ? "primary" : "secondary"}`} href={new URL(SITE.webAppUrl).href}>
            Open Meldiq in your browser <span aria-hidden="true">↗</span>
          </a>
          <span className="fine-print">No download required.</span>
        </article>
      </section>
      <section className="interior-section wrap download-details" id="windows-details">
        <div>
          <span className="ref-kicker">Windows release</span>
          <h2>Know what you’re installing.</h2>
          <p>This download is for 64-bit Windows (x64). If your device or architecture is different, use the web app.</p>
          <div className="supporting-links">
            <a href={WINDOWS_DOWNLOAD.releaseHref}>Release details (JSON)</a>
            <a href={WINDOWS_DOWNLOAD.checksumHref}>SHA-256 checksum</a>
          </div>
        </div>
        <div className="release-panel">
          <dl>
            <div>
              <dt>File</dt>
              <dd>{WINDOWS_DOWNLOAD.filename}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{WINDOWS_DOWNLOAD.bytes.toLocaleString("en-US")} bytes</dd>
            </div>
            <div>
              <dt>SHA-256</dt>
              <dd>
                <code>{WINDOWS_DOWNLOAD.sha256}</code>
              </dd>
            </div>
            <div>
              <dt>Publisher signing</dt>
              <dd>{WINDOWS_DOWNLOAD.signed ? "Publisher signed" : "No Authenticode publisher certificate"}</dd>
            </div>
          </dl>
          <p className="fine-print">
            Automatic updates are authenticated with Meldiq’s release-key signatures and artifact digests. Publisher signing is separate from update
            authentication.
          </p>
        </div>
      </section>
      <section className="interior-section wrap setup-section">
        <div>
          <span className="ref-kicker">Make yourself at home</span>
          <h2>Install. Sign in. Say hello.</h2>
        </div>
        <ol className="setup-steps">
          <li>
            <div>
              <h3>Choose your client</h3>
              <p>Download the Windows installer, use the official Android store listing, or open the browser app.</p>
            </div>
          </li>
          <li>
            <div>
              <h3>Use your Meldiq account</h3>
              <p>Sign in with the same account on each supported device to pick up your communities and conversations.</p>
            </div>
          </li>
          <li>
            <div>
              <h3>Keep it current</h3>
              <p>
                Windows updates install when you safely quit the app. Version 0.1.0 needs one manual installation of the current release to enable automatic
                updates.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className="planned-platforms wrap" aria-label="Planned native apps">
        <h2>More native apps, in time.</h2>
        <div>
          <article className="coming-card">
            <span className="coming-badge">Planned</span>
            <h3>iPhone &amp; iPad</h3>
            <p>Use the web app while native apps are in development.</p>
          </article>
          <article className="coming-card">
            <span className="coming-badge">Planned</span>
            <h3>macOS</h3>
            <p>No native download or release date has been announced.</p>
          </article>
        </div>
      </section>
      <section className="interior-section wrap compact-faq">
        <span className="ref-kicker">A little help</span>
        <h2>Before you get going.</h2>
        <details>
          <summary>Why might Windows show a warning?</summary>
          <p>
            The installer does not currently have a publisher certificate. Compare its SHA-256 with the published checksum and check the release details. If
            you’re unsure, use the web app.
          </p>
        </details>
        <details>
          <summary>My device isn’t listed. What should I use?</summary>
          <p>Open Meldiq in a supported browser. All currently available native downloads are listed above; a device suggestion never starts a download.</p>
        </details>
        <details>
          <summary>Having trouble signing in or joining a call?</summary>
          <p>
            Visit <Link href="/support">Support</Link> for account help or the <Link href="/voice-video-screen-sharing">voice and screen-sharing guide</Link>{" "}
            for permissions and setup.
          </p>
        </details>
      </section>
    </Layout>
  );
}
