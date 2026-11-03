import Link from "next/link";
import { useCatalog, useMojoCatalog, mojoOf } from "../lib/catalog";
import { subscriptionOffers } from "../lib/subscription";
import { ANNOUNCED_PLANS } from "../lib/site";
import { formatMoney } from "../lib/money";

export function PlusSpotlight() {
  const load = useCatalog();
  const catalog = useMojoCatalog();
  const mojo = mojoOf(catalog);
  const offer =
    load.state === "ready" && load.catalog.available ? subscriptionOffers(load.catalog.plans, catalog.state === "ready" ? catalog.mojo : null)[0] : undefined;
  const plan = offer ?? ANNOUNCED_PLANS[0];
  return (
    <section className="plus-spotlight wrap" aria-labelledby="home-plus-heading">
      <div>
        <span className="ref-kicker">A LITTLE EXTRA, IF YOU WANT IT</span>
        <h2 id="home-plus-heading">
          Free at heart.
          <br />
          <em>Plus by choice.</em>
        </h2>
        <p>Your everyday conversations stay free. Meldiq Plus adds more room to share and helps support the service.</p>
        <Link className="inline-link" href="/pricing">
          Compare Free and Plus <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="plus-spotlight-price">
        <span className="plus-symbol" aria-hidden="true">
          ✦
        </span>
        <span className="plan-label">MELDIQ PLUS</span>
        <p>
          {formatMoney(plan.amountMinor, plan.currency)}
          <small> / month</small>
        </p>
        <span className="muted">{offer ? "USD · Renews monthly until canceled" : "Announced price · Check availability"}</span>
        <div className="plus-spotlight-perks">
          <span>Files up to 1 GB</span>
          <span>One account, every supported device</span>
          {mojo?.enforced ? <span>{mojo.plans.find((p) => p.key === "plus")?.sparks ?? 0} Sparks included</span> : null}
        </div>
        <Link className="button primary" href="/pricing">
          Explore Plus <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
