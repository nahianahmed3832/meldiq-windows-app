import { forgetPayment, pendingPayment, paymentUrl, verifyPayment, zPayPalCanceled, type PendingPayment } from "../../lib/payments";
import { useMojoCatalog } from "../../lib/catalog";
import { subscriptionOffers } from "../../lib/subscription";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AccountShell, LoadingCard } from "../../components/AccountShell";
import { CheckoutDialog, PlanCard } from "../../components/Plans";
import { useAuthedData, useRequireSession } from "../../components/useAccount";
import { ApiError, billingNotDeployed, type Offer, zOwnerBilling, zPortal } from "../../lib/api";
import { formatDate, formatMoney, formatPrice } from "../../lib/money";
import { statusLabel } from "../../lib/plans";
import { browserSession } from "../../lib/session";

/** How long to wait for the payment provider's confirmation after coming back from Checkout before saying it may take longer. */
const CONFIRM_TIMEOUT_MS = 45_000;
const CONFIRM_POLL_MS = 6_000;

type Confirm = "idle" | "waiting" | "confirmed" | "scheduled" | "slow" | "canceled";

/**
 * The signed-in account's billing page (Mojo Plus: Mojo Plus, personal plans). Everything shown comes from the
 * server; coming back from checkout with ?checkout=success grants nothing by itself: the page asks the server to read
 * the subscription from the provider and waits until the server says the plan applies.
 */
