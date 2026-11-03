import { z } from "zod";
import { ApiError, endpoints, mojoCatalog, type Fetcher, type Offer, zCheckoutStarted, zEntitlements, zOwnerBilling, zSynced } from "./api";
import type { KeyValueStore, SessionStore } from "./session";
import { subscriptionOffers } from "./subscription";

export const zPayPalConfig = z.object({
  provider: z.literal("paypal"),
  environment: z.enum(["sandbox", "live"]),
  clientId: z.string(),
  billingStartAt: z.number().nullable().optional(),
  subscriptions: z.boolean(),
  cards: z.literal(false),
});
export const zPayPalCheckout = z.object({
  id: z.string(),
  product: z.enum(["plus", "gift"]),
  providerRef: z.string().nullable(),
  status: z.string(),
  confirmed: z.boolean(),
  approved: z.boolean().optional(),
  currency: z.literal("USD"),
  amountMinor: z.number().int().nonnegative(),
  interval: z.enum(["month", "one_time"]),
  expiresAt: z.number(),
});
export const zPayPalCanceled = z.object({ confirmed: z.boolean(), accessUntil: z.number().nullable(), status: z.string() });

export interface PaymentDetails {
  provider: "paypal" | "stripe";
  mode: "test" | "live";
  billingStartAt: number | null;
}
type BillingSession = Pick<SessionStore, "authed">;

/** The payment provider and first billing date come from the authenticated server, before agreement. */
export async function paymentDetails(session: BillingSession): Promise<PaymentDetails> {
  const [billing, entitlements] = await Promise.all([
    session.authed("/v2/billing/account", zOwnerBilling),
    session.authed("/v2/billing/entitlements", zEntitlements),
  ]);
  if (!billing.available || !billing.mode || (billing.provider !== "paypal" && billing.provider !== "stripe")) {
    throw new ApiError(409, "billing_unavailable", "Payment is not available right now. Please check billing again later.");
  }
  if (billing.provider === "paypal") {
    const config = await session.authed("/v2/billing/paypal/config", zPayPalConfig);
    if (!config.subscriptions || (config.environment === "live" ? "live" : "test") !== billing.mode) {
      throw new ApiError(409, "billing_unavailable", "PayPal subscriptions are not available right now. Nothing was charged.");
    }
    return { provider: "paypal", mode: billing.mode, billingStartAt: config.billingStartAt ?? null };
  }
  const end = entitlements.personal.trial?.endsAt ?? null;
  return { provider: "stripe", mode: billing.mode, billingStartAt: end && end > Date.now() + 2 * 86_400_000 ? end : null };
}

/** Hosted checkout keeps payment details on PayPal; only allow the configured provider and environment. */
export function paymentUrl(raw: string | null, details: Pick<PaymentDetails, "provider" | "mode">): string {
  try {
    const u = new URL(raw ?? "");
    const hosts =
      details.provider === "paypal"
        ? details.mode === "live"
          ? ["www.paypal.com", "paypal.com"]
          : ["www.sandbox.paypal.com", "sandbox.paypal.com"]
        : ["checkout.stripe.com"];
    if (u.protocol === "https:" && !u.username && !u.password && !u.port && hosts.includes(u.hostname)) return u.href;
  } catch {
    /* Refuse missing or malformed payment addresses. */
  }
  throw new ApiError(0, "bad_payment_url", "The secure payment page could not be opened. Check your billing status before trying again.");
}

export async function startPayment(offer: Offer, disclosed: PaymentDetails, session: BillingSession, fetcher?: Fetcher) {
  const [catalog, mojo, fresh] = await Promise.all([endpoints.plans(fetcher), mojoCatalog(fetcher), paymentDetails(session)]);
  const matches =
    catalog.available &&
    subscriptionOffers(catalog.plans, mojo).some(
      (o) =>
        o.key === offer.key &&
        o.amountMinor === offer.amountMinor &&
        o.currency === offer.currency &&
        o.interval === offer.interval &&
        o.trialDays === offer.trialDays &&
        o.graceDays === offer.graceDays,
    );
  if (
    !matches ||
    catalog.mode !== fresh.mode ||
    fresh.provider !== disclosed.provider ||
    fresh.mode !== disclosed.mode ||
    fresh.billingStartAt !== disclosed.billingStartAt
  ) {
    throw new ApiError(
      409,
      "offer_changed",
      "The payment terms changed. Close this window and choose the plan again to review them. No new payment was started.",
    );
  }
  const started = await session.authed("/v2/billing/checkout", zCheckoutStarted, { method: "POST", body: { planKey: offer.key, returnTo: "site" } });
  return { ...started, url: paymentUrl(started.url, fresh), provider: fresh.provider, mode: fresh.mode };
}

const zPendingPayment = z.object({
  approvalUrl: z.string().optional(),
  expiresAt: z.number().optional(),
  accountId: z.string(),
  checkoutId: z.string().regex(/^[A-Za-z0-9_-]{1,150}$/),
  provider: z.enum(["paypal", "stripe"]),
  mode: z.enum(["test", "live"]),
});
export type PendingPayment = z.infer<typeof zPendingPayment>;
const PENDING_PAYMENT_KEY = "meldiq.site.payment";
export function rememberPayment(storage: KeyValueStore, value: PendingPayment): void {
  storage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(zPendingPayment.parse(value)));
}
export function pendingPayment(storage: KeyValueStore, accountId: string): PendingPayment | null {
  try {
    const parsed = zPendingPayment.safeParse(JSON.parse(storage.getItem(PENDING_PAYMENT_KEY) ?? "null"));
    return parsed.success && parsed.data.accountId === accountId ? parsed.data : null;
  } catch {
    return null;
  }
}
export function forgetPayment(storage: KeyValueStore): void {
  try {
    storage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    /* A confirmed payment is not reversed by a storage failure. */
  }
}

/** A browser return cannot activate Plus. Both the owned checkout and the account must be verified by the server. */
export async function verifyPayment(session: BillingSession, pending: PendingPayment | null): Promise<"confirmed" | "scheduled" | "pending"> {
  let confirmed = pending?.provider !== "paypal";
  let scheduled = false;
  if (pending?.provider === "paypal") {
    const purchase = await session.authed(`/v2/billing/paypal/checkouts/${encodeURIComponent(pending.checkoutId)}`, zPayPalCheckout);
    if (purchase.id !== pending.checkoutId || purchase.product !== "plus" || purchase.amountMinor !== 399 || purchase.interval !== "month") {
      throw new ApiError(409, "checkout_mismatch", "This payment could not be matched to your Plus subscription. Check billing before trying again.");
    }
    confirmed = purchase.confirmed;
    if (purchase.approved && !confirmed) {
      const config = await session.authed("/v2/billing/paypal/config", zPayPalConfig);
      scheduled = !!config.billingStartAt && config.billingStartAt > Date.now();
    }
  } else {
    await session.authed("/v2/billing/sync", zSynced, { method: "POST", body: {} });
  }
  const billing = await session.authed("/v2/billing/account", zOwnerBilling);
  if (confirmed && billing.subscription && ["entitled", "grace"].includes(billing.subscription.standing)) return "confirmed";
  return scheduled ? "scheduled" : "pending";
}
