import Link from "next/link";
import { useCatalog, useMojoCatalog } from "../lib/catalog";
import { useOperator } from "../lib/details";
import { isPending } from "../lib/site";
import { subscriptionOffers } from "../lib/subscription";
import { formatMoney } from "../lib/money";

export function SupportContact() {
  const { supportEmail, privacyEmail } = useOperator();
  const hasSupport = !isPending(supportEmail);
  const hasPrivacy = !isPending(privacyEmail);
  return (
    <div className="support-contact">
      {hasSupport ? (
        <p>
          Write to{" "}
          <a className="button text-link" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>{" "}
          for account and product help.
        </p>
      ) : (
        <p>A verified support email has not been published yet. Direct email support is currently unavailable.</p>
      )}
      {hasPrivacy ? (
        <p>
          For privacy and data requests: <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
        </p>
      ) : (
        <p className="fine-print">
          A verified privacy contact is also pending. Read the <Link href="/legal/privacy#rights">Privacy Policy</Link> for the current data-rights information.
        </p>
      )}
    </div>
  );
}
export function MojoAvailability() {
  const load = useCatalog();
  const catalog = useMojoCatalog();
  const shown = load.state === "ready" && load.catalog.available ? subscriptionOffers(load.catalog.plans, catalog.state === "ready" ? catalog.mojo : null) : [];
  return (
    <span className="availability-note">
      {shown.length
        ? shown.map((p) => `${p.name} ${formatMoney(p.amountMinor, p.currency)}/month`).join(" · ")
        : load.state === "ready"
          ? "Meldiq Plus · $4.99/month · Not on sale yet"
          : "Meldiq Plus · $4.99/month · Check current availability"}
    </span>
  );
}
/** Configured previews are never presented as active, enforced entitlements. */
export function CatalogStatus() {
  const load = useCatalog();
  const catalog = useMojoCatalog();
  const available =
    load.state === "ready" && load.catalog.available && subscriptionOffers(load.catalog.plans, catalog.state === "ready" ? catalog.mojo : null).length > 0;
  return (
    <div className="notice">
      <span aria-hidden="true">✦</span>
      <span>
        <strong>
          {available
            ? "Meldiq Plus · $4.99/month · Subscribe securely with PayPal."
            : load.state === "ready"
              ? "Free is available. Meldiq Plus is not on sale yet."
              : "Free is available. Check billing for paid-plan availability."}
        </strong>
        <br />
        {catalog.state === "ready" && catalog.mojo && catalog.mojo.enforced !== true
          ? "Meldiq Plus: $4.99/month with files up to 1 GB each. Updated benefits are a preview until available."
          : "Prices and account benefits are confirmed before checkout."}
      </span>
    </div>
  );
}
