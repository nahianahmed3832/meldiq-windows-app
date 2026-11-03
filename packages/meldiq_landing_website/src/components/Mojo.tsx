import Link from "next/link";
import type { MojoCatalog } from "../lib/api";
import { type CatalogLoad, dayCount, mojoOf, trialOf, trialPlanName, useMojoCatalog } from "../lib/catalog";
import { perkLines } from "./MojoCompare";
import { formatDate, formatMoney } from "../lib/money";
import { ANNOUNCED_PLANS } from "../lib/site";

const DAY_MS = 86_400_000;

/**
 * Meldiq Plus on the marketing pages. Whether free days are on, and how many, comes from the price list (operators run
 * the program from the Platform Admin Console): nothing here promises a trial the server isn't giving.
 */
interface LoadProps {
  load: CatalogLoad;
}

/** A small link above a hero's buttons while free days are on. */
export function TrialPill({ load, href = "/signup" }: LoadProps & { href?: string }) {
  const trial = trialOf(load);
  if (!trial || trial.days === 0) return null;
  return (
    <Link href={href} className="trial-pill">
      <span className="trial-pill-dot" aria-hidden="true" />
      {trialPlanName(load, ANNOUNCED_PLANS)} free for {dayCount(trial.days)} · no card needed
    </Link>
  );
}

