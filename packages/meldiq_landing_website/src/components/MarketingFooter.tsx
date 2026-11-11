import { AnalyticsChoice } from "./AnalyticsChoice";
import { FOOTER, FOOTER_NOTE } from "../content/navigation";

export function MarketingFooter({ minimal = false, analyticsPath }: { minimal?: boolean; analyticsPath?: string }) {
  return (
    <footer lang="en" className={`site-footer${minimal ? " compact-footer" : ""}`}>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="brand" href="/" aria-label="Meldiq home">
            <img src="/meldling-128.png" width={34} height={34} alt="" loading="lazy" />
            <span>
              meldiq<span className="brand-dot">.</span>
            </span>
          </a>
          <p>{FOOTER_NOTE}</p>
          <a className="footer-app-link" href="https://web.meldiq.app">
            Open Meldiq <span aria-hidden="true">↗</span>
          </a>
        </div>
        {FOOTER.map((column) => (
          <div className="footer-col" key={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 GRIIPBUDDY LLC.</span>
        <span>Core messaging is free. Your people are welcome.</span>
        <div className="footer-controls">
          {analyticsPath ? <AnalyticsChoice path={analyticsPath} /> : null}
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
      <div className="footer-wordmark wrap" aria-hidden="true">
        <span>Meldiq</span>
      </div>
    </footer>
  );
}
