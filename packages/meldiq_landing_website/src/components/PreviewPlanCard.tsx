import { ANNOUNCED_PLANS } from "../lib/site";
import { formatMoney } from "../lib/money";
import type { MojoCatalog } from "../lib/api";
import type { CatalogLoad } from "../lib/catalog";
import { tierPerks, freeDaysBadge } from "./Mojo";

export function PreviewPlanCard({ planKey, load, mojo }: { planKey: string; load: CatalogLoad; mojo: MojoCatalog | null }) {
  const plan = ANNOUNCED_PLANS[0];
  const name = plan.name;
  const badge = freeDaysBadge(load, planKey);
  const perks = tierPerks(mojo, planKey);
  return (
    <article className={`plan${planKey === "plus" ? " featured" : ""}`} aria-labelledby={`preview-${planKey}`}>
      <span className="plan-label">OPTIONAL ACCOUNT EXTRAS</span>
      <h3 id={`preview-${planKey}`}>{name}</h3>
      <div className="price preview-price">
        {formatMoney(plan.amountMinor, plan.currency)} <small>/ month</small>
      </div>
      <p className="muted">
        {load.state === "ready"
          ? "Updated plan · USD, billed monthly when available. Not on sale yet."
          : "Updated plan · USD, billed monthly when available. Check availability before subscribing."}
      </p>
      {perks.length > 0 ? (
        <>
          <span className="fine-print">{mojo?.enforced === true ? "Account benefits" : "Updated plan preview · Not active yet"}</span>
          <ul className="checklist">
            {perks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="checklist">
          <li>Files up to 1 GB each</li>
          <li>One subscription across supported devices</li>
        </ul>
      )}
      <div className="plan-foot">
        {badge ? (
          <>
            <span className="badge accent">{badge}</span>
            <a className="btn btn-primary btn-block" href="/signup">
              Try it free
            </a>
            <p className="fine-print">No card needed. Trial ends by itself.</p>
          </>
        ) : (
          <a className="btn btn-secondary btn-block" href="/account/billing">
            Check availability
          </a>
        )}
      </div>
    </article>
  );
}