export default function Billing() {
  const router = useRouter();
  const session = useRequireSession();
  const path = "/v2/billing/account";
  const billing = useAuthedData(session && router.isReady ? session : null, () => browserSession().authed(path, zOwnerBilling), path);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  useEffect(() => {
    if (session) setPending(pendingPayment(sessionStorage, session.account.id));
  }, [session]);
  const [confirm, setConfirm] = useState<Confirm>("idle");
  const [chosen, setChosen] = useState<Offer | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const [confirmationAttempt, setConfirmationAttempt] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // A return URL never proves payment; reconcile the checkout owned by this account.
  useEffect(() => {
    if (!session || !router.isReady) return;
    const outcome = router.query.checkout;
    if (outcome === "canceled") {
      setConfirm("canceled");
      return;
    }
    if (outcome !== "success") return;
    setConfirm("waiting");
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const poll = async () => {
      if (!live) return;
      try {
        const result = await verifyPayment(browserSession(), pendingPayment(sessionStorage, session.account.id));
        if (!live) return;
        if (result === "confirmed" || result === "scheduled") {
          setConfirm(result);
          forgetPayment(sessionStorage);
          setPending(null);
          billing.reload();
          return;
        }
      } catch {
        /* Keep pending until the server verifies it; never claim a successful charge. */
      }
      if (!live) return;
      if (Date.now() - started > CONFIRM_TIMEOUT_MS) setConfirm("slow");
      else timer = setTimeout(poll, CONFIRM_POLL_MS);
    };
    void poll();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, router.isReady, router.query.checkout, confirmationAttempt]);

  function resumePayment() {
    if (!pending?.approvalUrl) return;
    try {
      window.location.assign(paymentUrl(pending.approvalUrl, pending));
    } catch (e) {
      setPortalError(e instanceof ApiError ? e.message : "Checkout could not be resumed. Check your payment status.");
    }
  }

  async function cancelSubscription() {
    setCancelBusy(true);
    setCancelError(null);
    setCancelMessage(null);
    try {
      const result = await browserSession().authed("/v2/billing/paypal/cancel", zPayPalCanceled, { method: "POST", body: { confirm: true } });
      setCancelMessage(
        result.confirmed
          ? `Renewal is canceled.${result.accessUntil ? ` Your paid access continues until ${formatDate(result.accessUntil)}.` : " Your billing status is shown below."}`
          : "Cancellation is awaiting PayPal confirmation. Check your billing status before trying again.",
      );
      setCancelRequested(false);
      billing.reload();
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : "Cancellation could not be confirmed. Check your billing status and try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function openPortal() {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { url } = await browserSession().authed("/v2/billing/portal", zPortal, { method: "POST", body: {} });
      if (!url.startsWith("https://")) throw new ApiError(0, "bad_url", "The billing portal couldn't be opened.");
      window.location.assign(url);
    } catch (e) {
      setPortalBusy(false);
      setPortalError(e instanceof ApiError ? e.message : "The billing portal couldn't be opened. Try again.");
    }
  }

  const mojoLoad = useMojoCatalog();
  const b = billing.data;
  const offers = b?.available ? subscriptionOffers(b.offers, mojoLoad.state === "ready" ? mojoLoad.mojo : null) : [];
  const sub = b?.subscription ?? null;

  return (
    <AccountShell title="Billing">
      {b?.mode === "test" ? (
        <div className="test-banner" role="status" style={{ borderRadius: 8 }}>
          Test payments only. No real money is charged.
        </div>
      ) : null}
      <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Your billing</h1>

      {confirm === "waiting" ? (
        <div className="callout info" role="status" aria-live="polite">
          <p>
            <strong>Confirming your payment…</strong> Your plan starts as soon as the payment provider confirms it. This usually takes a few seconds.
          </p>
        </div>
      ) : null}
      {confirm === "confirmed" ? (
        <div className="callout success" role="status">
          <p>Your subscription is active. It now applies on every device signed in to your account.</p>
        </div>
      ) : null}
      {confirm === "slow" ? (
        <div className="callout warning" role="status">
          <p>
            Your payment has not been confirmed yet. Some payment methods take longer. Your plan will start once it&apos;s confirmed: check this page again
            later. Check this status before starting another checkout.
          </p>
        </div>
      ) : null}
      {confirm === "scheduled" ? (
        <div className="callout success" role="status">
          <p>PayPal confirmed your subscription approval. Your existing free Plus days continue, and your first payment is scheduled for when they end.</p>
        </div>
      ) : null}
      {confirm === "slow" ? (
        <button type="button" className="btn btn-secondary" onClick={() => setConfirmationAttempt((n) => n + 1)}>
          Check payment status again
        </button>
      ) : null}
      {confirm === "canceled" ? (
        <div className="callout info" role="status">
          <p>Checkout was closed. Check your subscription status below before trying again.</p>
        </div>
      ) : null}

      {pending?.provider === "paypal" &&
      pending.approvalUrl &&
      (pending.expiresAt ?? 0) > Date.now() &&
      (!billing.data?.subscription || billing.data.subscription.status === "incomplete") &&
      confirm !== "waiting" ? (
        <div className="callout info">
          <p>You have an unfinished PayPal checkout. Resume it or check its status before starting another payment.</p>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={resumePayment}>
              Resume PayPal checkout
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (router.query.checkout === "success") setConfirmationAttempt((n) => n + 1);
                else void router.replace("/account/billing?checkout=success");
              }}
            >
              Check payment status
            </button>
          </div>
        </div>
      ) : null}
      {billing.loading && !b ? <LoadingCard /> : null}
      {billingNotDeployed(billing.error) ? (
        <section className="card">
          <div className="row">
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Mojo Plus</h2>
            <span className="badge">Free</span>
          </div>
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Your account is on the free tier. Mojo Plus isn&apos;t on sale yet: <Link href="/pricing">see the prices</Link>.
          </p>
        </section>
      ) : billing.error ? (
        <div className="callout danger" role="alert">
          <p>{billing.error.message}</p>
          <Link href="/account">Back to your account</Link>
        </div>
      ) : null}

      {b ? (
        <>
          <section className="card">
            <div className="row">
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Mojo Plus</h2>
              {sub ? (
                <span className={`badge ${sub.standing === "entitled" ? "success" : sub.standing === "grace" ? "warning" : "danger"}`}>
                  {confirm === "scheduled" ? "Approved · billing scheduled" : statusLabel(sub.status)}
                </span>
              ) : (
                <span className="badge">Free</span>
              )}
            </div>
            {sub ? (
              <>
                <dl className="kv" style={{ marginTop: 16 }}>
                  <dt>Plan</dt>
                  <dd>{sub.plan.name}</dd>
                  <dt>Price</dt>
                  <dd>{formatPrice(sub.amountMinor, sub.currency, sub.interval)}</dd>
                  {sub.trialEnd && sub.status === "trialing" ? (
                    <>
                      <dt>Trial ends</dt>
                      <dd>{formatDate(sub.trialEnd)}</dd>
                    </>
                  ) : null}
                  {sub.currentPeriodEnd ? (
                    <>
                      <dt>{sub.cancelAtPeriodEnd ? "Ends on" : "Renews on"}</dt>
                      <dd>{formatDate(sub.currentPeriodEnd)}</dd>
                    </>
                  ) : null}
                </dl>
                {sub.standing === "grace" || sub.standing === "grace_ended" ? (
                  <div className="callout warning" style={{ marginTop: 16 }}>
                    <p>A payment failed. Update your payment method with your payment provider so the plan continues.</p>
                  </div>
                ) : null}
                {sub.cancelAtPeriodEnd ? (
                  <p className="muted" style={{ marginTop: 16 }}>
                    Canceled: you keep the plan until the date above and won&apos;t be charged again.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="muted" style={{ marginTop: 12 }}>
                Your account is on the free tier.
              </p>
            )}
            {b.portal ? (
              <div style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={openPortal} disabled={portalBusy}>
                  {portalBusy ? "Opening…" : "Manage payment method, invoices and cancellation"}
                </button>
                <p className="muted" style={{ fontSize: "0.88rem", marginTop: 8 }}>
                  Opens your payment provider&apos;s billing portal. You can change your card, download invoices, switch plans where offered, or cancel.
                </p>
              </div>
            ) : null}
            {b.provider === "paypal" && sub && !sub.cancelAtPeriodEnd && sub.status !== "canceled" ? (
              <div className="stack" style={{ marginTop: 20 }}>
                <p className="muted">Paid securely with PayPal. Manage your funding method in your PayPal account, or cancel renewal here.</p>
                {cancelRequested ? (
                  <div className="callout warning">
                    <p>
                      Cancel automatic renewal? You keep any time you have already paid for. Future renewal payments will stop once PayPal confirms
                      cancellation.
                    </p>
                    <div className="row">
                      <button type="button" className="btn btn-secondary" disabled={cancelBusy} onClick={() => setCancelRequested(false)}>
                        Keep subscription
                      </button>
                      <button type="button" className="btn btn-primary" disabled={cancelBusy} onClick={cancelSubscription}>
                        {cancelBusy ? "Canceling renewal…" : "Confirm cancellation"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={() => setCancelRequested(true)}>
                    Cancel subscription
                  </button>
                )}
              </div>
            ) : null}
            {cancelMessage ? (
              <div className="callout info" role="status">
                <p>{cancelMessage}</p>
              </div>
            ) : null}
            {cancelError ? (
              <div className="callout danger" role="alert">
                <p>{cancelError}</p>
              </div>
            ) : null}
            {portalError ? (
              <div className="callout danger" role="alert" style={{ marginTop: 12 }}>
                <p>{portalError}</p>
              </div>
            ) : null}
          </section>

          {!sub ? (
            <section className="stack">
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Choose Mojo Plus</h2>
              {!b.available ? (
                <div className="empty">
                  <p>Mojo Plus isn&apos;t on sale yet. Everything Meldiq does today is free.</p>
                </div>
              ) : offers.length === 0 ? (
                <div className="empty">
                  <p>Mojo Plus isn&apos;t on sale yet.</p>
                </div>
              ) : (
                <div className="plan-grid">
                  {offers.map((o) => (
                    <PlanCard key={o.key} offer={o} onChoose={setChosen} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="card">
            <h2 style={{ fontSize: "1.3rem" }}>Invoices</h2>
            {b.invoices.length === 0 ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                No invoices yet.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="compare">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.invoices.map((i) => (
                      <tr key={`${i.issuedAt}-${i.amountDueMinor}`}>
                        <td>{formatDate(i.issuedAt)}</td>
                        <td>
                          {formatMoney(i.amountPaidMinor || i.amountDueMinor, i.currency)}
                          {i.amountRefundedMinor > 0 ? <span className="muted"> ({formatMoney(i.amountRefundedMinor, i.currency)} refunded)</span> : null}
                        </td>
                        <td>{statusLabel(i.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted" style={{ fontSize: "0.88rem", marginTop: 12, marginBottom: 0 }}>
              PayPal payments appear here after confirmation. PayPal also provides payment receipts in your PayPal account. Receipts for earlier payment
              providers remain with those providers.
            </p>
          </section>
        </>
      ) : null}

      {chosen ? <CheckoutDialog offer={chosen} firstSubscription={b ? b.invoices.length === 0 : true} onClose={() => setChosen(null)} /> : null}
    </AccountShell>
  );
}
