import { paymentDetails, rememberPayment, requireLiveSitePayment, startPayment, type PaymentDetails } from "../lib/payments";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ApiError, type Offer } from "../lib/api";

import { billingPeriod, formatDate, formatMoney } from "../lib/money";
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
  const id = useId();
  const period = billingPeriod(offer.interval, offer.billingFrequency);
  return (
    <article className={`plan${featured ? " featured" : ""}`} aria-labelledby={id}>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <h3 id={id} style={{ margin: 0 }}>
          {offer.name}
          {offer.term && offer.term !== "monthly" ? ` · ${offer.term}` : ""}
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
          {formatMoney(offer.amountMinor, offer.currency)} <small>/ {period}</small>
        </div>
        <div className="muted" style={{ fontSize: "0.88rem" }}>
          {offer.currency.toUpperCase()}, billed every {period}. The subscription renews automatically. No tax is added.
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    setPayment(null);
    setAgreed(false);
    paymentDetails(browserSession())
      .then((details) => {
        requireLiveSitePayment(details.mode, window.location.hostname);
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
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function start() {
    if (!payment || !agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
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
        interval: offer.interval,
        billingFrequency: offer.billingFrequency,
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

  const paypal = payment?.provider === "paypal";
  const providerName = paypal ? "PayPal" : "Stripe";
  const price = formatMoney(offer.amountMinor, offer.currency);
  const deferred = payment && (payment.billingStartAt || (firstSubscription && offer.trialDays > 0));

  return (
    <dialog
      ref={dialog}
      className="dialog subscription-checkout"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="subscription-checkout-header">
        <div>
          <p className="muted">Secure checkout</p>
          <h2 id={titleId}>Get {offer.name}</h2>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </header>
      <div className="subscription-checkout-grid">
        <section className="subscription-summary" aria-label="Order summary">
          <h3>Order summary</h3>
          <dl>
            <div>
              <dt>{offer.name}</dt>
              <dd>
                {price} / {billingPeriod(offer.interval, offer.billingFrequency)}
              </dd>
            </div>
            <div className="subscription-summary-total">
              <dt>Due today</dt>
              <dd>{payment ? `${offer.currency.toUpperCase()} ${deferred ? formatMoney(0, offer.currency) : price}` : "—"}</dd>
            </div>
          </dl>
          {payment?.billingStartAt ? <p className="muted">First payment on {formatDate(payment.billingStartAt)}.</p> : null}
        </section>
        <form
          className="subscription-payment"
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
        >
          <h3>Payment method</h3>
          {payment ? (
            <>
              <div className="subscription-method">
                <strong>{providerName}</strong>
                {paypal ? <img src="/paypal-wordmark.svg" alt="" width="63" height="23" /> : null}
              </div>
              <p className="muted">Payment is handled securely by {providerName} on its own page.</p>
            </>
          ) : !error ? (
            <p className="muted" role="status">
              Loading secure payment details…
            </p>
          ) : null}
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
          <label className="check">
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
            <div className="callout danger" role="alert">
              <p>{error}</p>
              {!payment ? (
                <button type="button" className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
                  Retry payment details
                </button>
              ) : null}
            </div>
          ) : null}
          <button type="submit" className={`btn btn-block ${paypal ? "btn-paypal" : "btn-primary"}`} disabled={!agreed || busy || !payment}>
            {busy ? "Opening secure checkout…" : paypal ? "Continue to PayPal" : "Continue to payment"}
          </button>
        </form>
      </div>
    </dialog>
  );
}
