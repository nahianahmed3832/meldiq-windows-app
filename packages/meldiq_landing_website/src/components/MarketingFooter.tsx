import { SITE } from "../lib/site";

export function MarketingFooter({ minimal = false }: { minimal?: boolean }) {
  if (minimal)
    return (
      <footer className="landing-footer wrap">
        <div className="landing-footer-top">
          <a className="brand" href="/" aria-label="Meldiq home">
            <img src="/meldling-128.png" alt="" width={28} height={28} />
            meldiq<span className="brand-dot">.</span>
          </a>
          <span>Private by design. Connected by everyone.</span>
        </div>
        <nav aria-label="Footer navigation">
          {[
            ["Features", "/features"],
            ["Mojo Plus", "/pricing"],
            ["Download", "/download"],
            ["FAQ", "/faq"],
            ["Support", "/support"],
            ["Your account", "/account"],
            ["Billing", "/account/billing"],
            ["Terms", "/legal/terms"],
            ["Privacy", "/legal/privacy"],
            ["Mojo Plus terms", "/legal/billing"],
            ["Acceptable use", "/legal/acceptable-use"],
            ["Account & data", "/legal/account-deletion"],
          ].map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <small>© 2026 GRIIPBUDDY LLC.</small>
      </footer>
    );
  return (
    <footer className={"site-footer"}>
      <div className={"wrap footer-grid"}>
        <div className={"footer-brand"}>
          <a className={"brand"} href={"/"} aria-label={"Meldiq home"}>
            <img className={""} src={"/assets/meldling-128.png"} width={34} height={34} alt={""} fetchPriority={"high"} decoding={"async"} />
            <span>
              {"meldiq"}
              <span className={"brand-dot"}>{"."}</span>
            </span>
          </a>
          <p>
            {"A little space for your people."}
            <br />
            {"Private by design."}
            <br />
            {"Connected by everyone."}
          </p>
          <span className={"footer-tag"}>{"Made for the way you connect."}</span>
        </div>
        <div className={"footer-col"}>
          <h2>{"Explore"}</h2>
          <a href={"/features"}>{"Features"}</a>
          <a href={"/pricing"}>{"Pricing & Mojo Plus"}</a>
          <a href={"/download"}>{"Download"}</a>
          <a href={"/faq"}>{"FAQ"}</a>
          <a href={"/support"}>{"Support"}</a>
        </div>
        <div className={"footer-col"}>
          <h2>{"Your account"}</h2>
          <a href={"/signup"}>{"Create an account"}</a>
          <a href={SITE.webAppUrl}>{"Sign in to Meldiq"}</a>
          <a href={"https://web.meldiq.app/"}>{"Open Meldiq"}</a>
          <a href={"/account/billing"}>{"Manage billing"}</a>
          <a href={"/legal/billing#cancel"}>{"Cancel Mojo Plus"}</a>
        </div>
        <div className={"footer-col"}>
          <h2>{"The important stuff"}</h2>
          <a href={"/legal/terms"}>{"Terms of Service"}</a>
          <a href={"/legal/privacy"}>{"Privacy Policy"}</a>
          <a href={"/legal/billing"}>{"Mojo Plus terms"}</a>
          <a href={"/legal/acceptable-use"}>{"Acceptable Use Policy"}</a>
          <a href={"/legal/account-deletion"}>{"Account deletion & your data"}</a>
        </div>
      </div>
      <div className={"wrap footer-bottom"}>
        <span>{"© 2026 GRIIPBUDDY LLC."}</span>
        <span>
          <img className={""} src={"/assets/meldling-128.png"} width={22} height={22} alt={""} loading={"lazy"} decoding={"async"} />
          {" Say hello to Meldling, our little community companion."}
        </span>
        <a href={"#top"}>{"Back to top ↑"}</a>
      </div>
    </footer>
  );
}
