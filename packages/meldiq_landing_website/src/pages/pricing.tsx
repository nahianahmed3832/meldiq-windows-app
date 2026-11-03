import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { FreeDaysSteps, TrialPill, tierPerks } from "../components/Mojo";
import { CompareTable, SparkLevels } from "../components/MojoCompare";
import { CheckoutDialog, PlanCard } from "../components/Plans";
import { ApiError, type Offer, zEntitlements } from "../lib/api";
import { mojoOf, useCatalog, useMojoCatalog } from "../lib/catalog";
import { subscriptionOffers } from "../lib/subscription";
import { browserSession } from "../lib/session";
import { PreviewPlanCard } from "../components/PreviewPlanCard";
import { CatalogStatus } from "../components/MarketingStatus";
import { FinalCta } from "../components/MarketingArt";
import { SITE } from "../lib/site";
import { formatPrice } from "../lib/money";
import { BillingTerms } from "../components/BillingTerms";

const FREE_INCLUDES = [
  "Communities, channels, threads and forums",
  "Direct messages and private groups",
  "Voice and video calls, voice channels, screen sharing",
  "Encrypted file sharing",
  "Android and the web, with one account",
];

/**
 * Meldiq's plans: Free, and Meldiq Plus for a person's account. Prices on sale come from the API's catalog (the server
 * decides what is charged); until it has them, the owner-approved prices are shown as announced, without a buy button.
 */
export default function Pricing() {
  const router = useRouter();
  const load = useCatalog();
  const mojoLoad = useMojoCatalog();
  const mojo = mojoOf(mojoLoad);
  const [chosen, setChosen] = useState<{ offer: Offer; first: boolean } | null>(null);
  const [chooseError, setChooseError] = useState<string | null>(null);

  const offers = useMemo(
    () => (load.state === "ready" && load.catalog.available ? subscriptionOffers(load.catalog.plans, mojoLoad.state === "ready" ? mojoLoad.mojo : null) : []),
    [load, mojoLoad],
  );
  const shown = offers;
  const announced = shown.length === 0;
  const botsPlus =
    load.state === "ready" && load.catalog.available
      ? load.catalog.plans.find((offer) => offer.key === "bots_plus" && offer.audience === "organization")
      : undefined;

  async function choose(offer: Offer) {
    setChooseError(null);
    const session = browserSession();
    if (!session.current()) {
      void router.push(`/login?next=${encodeURIComponent(`/pricing?plan=${offer.key}`)}`);
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
    const offer = key ? offers.find((o) => o.key === key && o.audience === "personal") : undefined;
    if (offer && browserSession().current()) {
      void choose(offer);
      void router.replace("/pricing", undefined, { shallow: true });
    }
    // Runs when the catalog arrives with ?plan= in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, router.query.plan]);

  return (
    <Layout
      title="Meldiq Plus"
      description="Meldiq is free to use. Meldiq Plus is $4.99/month with 1 GB uploads. Subscribe securely with PayPal; one subscription works on every device."
    >
      {load.state === "ready" && load.catalog.mode === "test" ? (
        <div className="test-banner" role="status">
          Test payments only. No real money is charged.
        </div>
      ) : null}
      <section className="page-hero legacy-hero pricing-hero">
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
          <p>Meldiq Plus adds account extras for $4.99/month, including files up to 1 GB each, with one subscription across supported devices.</p>
          <CatalogStatus />
        </div>
      </section>

      <section className="section pricing-plans" id="plans">
        <div className="wrap">
          {chooseError ? (
            <div className="callout warning" role="alert" style={{ marginBottom: 20 }}>
              <p>{chooseError}</p>
            </div>
          ) : null}

          <div className="plan-grid" aria-live="polite" aria-busy={load.state === "loading"}>
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
                <Link href="/signup" className="btn btn-secondary btn-block">
                  Create a free account
                </Link>
              </div>
            </article>
            {shown.map((o, i) => (
              <PlanCard key={o.key} offer={o} featured={i === shown.length - 1} onChoose={choose} perks={tierPerks(mojo, o.key)} />
            ))}
            {announced ? ["plus"].map((key) => <PreviewPlanCard key={key} planKey={key} load={load} mojo={mojo} />) : null}
          </div>

          {load.state === "error" ? (
            <div className="callout danger" role="alert" style={{ marginTop: 20 }}>
              <p>{load.message} The free tier is always available.</p>
            </div>
          ) : null}
          {announced ? (
            <p className="muted" style={{ marginTop: 20 }}>
              Meldiq Plus isn&apos;t on sale yet. When it is, its full terms are shown here and again before anyone is asked to pay.
            </p>
          ) : null}
        </div>
      </section>

      <section className="section terms-section">
        <div className="wrap">
          <BillingTerms mojo={mojo} monthlyAvailable={!announced} />
        </div>
      </section>

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
                  : "Meldiq Plus is the updated $4.99/month plan with 1 GB uploads. Benefits below are a preview until the plan is available."}
              </p>
            </div>
            <CompareTable mojo={mojo} />
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
            <ul className="checklist">
              <li>Paid once: nothing renews</li>
              <li>Your friend chooses when it starts</li>
              <li>It follows on after any free days they already have</li>
              {mojo.onSale?.gifts ? null : <li>Gift purchases are not available yet</li>}
            </ul>
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
                No card is needed for free days. Your invite link is on <Link href="/account">your account page</Link>.
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
              Meldiq Plus renews automatically every month. Cancel any time from your billing page; you keep the plan until the end of the period you paid for.{" "}
              <Link href="/legal/billing">Details</Link>
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
