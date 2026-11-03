import type { MojoCatalog } from "../lib/api";
import { formatMoney } from "../lib/money";
import { SITE } from "../lib/site";

/** Read-only comparison; the existing checkout sells the approved monthly offer. */
export function BillingTerms({ mojo, monthlyAvailable }: { mojo: MojoCatalog | null; monthlyAvailable: boolean }) {
  if (!mojo?.plusTerms?.length) return null;
  return (
    <section className="billing-terms" aria-labelledby="billing-terms-heading">
      <div className="terms-heading">
        <span className="ref-kicker">BILLING OPTIONS</span>
        <h2 id="billing-terms-heading">The same Plus. Your preferred rhythm.</h2>
        <p>Prices and availability match the Meldiq app. All amounts are in the currency shown.</p>
      </div>
      <div className="term-grid">
        {mojo.plusTerms.map((term) => {
          const available = term.available && monthlyAvailable;
          return (
            <article className={`term-card${available ? " term-available" : ""}`} key={term.key}>
              <div className="term-top">
                <h3>{term.key === "monthly" ? "Monthly" : term.key === "quarterly" ? "Quarterly" : "Yearly"}</h3>
                <span className="term-status">{available ? "Available" : "Not available yet"}</span>
              </div>
              <p className="term-price">
                {formatMoney(term.amountMinor, term.currency)} <small>{term.currency}</small>
              </p>
              <p>{term.months === 1 ? "Billed every month" : `Billed every ${term.months} months`}</p>
              <span className="fine-print">
                {available ? "Renews automatically until canceled." : "Configured price. Purchases are currently unavailable."}
              </span>
              {available ? (
                <a className="inline-link" href={term.key === "monthly" ? "#plans" : SITE.webAppUrl}>
                  {term.key === "monthly" ? "Choose monthly above ↑" : "Review this option in Meldiq ↗"}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
