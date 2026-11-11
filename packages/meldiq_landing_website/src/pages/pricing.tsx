import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { FreeDaysSteps, TrialPill, tierPerks } from "../components/Mojo";
import { CompareTable, SparkLevels } from "../components/MojoCompare";
import { CheckoutDialog, PlanCard } from "../components/Plans";
import { ApiError, type Offer, zEntitlements } from "../lib/api";
import { useCatalog, useMojoCatalog } from "../lib/catalog";
import { subscriptionOffers } from "../lib/subscription";
import { browserSession } from "../lib/session";
import { pricingState } from "../lib/pricingState";

import { FinalCta } from "../components/MarketingArt";
import { SITE } from "../lib/site";
import { formatPrice } from "../lib/money";
import { BillingTerms } from "../components/BillingTerms";

const FREE_INCLUDES = [
  "Communities, channels, threads and forums",
  "Direct messages and private groups",
  "Voice and video calls, voice channels, screen sharing",
  "Encrypted file sharing",
  "Windows, Android and the web, with one account",
];

/**
 * Meldiq's plans: Free, and Meldiq Plus for a person's account. Prices on sale come from the API's catalog (the server
 * decides what is charged); until it has them, the owner-approved prices are shown as announced, without a buy button.
 */
export default function Pricing() {
  const router = useRouter();
  const load = useCatalog();
  const mojoLoad = useMojoCatalog();
  const rawMojo = mojoLoad.state === "ready" ? mojoLoad.mojo : null;
  const mojo = rawMojo ? { ...rawMojo, plans: rawMojo.plans.filter((p) => p.key === "free" || p.key === "plus") } : null;
  const state = pricingState(load, mojoLoad);
  const [chosen, setChosen] = useState<{ offer: Offer; first: boolean } | null>(null);
  const [chooseError, setChooseError] = useState<string | null>(null);

  const offers = useMemo(
    () => (load.state === "ready" && load.catalog.available ? subscriptionOffers(load.catalog.plans, mojoLoad.state === "ready" ? mojoLoad.mojo : null) : []),
    [load, mojoLoad],
  );
  const shown = offers;

  const monthly = shown.find((offer) => !offer.term || offer.term === "monthly");

  const mainOffer = monthly ?? shown[0];
  const botsPlus =
    load.state === "ready" && load.catalog.available
      ? load.catalog.plans.find((offer) => offer.key === "bots_plus" && offer.audience === "organization")
      : undefined;

  async function choose(offer: Offer) {
    setChooseError(null);
    const session = browserSession();
    if (!session.current()) {
      const intent = new URLSearchParams({ plan: offer.key });
      if (offer.term && offer.term !== "monthly") intent.set("term", offer.term);
      window.location.assign(`/login?next=${encodeURIComponent(`/pricing?${intent}`)}`);
      return;
    }
    try {
      const e = await session.authed("/v2/billing/entitlements", zEntitlements);
      // A paid plan already: change it in the portal. A free period (trial, invite) never stops anyone subscribing.
      if (e.personal.plan && !e.personal.trial) {
        setChooseError(`You already have ${e.personal.plan.name}. Change or cancel it from your billing page.`);
        return;
      }
      setChosen({ offer, first: !e.personal.subscription });
    } catch (err) {
      setChooseError(err instanceof ApiError ? err.message : "Your account couldn't be checked. Try again.");
    }
  }

  // Back from signing in with a plan in mind: open it.
  useEffect(() => {
    const key = typeof router.query.plan === "string" ? router.query.plan : null;
    const term = typeof router.query.term === "string" ? router.query.term : "monthly";
    const offer = key ? offers.find((o) => o.key === key && (o.term ?? "monthly") === term) : undefined;
    if (offer && browserSession().current()) {
      void choose(offer);
      void router.replace("/pricing", undefined, { shallow: true });
    }
    // Runs when the catalog arrives with ?plan= in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, router.query.plan, router.query.term]);

  return (
    <Layout
      title="Meldiq Plus"
      description="Compare Free and Meldiq Plus, review current billing options, and explore separate community Bots+, Sparks and gifts. Prices and availability come from the current catalog."
    >
      {load.state === "ready" && load.catalog.mode === "test" ? (
        <div className="test-banner" role="status">
          Test payments only. No real money is charged.
        </div>
      ) : null}
      <section className="interior-hero pricing-intro">
        <div className="wrap">
          <TrialPill load={load} />
          <span className="eyebrow" style={{ display: "block" }}>
            Meldiq Plus
          </span>
          <a href="/" className="breadcrumb">
            Home / Meldiq Plus
          </a>
          <h1>
            Free messaging. <br />
            <em>Optional Meldiq Plus.</em>
          </h1>
          <p>
            Your everyday conversations stay free. Plus adds more room for files, longer messages and account extras, while helping support Meldiq’s servers and
            ongoing development.
          </p>
          <nav className="section-links" aria-label="Pricing sections">
            <a href="#plans">Personal plans</a>
            <a href="#billing-terms-heading">Billing options</a>
            <a href="#compare-heading">Compare benefits</a>
            <a href="#community-extras">Community &amp; gifts</a>
          </nav>
        </div>
      </section>

      <section className="section pricing-plans" id="plans">
        <div className="wrap">
          {chooseError ? (
            <div className="callout warning" role="alert" style={{ marginBottom: 20 }}>
              <p>{chooseError}</p>
            </div>
          ) : null}

          <h2 className="visually-hidden">Personal plans</h2>
          <div className="plan-grid" aria-live="polite" aria-busy={state === "loading"}>
            <article className="plan" aria-labelledby="plan-free">
              <span className="plan-label">THE EVERYDAY ESSENTIALS</span>
              <h3 id="plan-free" style={{ margin: 0 }}>
                Free
              </h3>
              <div className="price">
                $0 <small>no charge</small>
              </div>
              <ul className="checklist">
                {FREE_INCLUDES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="plan-foot">
                <a href="/signup" className="btn btn-secondary btn-block">
                  Create a free account
                </a>
              </div>
            </article>
            {state === "ready" && mainOffer ? (
              <PlanCard offer={mainOffer} featured onChoose={choose} perks={tierPerks(mojo, mainOffer.key)} />
            ) : (
              <article className="plan featured pending-plan" aria-labelledby="plus-state-heading">
                <span className="plan-label">OPTIONAL ACCOUNT EXTRAS</span>
                <h3 id="plus-state-heading">Meldiq Plus</h3>
                {state === "loading" ? (
                  <>
                    <p className="catalog-state" role="status">
                      Checking current plans…
                    </p>
                    <div className="plan-placeholder" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <p>Loading prices, benefits and purchase availability.</p>
                  </>
                ) : state === "error" ? (
                  <>
                    <p className="catalog-state" role="alert">
                      We couldn’t confirm the current offer.
                    </p>
                    <p>Prices or benefits could not be loaded. Try again before choosing a plan.</p>
                    <button className="button secondary" type="button" onClick={() => window.location.reload()}>
                      Retry loading plans
                    </button>
                  </>
                ) : (
                  <>
                    <p className="catalog-state">Plus is currently unavailable to purchase here.</p>
                    <p>
                      The current catalog does not offer a supported subscription for this website. Your existing subscription can still be managed in Billing.
                    </p>
                    <a className="button secondary" href="/account/billing">
                      Manage existing billing
                    </a>
                  </>
                )}
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="section terms-section">
        <div className="wrap">
          {state === "ready" || state === "unavailable" ? (
            <BillingTerms mojo={mojo} offers={shown} onChoose={choose} />
          ) : (
            <div className="catalog-placeholder" id="billing-terms-heading">
              <h2>Billing options</h2>
              <p>{state === "loading" ? "Checking billing intervals…" : "Billing intervals could not be confirmed."}</p>
            </div>
          )}
        </div>
      </section>

      {mojo ? (
        <section className="section" style={{ paddingTop: 0 }} aria-labelledby="compare-heading">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Compare</span>
              <h2 id="compare-heading">
                {mojo.enforced === true ? (
                  <>
                    Your account. <em>Your extras.</em>
                  </>
                ) : (
                  <>
                    Free or <em>Meldiq Plus.</em>
                  </>
                )}
              </h2>
              <p>
                Core messaging is in Free.{" "}
                {mojo.enforced === true
                  ? "These account benefits come from the current catalog."
                  : "The catalog describes these benefits as a preview; enforcement is not confirmed."}
              </p>
            </div>
            <CompareTable mojo={mojo} />
          </div>
        </section>
      ) : null}

      {!mojo ? (
        <section className="interior-section wrap" id="compare-heading">
          <h2>Compare account benefits</h2>
          <p>
            {state === "loading" ? "Loading the current comparison…" : "The benefits catalog could not be loaded. No limits or paid extras can be confirmed."}
          </p>
        </section>
      ) : null}
      <div className="wrap extras-heading" id="community-extras">
        <span className="ref-kicker">Beyond your personal plan</span>
        <h2>A little extra, for others.</h2>
        <p>Community subscriptions, Sparks and gifts are separate from personal Plus. Review each product’s terms in Meldiq.</p>
      </div>
      {botsPlus ? (
        <section className="section alt" aria-labelledby="bots-plus-heading">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Community add-on</span>
              <h2 id="bots-plus-heading">Meldiq Bots+</h2>
              <p>
                Premium bots for one community, {formatPrice(botsPlus.amountMinor, botsPlus.currency, botsPlus.interval)}. Separate from your personal Meldiq
                Plus plan and Spark boosting.
              </p>
            </div>
            <div>
              <a className="button secondary" href={SITE.webAppUrl}>
                Manage community add-ons in Meldiq →
              </a>
              <p className="muted">Choose your community and review its billing terms in the app before subscribing.</p>
            </div>
          </div>
        </section>
      ) : null}

      {mojo ? (
        <section className="section alt" aria-labelledby="spark-heading">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Meldiq Spark</span>
              <h2 id="spark-heading">Community Sparks</h2>
              <p>
                Separate from your personal plan, Sparks are designed to boost a community for everyone in it: more expression, more room to share, and more
                ways to connect.
              </p>
            </div>
            <p className="pricing-preview-note">
              {mojo.enforced === true ? "Current community benefits" : "Configured preview · Limits not enforced"} ·{" "}
              {mojo.onSale?.spark ? "See current price below" : "Sparks are not on sale yet"}
            </p>
            <SparkLevels mojo={mojo} />
            <a className="inline-link" href={SITE.webAppUrl}>
              Manage Sparks in Meldiq →
            </a>
          </div>
        </section>
      ) : null}

      {mojo ? (
        <section className="section" aria-labelledby="gift-heading">
          <div className="wrap split">
            <div>
              <span className="eyebrow">Gifts</span>
              <h2 id="gift-heading">Gift subscriptions</h2>
              <p className="muted">
                {mojo.onSale?.gifts ? "In Meldiq, gifts are offered for" : "Gifting is not on sale yet. The current catalog describes gifts for"}{" "}
                {mojo.gifts.months
                  .map((m) => `${m}`)
                  .join(", ")
                  .replace(/, (\d+)$/, " or $1")}{" "}
                months. It&apos;s paid once and never renews, and your friend starts it whenever they choose.
              </p>
            </div>
            <div>
              <ul className="checklist">
                <li>Paid once: nothing renews</li>
                <li>Your friend chooses when it starts</li>
                <li>It follows on after any free days they already have</li>
                {mojo.onSale?.gifts ? null : <li>Gift purchases are not available yet</li>}
              </ul>
              {mojo.onSale?.gifts ? (
                <a className="inline-link" href={SITE.webAppUrl}>
                  Review gifts in Meldiq →
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {load.state === "ready" && load.catalog.trial && load.catalog.trial.days > 0 ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Free days</span>
              <h2>Try it before you pay anything</h2>
              <p>
                No card is needed for free days. Your invite link is on <a href="/account">your account page</a>.
              </p>
            </div>
            <FreeDaysSteps load={load} />
          </div>
        </section>
      ) : null}

      <section className="section alt">
        <div className="wrap grid cols-3">
          <div className="card">
            <h3>Meldiq Plus renewal and cancellation</h3>
            <p className="muted">
              Meldiq Plus renews automatically at the end of your billing period. Cancel any time from your billing page; you keep the plan until the end of the
              period you paid for. <Link href="/legal/billing">Details</Link>
            </p>
          </div>
          <div className="card">
            <h3>One subscription, every device</h3>
            <p className="muted">
              Meldiq Plus belongs to your Meldiq account. Sign in on another device and it&apos;s already there. You never pay twice to switch.
            </p>
          </div>
          <div className="card">
            <h3>Nothing is taken away</h3>
            <p className="muted">If Meldiq Plus ends, your communities, messages and files stay. You&apos;re simply back on the free tier.</p>
          </div>
        </div>
      </section>

      <FinalCta />
      {chosen ? <CheckoutDialog offer={chosen.offer} firstSubscription={chosen.first} onClose={() => setChosen(null)} /> : null}
    </Layout>
  );
}
