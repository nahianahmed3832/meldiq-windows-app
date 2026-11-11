import Link from "next/link";
import { AppButtons } from "../components/AppButtons";
import { Layout } from "../components/Layout";
import { FinalCta } from "../components/MarketingArt";
import { LandingProductPreview } from "../components/LandingProductPreview";
import { ANDROID_PLAY_URL, SITE } from "../lib/site";
import { WINDOWS_DOWNLOAD } from "../lib/windowsDownload";

const webAppUrl = new URL(SITE.webAppUrl).href;

export default function Download() {
  return (
    <Layout
      title="Download for Windows & Android or Use the Web App"
      description="Download Meldiq for Windows, open it in your browser or get the official Android app. One account across your devices."
    >
      <section className="download-hero wrap">
        <div>
          <span className="ref-kicker">Desktop app</span>
          <h1>
            Meldiq for
            <br />
            your desktop.
          </h1>
          <p>Give your conversations their own window. Your communities, messages and calls are there when you sign in.</p>
          <AppButtons downloadPage />
        </div>
        <LandingProductPreview />
      </section>
      <section className="download-section wrap">
        <h2>Why the app?</h2>
        <div className="download-platforms">
          <article>
            <h3>Talk and share your screen</h3>
            <p>Hop into a voice or video call and show the group what you’re working on.</p>
            <Link className="inline-link" href="/voice-video-screen-sharing">
              Explore voice and video →
            </Link>
          </article>
          <article>
            <h3>One account</h3>
            <p>Sign in on another supported device to pick up your conversations.</p>
          </article>
          <article>
            <h3>A dedicated window</h3>
            <p>Keep your communities and messages close as you switch between apps.</p>
          </article>
        </div>
      </section>
      <section className="download-section wrap">
        <h2>How to get it</h2>
        <div className="download-platforms">
          <article>
            <h3>Windows</h3>
            <p>
              Download the installer above, run it and sign in to your Meldiq account. Updates install automatically when you safely quit the app. If you still
              use version 0.1.0, install the current version once to enable automatic updates.
            </p>
            <a className="button secondary" href={WINDOWS_DOWNLOAD.href} download={WINDOWS_DOWNLOAD.filename}>
              Download for Windows
            </a>
            <p className="fine-print">
              64-bit · Version {WINDOWS_DOWNLOAD.version} · {WINDOWS_DOWNLOAD.sizeLabel}
            </p>
            <a className="inline-link" href={WINDOWS_DOWNLOAD.releaseHref}>
              Windows release details →
            </a>
          </article>
          <article>
            <h3>Android</h3>
            <p>Install the official Meldiq app through Google Play. Availability may vary by region.</p>
            <a className="play-badge" href={ANDROID_PLAY_URL}>
              <img src="/assets/google-play-badge.png" width={150} height={58} alt="Get it on Google Play" loading="lazy" />
            </a>
          </article>
          <article>
            <h3>Web</h3>
            <p>Use Meldiq in a recent version of Chrome, Edge, Firefox or Safari. Just open the web app and sign in.</p>
            <a className="inline-link" href={webAppUrl}>
              Use the web app →
            </a>
          </article>
        </div>
      </section>
      <section className="download-section wrap">
        <h2>Questions</h2>
        <div className="download-platforms">
          <article>
            <h3>Why might Windows show a warning?</h3>
            <p>
              Windows may show an unknown publisher because the installer does not currently have publisher signing. Compare its SHA-256 with the published
              checksum.
            </p>
            <a className="inline-link" href={WINDOWS_DOWNLOAD.checksumHref}>
              See the installer checksum →
            </a>
          </article>
          <article className="coming-card">
            <h3>iPhone &amp; iPad</h3>
            <span className="coming-badge">Planned</span>
            <p>Use the web app while the native apps are in development.</p>
          </article>
          <article className="coming-card">
            <h3>macOS</h3>
            <span className="coming-badge">Planned</span>
            <p>Use Meldiq in your browser on Mac.</p>
          </article>
        </div>
      </section>
      <FinalCta />
    </Layout>
  );
}