/** How free days work, in three steps, with the numbers in effect now. Nothing while they're off. */
export function FreeDaysSteps({ load }: LoadProps) {
  const trial = trialOf(load);
  if (!trial) return null;
  const plan = trialPlanName(load, ANNOUNCED_PLANS);
  const steps = [
    {
      n: "1",
      title: "Create your account",
      text: `You get ${plan} free for ${dayCount(trial.days)}, on every device you sign in to. No card, nothing renews.`,
    },
    {
      n: "2",
      title: "Share your invite link",
      text: `A friend who joins through it gets ${dayCount(trial.referralDays)} of ${plan} instead, and you get ${dayCount(trial.referralDays)} added to yours.`,
    },
    {
      n: "3",
      title: "Keep it going",
      text: `Each friend who joins adds more days, up to ${dayCount(trial.referralYearlyCapDays)} a year. Subscribe whenever you like: the first payment waits until your free days end.`,
    },
  ];
  return (
    <ol className="steps" aria-label={`How free ${plan} days work`}>
      {steps.map((s) => (
        <li key={s.n} className="step">
          <span className="step-n" aria-hidden="true">
            {s.n}
          </span>
          <div>
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A Mojo plan's perks in plain words, from the Mojo catalog (empty until it has loaded or if it has no such plan). */
export function tierPerks(mojo: MojoCatalog | null, key: string): string[] {
  const perks = mojo?.plans.find((p) => p.key === key);
  return mojo && perks ? perkLines(mojo, perks) : [];
}

/** The free days a plan comes with now ("14 days free"), or null when free days are off or give another plan. */
export function freeDaysBadge(load: CatalogLoad, key: string): string | null {
  const trial = trialOf(load);
  return trial?.planKey === key && trial.days > 0 ? `${dayCount(trial.days)} free` : null;
}

/** The approved Meldiq Plus plan and price (on sale, else as announced), for the home page. */
export function MojoTiers({ load }: LoadProps) {
  const tiers = ANNOUNCED_PLANS;
  const mojo = mojoOf(useMojoCatalog());
  return (
    <div className="mojo-tiers">
      {tiers.map((t) => {
        const badge = freeDaysBadge(load, t.key);
        const perks = tierPerks(mojo, t.key);
        return (
          <div key={t.key} className={`mojo-tier${badge ? " highlighted" : ""}`}>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <h3 style={{ margin: 0 }}>{t.name}</h3>
              {badge ? <span className="badge accent">{badge}</span> : null}
            </div>
            <div className="price">
              {formatMoney(t.amountMinor, t.currency)} <small>/ month</small>
            </div>
            {perks.length > 0 ? (
              <ul className="checklist">
                {perks.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** One Meldiq Plus plan as the owner announced it, before it's on sale: its price and perks, and free days when it has them. */
export function AnnouncedPlanCard({ plan, load, perks }: { plan: (typeof ANNOUNCED_PLANS)[number]; load: CatalogLoad; perks: string[] }) {
  const badge = freeDaysBadge(load, plan.key);
  return (
    <article className={`plan${badge ? " featured" : ""}`} aria-labelledby={`announced-${plan.key}`}>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <h3 id={`announced-${plan.key}`} style={{ margin: 0 }}>
          {plan.name}
        </h3>
        {badge ? <span className="badge accent">{badge}</span> : <span className="badge">Not on sale yet</span>}
      </div>
      <div>
        <div className="price">
          {formatMoney(plan.amountMinor, plan.currency)} <small>/ {plan.interval}</small>
        </div>
        <div className="muted" style={{ fontSize: "0.88rem" }}>
          {plan.currency}, billed monthly, renews automatically. No tax is added.
        </div>
      </div>
      {perks.length > 0 ? (
        <ul className="checklist">
          {perks.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      <div className="plan-foot">
        {badge ? (
          <>
            <Link href="/signup" className="btn btn-primary btn-block">
              Start free
            </Link>
            <p className="muted" style={{ margin: "10px 0 0", fontSize: "0.85rem", textAlign: "center" }}>
              No card needed. Paying for it opens once it&apos;s on sale.
            </p>
          </>
        ) : (
          <button type="button" className="btn btn-secondary btn-block" disabled>
            Coming soon
          </button>
        )}
      </div>
    </article>
  );
}

/** The free days in effect now, in one sentence (the legal page's terms say the numbers come from here). */
export function CurrentFreeDays({ load }: LoadProps) {
  const trial = trialOf(load);
  if (load.state === "loading") return null;
  if (!trial)
    return <p className="callout info">Right now no free days are being given: new accounts don&apos;t get a trial and invite links don&apos;t add days.</p>;
  const plan = trialPlanName(load, ANNOUNCED_PLANS);
  return (
    <p className="callout success">
      Right now: every new account gets {dayCount(trial.days)} of {plan}; through an invite link, both people get {dayCount(trial.referralDays)}; an inviter
      earns up to {dayCount(trial.referralYearlyCapDays)} a year.
    </p>
  );
}

/** Days left in a free period, as words and a bar (the bar is decoration; the words carry it). */
export function DaysLeft({ endsAt, totalDays, now = Date.now() }: { endsAt: number; totalDays: number | null; now?: number }) {
  const left = Math.max(0, Math.ceil((endsAt - now) / DAY_MS));
  const total = Math.max(left, totalDays ?? left, 1);
  const pct = Math.round((left / total) * 100);
  return (
    <div className="days-left">
      <p style={{ margin: 0 }}>
        <strong>{dayCount(left)} left</strong> <span className="muted">· until {formatDate(endsAt)}</span>
      </p>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Meldiq Plus in one band: what it is, its Plus plan and how free days work. The home and features pages show the same. */
export function MojoSection({ load }: LoadProps) {
  const trial = trialOf(load);
  return (
    <section className="section alt" aria-labelledby="mojo-heading">
      <div className="wrap stack" style={{ gap: 32 }}>
        <div className="mojo-band">
          <div>
            <span className="eyebrow">Meldiq Plus</span>
            <h2 id="mojo-heading">Extras for your account, on every device.</h2>
            <p className="muted">
              Everything you need to talk is free. Meldiq Plus is optional at $4.99/month, with files up to 1 GB each. It belongs to your Meldiq account, so
              one subscription covers the web and your phone.
              {trial && trial.days > 0 ? ` Right now every new account gets ${dayCount(trial.days)} free, no card needed.` : ""}
            </p>
            <div className="hero-actions" style={{ marginTop: 18 }}>
              <Link href="/pricing" className="btn btn-primary">
                See Meldiq Plus
              </Link>
              {trial ? (
                <Link href="/signup" className="btn btn-secondary">
                  Start free
                </Link>
              ) : null}
            </div>
          </div>
          <MojoTiers load={load} />
        </div>
        <FreeDaysSteps load={load} />
      </div>
    </section>
  );
}
