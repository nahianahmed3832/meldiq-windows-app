import { paymentDetails, rememberPayment, startPayment, type PaymentDetails } from "../lib/payments";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ApiError, type Offer } from "../lib/api";

import { formatMoney, monthlyEquivalent } from "../lib/money";
import { describeLimits, disclosures } from "../lib/plans";
import { browserSession } from "../lib/session";

interface PlanCardProps {
  offer: Offer;
  featured?: boolean;
  onChoose: (offer: Offer) => void;
  /** The button's words (e.g. "Current plan", disabled). */
  action?: { label: string; disabled?: boolean };
  /** What the plan includes, from the Mojo catalog (the home page lists the same); else the offer's own limits. */
  perks?: string[];
}

export function PlanCard({ offer, featured, onChoose, action, perks }: PlanCardProps) {
  const limits = perks && perks.length > 0 ? perks : describeLimits(offer.limits);
  return (
    <article className={`plan${featured ? " featured" : ""}`} aria-labelledby={`plan-${offer.key}`}>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <h3 id={`plan-${offer.key}`} style={{ margin: 0 }}>
          {offer.name}
        </h3>
        {offer.trialDays > 0 ? <span className="badge accent">{offer.trialDays}-day free trial</span> : null}
      </div>
      {offer.description ? (
        <p className="muted" style={{ margin: 0 }}>
          {offer.description}
        </p>
      ) : null}
      <div>
        <div className="price">
          {formatMoney(offer.amountMinor, offer.currency)} <small>/ {offer.interval}</small>
        </div>
        <div className="muted" style={{ fontSize: "0.88rem" }}>
          {offer.currency.toUpperCase()}, billed {offer.interval === "month" ? "monthly" : "yearly"}, renews automatically
          {offer.interval === "year" ? ` (about ${formatMoney(monthlyEquivalent(offer.amountMinor, "year"), offer.currency)} a month)` : ""}. No tax is added:
          the price shown is what you pay.
        </div>
      </div>
      {limits.length > 0 ? (
        <ul className="checklist">
          {limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      <div className="plan-foot">
        <button
          type="button"
          className={`btn ${featured ? "btn-primary" : "btn-secondary"} btn-block`}
          disabled={action?.disabled}
          onClick={() => onChoose(offer)}
        >
          {action?.label ?? `Choose ${offer.name}`}
        </button>
      </div>
    </article>
  );
}

interface CheckoutDialogProps {
  offer: Offer;
  firstSubscription?: boolean;
  onClose: () => void;
}

/**
 * The step before paying: the plan's terms in full (price, currency, renewal, tax, trial, cancellation, failed payments),
 * a required agreement, then the provider's hosted page. The server decides the price and the owner (the signed-in account);
 * this page only names the plan.
 */
export function CheckoutDialog({ offer, firstSubscription = true, onClose }: CheckoutDialogProps) {
  const titleId = useId();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLButtonElement>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    setPayment(null);
    setAgreed(false);
    paymentDetails(browserSession())
      .then((details) => {
        if (live) setPayment(details);
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof ApiError ? e.message : "Payment details could not be loaded. Try again.");
      });
    return () => {
      live = false;
    };
  }, [retry]);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      if (!payment) {
        setBusy(false);
        return;
      }
      // Refuse checkout when this tab cannot retain the reference needed to verify the return.
      const accountId = browserSession().current()?.account.id;
      if (!accountId) throw new ApiError(401, "unauthorized", "Sign in again before subscribing.");
      sessionStorage.setItem("meldiq.site.payment-check", "ok");
      sessionStorage.removeItem("meldiq.site.payment-check");
      const started = await startPayment(offer, payment, browserSession());
      rememberPayment(sessionStorage, {
        accountId,
        checkoutId: started.checkoutId,
        amountMinor: offer.amountMinor,
        provider: started.provider,
        mode: started.mode,
        approvalUrl: started.url,
        expiresAt: started.expiresAt,
      });
      window.location.assign(started.url);
    } catch (e) {
      setBusy(false);
      setError(e instanceof ApiError ? e.message : "The payment page could not be opened. Check your billing status before trying again.");
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} style={{ fontSize: "1.5rem" }}>
          Get {offer.name}
        </h2>
        {payment?.mode === "test" ? (
          <p className="callout info" role="status">
            Test payment · No real money is charged.
          </p>
        ) : null}
        <ul className="checklist plain" aria-label="Terms of this subscription">
          {disclosures(offer, firstSubscription, payment?.billingStartAt ?? null).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: "0.9rem", marginTop: 16 }}>
          {payment
            ? `Payment is handled securely by ${payment.provider === "paypal" ? "PayPal" : "Stripe"} on its own page.`
            : "Loading secure payment details…"}{" "}
          Meldiq never sees or stores your card details. See{" "}
          <Link href="/legal/billing" target="_blank">
            Meldiq Plus terms
          </Link>
          .
        </p>
        <label className="check" style={{ marginTop: 8 }}>
          <input type="checkbox" disabled={!payment || busy} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" target="_blank">
              Terms of Service
            </Link>{" "}
            and the{" "}
            <Link href="/legal/billing" target="_blank">
              subscription terms
            </Link>
            , including automatic renewal until I cancel.
          </span>
        </label>
        {error ? (
          <div className="callout danger" role="alert" style={{ marginTop: 16 }}>
            <p>{error}</p>
            {!payment ? (
              <button type="button" className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
                Retry payment details
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="dialog-actions">
          <button ref={first} type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={start} disabled={!agreed || busy || !payment}>
            {busy ? "Opening secure checkout…" : payment?.provider === "paypal" ? "Continue to PayPal" : "Continue to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
