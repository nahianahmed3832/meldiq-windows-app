import type { MojoCatalog, Offer } from "../lib/api";
import { billingPeriod, formatMoney } from "../lib/money";

const labels = { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" } as const;

export function BillingTerms({ mojo, offers, onChoose }: { mojo: MojoCatalog | null; offers: Offer[]; onChoose: (offer: Offer) => void }) {
  if (!mojo?.plusTerms?.length)
    return (
      <section className="catalog-placeholder" aria-labelledby="billing-terms-heading">
        <h2 id="billing-terms-heading">Billing options</h2>
        <p>Additional billing intervals are not published. Review the current offer above for its billing period.</p>
      </section>
    );
  return (
    <section className="billing-terms" aria-labelledby="billing-terms-heading">
      <div className="terms-heading">
        <span className="ref-kicker">Billing options</span>
        <h2 id="billing-terms-heading">The same Plus. Your preferred rhythm.</h2>
        <p>Prices and availability match the Meldiq app. All amounts are in the currency shown.</p>
      </div>
      <div className="term-grid">
        {mojo.plusTerms.map((term) => {
          const offer = offers.find((item) => (item.term ?? "monthly") === term.key);
          return (
            <article className={`term-card${offer ? " term-available" : ""}`} key={term.key}>
              <div className="term-top">
                <h3>{labels[term.key]}</h3>
                <span className="term-status">{offer ? "Available" : "Not available yet"}</span>
              </div>
              <p className="term-price">
                {formatMoney(term.amountMinor, term.currency)} <small>{term.currency}</small>
              </p>
              <p>Billed every {billingPeriod(term.interval, term.billingFrequency)}</p>
              <span className="fine-print">{offer ? "Renews automatically until canceled." : "Configured price. Purchases are currently unavailable."}</span>
              {offer &&
                (term.key === "monthly" ? (
                  <a className="inline-link" href="#plans">
                    Choose monthly above ↑
                  </a>
                ) : (
                  <button className="button secondary" type="button" onClick={() => onChoose(offer)}>
                    Choose {labels[term.key].toLowerCase()}
                  </button>
                ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}
