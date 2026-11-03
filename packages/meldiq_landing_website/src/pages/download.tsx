import { Layout } from "../components/Layout";
import { FinalCta } from "../components/MarketingArt";
import { WINDOWS_DOWNLOAD } from "../lib/windowsDownload";
export default function Page() {
  return (
    <Layout
      title="Download Meldiq — Windows, Web & Android"
      description="Download Meldiq for Windows, open it in your browser or get the official Android app. One account across your devices."
    >
      <section className={"page-hero wrap"}>
        <a href={"/"} className={"breadcrumb"}>
          {"Home "}
          <span>{"/"}</span>
          {" Download"}
        </a>
        <span className={"eyebrow"}>{"Download"}</span>
        <h1>Download Meldiq.</h1>
        <p>{"Open a tab, download the Windows app or take Meldiq along on Android. One account keeps your communities and conversations together."}</p>
      </section>
      <section className={"download-grid wrap"}>
        <article className={"download-card web-card"}>
          <span className={"available"}>{"● AVAILABLE NOW"}</span>
          <div className={"device-browser"}>
            <div>
              <i></i>
              <i></i>
              <i></i>
              <span>{"web.meldiq.app"}</span>
            </div>
            <section>
              <img className={""} src={"/assets/meldling-128.png"} width={100} height={100} alt={""} loading={"lazy"} decoding={"async"} />
              <strong>
                {"A familiar place."}
                <br />
                {"Any open tab."}
              </strong>
            </section>
          </div>
          <h2>{"Meldiq for the web"}</h2>
          <p>{"No installation. No waiting. Just you and your people."}</p>
          <a className={"button primary"} href={"https://web.meldiq.app/"}>
            {"Open Meldiq in your browser"}
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <path d={"M5 12h14M13 6l6 6-6 6"}></path>
            </svg>
          </a>
          <span className={"fine-print"}>{"Recent Chrome, Edge, Firefox and Safari versions."}</span>
        </article>
        <article className={"download-card android-card"}>
          <span className={"available"}>{"● AVAILABLE NOW"}</span>
          <div className={"device-phone"}>
            <span className={"phone-notch"}></span>
            <img className={""} src={"/assets/meldling-128.png"} width={75} height={75} alt={""} loading={"lazy"} decoding={"async"} />
            <span>
              {"Good company."}
              <br />
              {"On the go."}
            </span>
            <div className={"phone-messages"}>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
          <h2>{"Meldiq for Android"}</h2>
          <p>{"Keep your community close, wherever the day takes you."}</p>
          <a className={"play-badge"} href={"https://play.google.com/store/apps/details?id=com.meldiq.android"}>
            <img src={"/assets/google-play-badge.png"} width={200} height={77} alt={"Get it on Google Play"} loading={"lazy"} />
          </a>
          <span className={"fine-print"}>{"Official listing · Availability may vary by region."}</span>
        </article>
        <article className="download-card windows-card">
          <div className="windows-copy">
            <span className="available">WINDOWS</span>
            <h2>Meldiq for Windows</h2>
            <p>Your conversations, in a dedicated desktop app.</p>
            <a className="button primary" href={WINDOWS_DOWNLOAD.href} download={WINDOWS_DOWNLOAD.filename}>
              Download for Windows
              <svg className="icon" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
              </svg>
            </a>
            <p className="fine-print">
              64-bit · Version {WINDOWS_DOWNLOAD.version} · {WINDOWS_DOWNLOAD.sizeLabel}
            </p>
            <details className="windows-release-info">
              <summary>Release information</summary>
              <p>Updates download automatically and install when you safely quit the app. Update authenticity is verified with Meldiq’s release key.</p>
              <p>
                Windows publisher signing is not configured, so Windows may show an unknown publisher. If you installed version 0.1.0, install this version once
                to enable automatic updates.
              </p>
              <a href={WINDOWS_DOWNLOAD.checksumHref}>SHA-256 checksum</a>
              <a href={WINDOWS_DOWNLOAD.releaseHref}>Build details</a>
            </details>
          </div>
          <div className="windows-art" aria-hidden="true">
            <div className="windows-titlebar">
              <span />
              <span />
              <span />
            </div>
            <img src="/assets/meldling-128.png" width={100} height={100} alt="" loading="lazy" decoding="async" />
            <strong>
              Your people.
              <br />
              On your desktop.
            </strong>
          </div>
        </article>
      </section>
      <section className={"coming-section wrap"}>
        <div className={"section-heading"}>
          <span className={"eyebrow"}>{"A FEW MORE PLACES TO CALL HOME."}</span>
          <h2>
            {"Next on the "}
            <em>{"horizon."}</em>
          </h2>
          <p>{"Native apps are planned for these platforms. We’ll share more when they’re ready."}</p>
        </div>
        <div className={"three-grid planned-apps"}>
          <article className={"coming-card"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"6"} y={"2"} width={12} height={20} rx={"3"}></rect>
              <path d={"M10 18h4"}></path>
            </svg>
            <h3>{"iPhone & iPad"}</h3>
            <span className={"coming-badge"}>{"Coming soon"}</span>
            <p>{"Not available yet. No release date announced."}</p>
          </article>
          <article className={"coming-card"}>
            <svg
              className={"icon"}
              width={24}
              height={24}
              viewBox={"0 0 24 24"}
              fill={"none"}
              stroke={"currentColor"}
              strokeWidth={"1.7"}
              strokeLinecap={"round"}
              strokeLinejoin={"round"}
              aria-hidden={"true"}
            >
              <rect x={"2"} y={"3"} width={20} height={14} rx={"3"}></rect>
              <path d={"M8 21h8M12 17v4m-4-11 4-4 4 4M12 6v7"}></path>
            </svg>
            <h3>{"macOS"}</h3>
            <span className={"coming-badge"}>{"Coming soon"}</span>
            <p>{"Not available yet. No release date announced."}</p>
          </article>
        </div>
        <p className={"center muted"}>
          {"Until then, your browser is an open door. "}
          <a href={"https://web.meldiq.app/"}>{"Use Meldiq on the web ↗"}</a>
        </p>
      </section>
      <FinalCta />
    </Layout>
  );
}
