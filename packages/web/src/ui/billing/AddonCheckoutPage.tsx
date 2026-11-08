import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { useEngine, useOrbit } from "../../application/orbit";
import { setPrefs } from "../../application/prefs";
import { navigate } from "../../application/router";
import { type PayPalConfig, type PayPalPurchase, zPayPalCheckout, zPayPalConfig } from "../../api/paypalSchemas";
import { BrandMark } from "../components/BrandMark";
import { money } from "../mojo/mojoFormat";
import { type CheckoutDraft, readCheckout, selectCheckout, writeCheckout } from "./checkoutDraft";
import { CheckoutPayment } from "./CheckoutPayment";

type Addon = Extract<CheckoutDraft, { product: "spark" | "bots_plus" }>;

export function AddonCheckoutPage({ draft, initial }: { draft: Addon; initial: ReturnType<typeof readCheckout> }) {
  const engine = useEngine();
  const online = useOrbit((s) => s.connection === "online");
  const catalog = useOrbit((s) => s.mojo.catalog);
  const community = useOrbit((s) => (draft.product === "bots_plus" ? (s.orgs.find((org) => org.id === draft.orgId)?.name ?? "this community") : null));
  const saved = useRef(initial);
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [purchase, setPurchase] = useState<PayPalPurchase | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const spark = draft.product === "spark";
  const quantity = spark ? draft.quantity : 1;
  const price = spark ? catalog?.onSale.spark : catalog?.onSale.botsPlus;
  const amount = purchase?.amountMinor ?? (price?.amountMinor ?? 0) * quantity;
  const title = spark ? `${quantity} Meldiq Spark${quantity === 1 ? "" : "s"}` : "Meldiq Bots+";
  const product = draft.product;
  const orgId = draft.product === "bots_plus" ? draft.orgId : null;
  const remember = useCallback(
    (p: PayPalPurchase) => {
      saved.current = {
        ...saved.current,
        purchaseId: p.id,
        completed: p.confirmed || ["expired", "failed", "refunded", "canceled", "incomplete_expired"].includes(p.status),
      };
      writeCheckout(engine.device.userId, saved.current);
      setPurchase(p);
    },
    [engine],
  );
  const validate = useCallback(
    (p: PayPalPurchase) => {
      if (p.product !== product || p.currency !== "USD" || (product === "spark" && p.quantity !== quantity) || (product === "bots_plus" && p.orgId !== orgId)) {
        throw new Error("The order changed. Return to the product page and review a new checkout.");
      }
      return p;
    },
    [product, quantity, orgId],
  );

  useEffect(() => {
    let active = true;
    void engine.api
      .json("GET", "/v2/billing/paypal/config", zPayPalConfig)
      .then((value) => active && setConfig(value))
      .catch(() => active && setError("Secure checkout could not load. Try again."));
    return () => {
      active = false;
    };
  }, [engine, attempt]);

  useEffect(() => {
    let active = true;
    if (saved.current.purchaseId)
      void engine.api
        .json("GET", `/v2/billing/paypal/checkouts/${encodeURIComponent(saved.current.purchaseId)}`, zPayPalCheckout)
        .then((value) => {
          if (active) remember(validate(value));
        })
        .catch(() => active && setError("This checkout could not be resumed. Review its status in Billing."));
    return () => {
      active = false;
    };
  }, [engine, attempt, remember, validate]);

  const check = useCallback(
    async (capture: boolean) => {
      const id = saved.current.purchaseId;
      if (!id) return;
      setChecking(true);
      try {
        const result = validate(
          await engine.api.json(capture ? "POST" : "GET", `/v2/billing/paypal/checkouts/${encodeURIComponent(id)}${capture ? "/confirm" : ""}`, zPayPalCheckout, capture ? { body: {} } : undefined),
        );
        remember(result);
        if (result.confirmed) {
          setAwaiting(false);
          await engine.mojo.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Payment confirmation could not be checked.");
      } finally {
        setChecking(false);
      }
    },
    [engine, remember, validate],
  );
  useEffect(
    () =>
      window.meldiqDesktop?.onCheckout((result) => {
        if (result.kind === "closed" || result.canceled) setError("Checkout closed. Check the saved purchase status before trying again.");
        void check(result.kind === "returned" && !result.canceled);
      }),
    [check],
  );
  useEffect(() => {
    if (!awaiting || purchase?.confirmed) return;
    let stopped = false;
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (stopped || ++count > 15) return;
      await check(false);
      if (!stopped) timer = setTimeout(() => void poll(), 2000);
    };
    timer = setTimeout(() => void poll(), 2000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [awaiting, purchase?.confirmed, check]);

  const create = async () => {
    setError(null);
    if (!accepted || !online || !price) throw new Error("Review the order before paying.");
    const current = saved.current;
    const result = validate(
      current.purchaseId
        ? await engine.api.json("GET", `/v2/billing/paypal/checkouts/${encodeURIComponent(current.purchaseId)}`, zPayPalCheckout)
        : await engine.api.json("POST", "/v2/billing/paypal/checkouts", zPayPalCheckout, { body: { ...draft, requestKey: current.requestKey } }),
    );
    remember(result);
    if (["expired", "failed", "refunded", "canceled", "incomplete_expired"].includes(result.status) && !result.confirmed) throw new Error("This checkout has ended. Start a new checkout to continue.");
    if (result.confirmed) throw new Error("This purchase is already confirmed. Open Billing to view it.");
    if (result.amountMinor !== amount) {
      setAccepted(false);
      throw new Error("Review the saved price and accept the terms again before paying.");
    }
    return result;
  };

  const closed = purchase && !purchase.confirmed && ["expired", "failed", "refunded", "canceled", "incomplete_expired"].includes(purchase.status);
  const available = spark ? config?.sparks : config?.botsPlus;
  const back = () => {
    if (draft.product === "bots_plus") {
      setPrefs({ orgId: draft.orgId });
      navigate({ section: "workspace", workspacePage: "bots" });
    } else navigate({ section: "settings", settingsPage: "spark" });
  };

  return (
    <div className="meldiq-checkout">
      <header className="checkout-brand">
        <a href="/settings/billing" className="checkout-logo">
          <BrandMark size={34} />
          <strong>Meldiq</strong>
        </a>
        <span>
          <LockKeyhole size={14} aria-hidden="true" /> Secure checkout
        </span>
      </header>
      <button className="btn btn-ghost btn-sm checkout-back" onClick={back}>
        <ArrowLeft size={15} aria-hidden="true" /> Back to {spark ? "Sparks" : "Bots"}
      </button>
      {purchase?.confirmed ? (
        <section className="checkout-success" role="status">
          <CheckCircle2 size={52} aria-hidden="true" />
          <h1>{spark ? "Your Sparks are ready." : "Bots+ is active."}</h1>
          <p>{spark ? "Choose a community to boost. Your purchased Sparks do not renew or expire." : `Premium bot features are now available for ${community}.`}</p>
          <button className="btn btn-primary" onClick={back}>
            {spark ? "Use your Sparks" : "Open community bots"}
          </button>
        </section>
      ) : (
        <>
          <div className="checkout-title">
            <span className="checkout-kicker">MELDIQ CHECKOUT</span>
            <h1>{title}</h1>
            <p>{spark ? "Boost communities with a one-time purchase. No Meldiq Plus subscription is required." : `Premium community bots for ${community}, purchased separately from Meldiq Plus.`}</p>
          </div>
          <div className="checkout-layout">
            <CheckoutPayment
              config={config}
              accepted={accepted}
              onAccept={setAccepted}
              attempt={attempt}
              unavailable={
                closed
                  ? "This checkout has ended."
                  : !online
                    ? "You’re offline. Reconnect to continue."
                    : (catalog && !price) || (config && !available)
                      ? "This product is unavailable for checkout."
                      : !price
                        ? "Loading purchase details…"
                        : null
              }
              payment={{
                subscription: !spark,
                create,
                approve: async () => {
                  setAwaiting(true);
                  await check(true);
                },
                cancel: () => setError("Checkout was canceled. Check the saved purchase status before trying again."),
                fail: setError,
              }}
            >
              {error && (
                <p className="banner danger" role="alert">
                  {error}
                </p>
              )}
              {awaiting && (
                <p className="checkout-notice" role="status">
                  Waiting for payment confirmation…
                </p>
              )}
              {saved.current.purchaseId && (
                <button className="btn btn-secondary checkout-check" disabled={checking || !online} onClick={() => void check(false)}>
                  {checking ? "Checking…" : "Check payment status"}
                </button>
              )}
              {closed && (
                <button className="btn btn-secondary checkout-check" onClick={() => selectCheckout(engine.device.userId, draft)}>
                  Start a new checkout
                </button>
              )}
              {error && !closed && (
                <button
                  className="btn btn-ghost checkout-check"
                  onClick={() => {
                    setError(null);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Retry checkout
                </button>
              )}
            </CheckoutPayment>
            <aside className="checkout-card checkout-summary" aria-labelledby="checkout-summary-title">
              <h2 id="checkout-summary-title">Order summary</h2>
              <div className="checkout-item">
                <span className="checkout-item-icon">{spark ? <Sparkles size={22} aria-hidden="true" /> : <Bot size={22} aria-hidden="true" />}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{spark ? "One-time purchase" : community}</p>
                </div>
                <strong>{purchase || price ? money(amount, "USD") : "—"}</strong>
              </div>
              <dl className="checkout-breakdown">
                <div className="checkout-total">
                  <dt>
                    {spark ? "Total" : "Total today"}
                    <small>{spark ? "One-time purchase" : "Renews monthly"}</small>
                  </dt>
                  <dd>
                    {purchase || price ? money(amount, "USD") : "—"}
                    <small>USD</small>
                  </dd>
                </div>
              </dl>
              <p className="checkout-renewal">
                {spark
                  ? "Purchased Sparks do not renew or expire."
                  : purchase || price
                    ? `Renews monthly at ${money(amount, "USD")} USD until canceled in Billing.`
                    : "Renews monthly until canceled in Billing."}
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
