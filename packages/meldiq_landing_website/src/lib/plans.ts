import type { Grant, Offer } from "./api";
import { formatBytes, formatDate, formatMoney, formatPrice, type Interval, intervalAdverb } from "./money";

/**
 * How plans and entitlements are described to people. Everything comes from the API's catalog (no price, trial or limit
 * is written into the site), and the words follow docs/BILLING.md: what renews, when access ends, what a failed payment
 * does. Comparisons are factual: no invented "was" prices, no urgency.
 */
export type Audience = Offer["audience"];

export function offersFor(offers: readonly Offer[], audience: Audience, interval: Interval): Offer[] {
  return offers.filter((o) => o.audience === audience && o.interval === interval).sort((a, b) => a.amountMinor - b.amountMinor);
}

/** The billing intervals on offer for an audience (the toggle shows only those). */
export function intervalsFor(offers: readonly Offer[], audience: Audience): Interval[] {
  const set = new Set(offers.filter((o) => o.audience === audience).map((o) => o.interval));
  return (["month", "year"] as const).filter((i) => set.has(i));
}

const LIMIT_LABELS: Record<string, (n: number) => string> = {
  members: (n) => `Up to ${n.toLocaleString("en-US")} members (guests included)`,
  "roles.custom": (n) => `Up to ${n.toLocaleString("en-US")} custom roles`,
  "storage.bytes": (n) => `${formatBytes(n)} of stored files`,
};

const LIMIT_NAMES: Record<string, string> = { members: "Members", "roles.custom": "Custom roles", "storage.bytes": "Stored files" };

/** A limit's short name (a comparison table's row). */
export function limitName(key: string): string {
  return LIMIT_NAMES[key] ?? key;
}

/** A plan's limits in plain words (unknown keys are left out rather than guessed at). */
export function describeLimits(limits: Readonly<Record<string, number>>): string[] {
  return Object.entries(limits).flatMap(([k, v]) => (LIMIT_LABELS[k] ? [LIMIT_LABELS[k](v)] : []));
}

/**
 * What a person must know before paying (consumer-protection disclosures), built from the plan's own terms. No tax is
 * collected (owner's decision, 2026-10-28): the price shown is the price charged.
 */
export function disclosures(o: Offer, firstSubscription = true, trialEndsAt: number | null = null): string[] {
  const price = formatPrice(o.amountMinor, o.currency, o.interval);
  const lines = [
    `You pay ${price} (${o.currency.toUpperCase()}), billed ${intervalAdverb(o.interval)} until you cancel. The subscription renews automatically.`,
    "No tax is added: the price shown is what you pay.",
  ];
  if (trialEndsAt) {
    lines.push(`You're in a free Meldiq Plus period until ${formatDate(trialEndsAt)}: your first payment is taken then, not today.`);
  } else if (o.trialDays > 0 && firstSubscription) {
    lines.push(
      `Your first subscription starts with a ${o.trialDays}-day free trial. If you don't cancel before it ends, the first payment of ${formatMoney(o.amountMinor, o.currency)} is taken then.`,
    );
  }
  lines.push(
    "Cancel any time from your account's billing page. You keep the plan until the end of the period you've paid for; it then doesn't renew.",
    o.graceDays > 0
      ? `If a renewal payment fails, you keep the plan for ${o.graceDays} day${o.graceDays === 1 ? "" : "s"} while the payment is retried. After that the plan stops until a payment succeeds.`
      : "If a renewal payment fails, the plan stops until a payment succeeds.",
    "Ending a plan never deletes your messages, files or members. Only adding more beyond the free limits is refused.",
  );
  return lines;
}

/** One line about where an account or organization's plan stands. */
export function describeGrant(g: Grant): string {
  switch (g.standing) {
    case "none":
      return "Free. No subscription.";
    case "entitled":
      if (g.trial) {
        const until = formatDate(g.trial.endsAt);
        if (g.trial.source === "signup") return `Your free ${g.plan?.name ?? "Meldiq Plus"} trial runs until ${until}.`;
        if (g.trial.source === "invite") return `You joined through an invite: ${g.plan?.name ?? "Meldiq Plus"} is free until ${until}.`;
        if (g.trial.source === "gift") return `${g.plan?.name ?? "Meldiq Plus"} is yours until ${until}: a gift from a friend.`;
        if (g.trial.source === "operator") return `${g.plan?.name ?? "Meldiq Plus"} is free until ${until}, from the Meldiq team.`;
        return `${g.plan?.name ?? "Meldiq Plus"} is free until ${until}, thanks to friends you invited.`;
      }
      if (!g.accessUntil) return `${g.plan?.name ?? "Plan"} is active.`;
      return g.renews ? `${g.plan?.name} renews on ${formatDate(g.accessUntil)}.` : `${g.plan?.name} ends on ${formatDate(g.accessUntil)} and won't renew.`;
    case "grace":
      return `A payment failed. ${g.plan?.name} stays on${g.accessUntil ? ` until ${formatDate(g.accessUntil)}` : ""} while it's retried: update your payment method to keep it.`;
    case "grace_ended":
      return "A payment failed and the grace period is over, so the plan is paused. Update your payment method to restore it.";
    case "not_entitled":
      return "The subscription isn't active, so the free limits apply.";
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    trialing: "Free trial",
    active: "Active",
    past_due: "Payment failed",
    unpaid: "Unpaid",
    paused: "Paused",
    incomplete: "Waiting for payment",
    canceled: "Canceled",
    incomplete_expired: "Expired",
    paid: "Paid",
    open: "Due",
    payment_failed: "Payment failed",
    void: "Void",
    uncollectible: "Not collected",
  };
  return labels[status] ?? status;
}
