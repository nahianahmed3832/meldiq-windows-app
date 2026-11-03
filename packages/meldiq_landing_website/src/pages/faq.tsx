import { subscriptionOffers } from "../lib/subscription";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import questions from "../content/faq.json";
import { dayCount, trialOf, trialPlanName, useCatalog, useMojoCatalog, type CatalogLoad } from "../lib/catalog";
import type { MojoCatalog } from "../lib/api";
import { ANNOUNCED_PLANS } from "../lib/site";
import { sparkPaymentTerms } from "../components/MojoCompare";
import { formatMoney } from "../lib/money";

const QUESTIONS = questions as [string, string, string][];
const CATEGORIES = ["All", ...new Set(QUESTIONS.map((q) => q[0]))];
function currentAnswer(question: string, fallback: string, load: CatalogLoad, mojo: MojoCatalog | null): string {
  const trial = trialOf(load);
  if (question === "Is there a free Meldiq Plus trial?")
    return trial && trial.days > 0
      ? `The current offer is ${dayCount(trial.days)} of ${trialPlanName(load, ANNOUNCED_PLANS)}, with no card required. A free trial ends by itself without a charge. Check your account for the offer that applies to you.`
      : "Trial availability could not be confirmed. Check the existing account or pricing page for the offer that applies to you. Free trial periods end by themselves, without a charge.";
  if (question === "Can I buy Meldiq Plus now?")
    return load.state === "ready"
      ? load.catalog.available && subscriptionOffers(load.catalog.plans, mojo).length > 0
        ? "Meldiq Plus is available for $4.99 USD/month with secure PayPal checkout. Visit Pricing to review the exact terms before subscribing. Core messaging remains free."
        : "The current billing catalog reports that paid plans are not on sale. Use your existing billing account to check availability. Core messaging remains free."
      : "Paid-plan availability could not be confirmed. Check the existing billing page before making plans to subscribe. Core messaging remains free.";
  if (question === "Which plans include Sparks?")
    return mojo
      ? `The current catalog configures ${mojo.plans.find((p) => p.key === "plus")?.sparks ?? 0} Spark(s) for Meldiq Plus; Spark boosting is also separate from the personal plan. ${mojo.enforced === true ? "See Pricing for the current account benefits." : "These are preview values; catalog limits are not currently enforced."} Final benefits must be confirmed before purchase.`
      : "The current Spark allowances could not be confirmed. See Pricing or your billing account for current availability and benefits.";
  if (question === "Can communities receive multiple Sparks?")
    return mojo
      ? `The current catalog describes ${mojo.spark.levels
          .filter((l) => l.level > 0)
          .map((l) => `Level ${l.level} at ${l.sparks} Sparks`)
          .join(
            ", ",
          )}. ${mojo.enforced === true ? "See Pricing for the current benefits." : "These are configured previews; catalog limits are not currently enforced."}`
      : "The catalog describes community Spark levels. The current thresholds could not be confirmed; check Pricing before relying on specific benefits.";
  if (question === "What is Meldiq Spark?")
    return `Sparks boost a community for everyone in it, with extra emoji and sticker capacity, file capacity and voice or screen-sharing quality. ${mojo?.enforced === true ? "See Pricing for the current benefits." : "Configured benefits are a preview; enforced entitlements have not been confirmed."} ${mojo?.onSale?.spark ? `Extra Sparks cost ${formatMoney(mojo.onSale.spark.amountMinor, mojo.onSale.spark.currency)} each${sparkPaymentTerms(mojo.spark.interval)}. Review the purchase and expiration terms in the app.` : "Paid Spark availability is not confirmed; check the app before planning a purchase."}`;
  if (question === "Can I gift Meldiq Plus to another user?")
    return mojo?.onSale?.gifts
      ? `The current catalog offers gifts for ${mojo.gifts.months.join(", ")} months. The published website describes a one-time payment without automatic renewal, with the recipient choosing when to start. Confirm the terms in the app.`
      : "Gifting is not currently confirmed for sale. The existing website describes planned Meldiq Plus gifts paid once without automatic renewal, with the recipient choosing when to start. Check availability and terms in the app.";
  return fallback;
}
export default function Faq() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const load = useCatalog();
  const mojoLoad = useMojoCatalog();
  const mojo = mojoLoad.state === "ready" ? mojoLoad.mojo : null;
  useEffect(() => {
    const selected = router.query.category;
    if (typeof selected === "string" && CATEGORIES.includes(selected)) setCategory(selected);
  }, [router.query.category]);
  const answers = useMemo(() => QUESTIONS.map(([cat, q, a]) => ({ category: cat, question: q, answer: currentAnswer(q, a, load, mojo) })), [load, mojo]);
  const filtered = answers.filter(
    (item) => (category === "All" || item.category === category) && `${item.question} ${item.answer}`.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const reset = () => {
    setQuery("");
    setCategory("All");
  };
  return (
    <Layout
      title="FAQ — Questions, answered"
      description="Find clear answers about Meldiq communities, privacy, web and Android, Meldiq Plus, Sparks, gifts and your account."
    >
      <section className="page-hero wrap">
        <Link className="breadcrumb" href="/">
          Home / FAQ
        </Link>
        <span className="eyebrow">FAQ</span>
        <h1>Questions, answered.</h1>
        <p>The things you want to know, in plain language.</p>
      </section>
      <section className="faq-content wrap">
        <label className="search-box" htmlFor="help-search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="help-search"
            aria-label="Search questions and answers"
            type="search"
            placeholder="Search your question…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span>LET’S FIND YOUR ANSWER</span>
        </label>
        <div className="faq-filters" role="group" aria-label="Filter questions by category">
          {CATEGORIES.map((cat) => (
            <button type="button" key={cat} aria-pressed={category === cat} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <p className="results-count" role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "answer" : "answers"}
          {query ? ` for “${query}”` : ""}
        </p>
        <div className="faq-layout">
          <aside>
            <h2>Need a little help?</h2>
            <img src="/meldling-128.png" width={100} height={100} alt="Meldling is here to help" loading="lazy" />
            <p>Start with Support for account, billing and community help.</p>
            <Link href="/support" className="button secondary">
              Find support →
            </Link>
          </aside>
          <div className="faq-answers">
            {CATEGORIES.filter((cat) => cat !== "All").map((cat) => {
              const items = filtered.filter((item) => item.category === cat);
              return items.length ? (
                <section className="faq-group" key={cat}>
                  <h2>{cat}</h2>
                  {items.map((item) => (
                    <details key={item.question}>
                      <summary>
                        {item.question}
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </summary>
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    </details>
                  ))}
                </section>
              ) : null;
            })}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <h2>No answers found.</h2>
                <p>Try a shorter search or another category.</p>
                <button type="button" className="button secondary" onClick={reset}>
                  Clear search &amp; filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="faq-bottom">
          <h2>Useful next steps</h2>
          <Link href="/signup">Create an account ↗</Link>
          <Link href="/account/billing">Manage billing ↗</Link>
          <Link href="/download">Find your platform →</Link>
          <Link href="/legal/privacy">Privacy Policy →</Link>
          <Link href="/legal/account-deletion">Account deletion &amp; data →</Link>
        </div>
      </section>
    </Layout>
  );
}
