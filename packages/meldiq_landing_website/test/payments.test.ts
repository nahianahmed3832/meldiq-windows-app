import { describe, expect, it } from "vitest";
import { FIXTURE_MOJO, FIXTURE_PLANS } from "../e2e/fixtures.mjs";
import { type Fetcher, type Offer } from "../src/lib/api";
import {
  forgetPayment,
  paymentDetails,
  paymentUrl,
  pendingPayment,
  rememberPayment,
  requireLiveSitePayment,
  startPayment,
  verifyPayment,
} from "../src/lib/payments";
import { SessionStore } from "../src/lib/session";

function setup({
  amount = 499,
  provider = "paypal",
  environment = "live",
  subscriptions = true,
  billingStartAt = null as number | null,
  paid = false,
  approved = false,
  purchaseConfirmed = false,
  cadence = "monthly" as "monthly" | "quarterly" | "yearly",
} = {}) {
  const terms = FIXTURE_MOJO.plusTerms ?? [];
  const term = terms.find((option) => option.key === cadence);
  if (!term) throw new Error("Expected a configured billing term in the fixture");
  const offer: Offer =
    cadence === "monthly"
      ? { ...FIXTURE_PLANS.plans[0]!, amountMinor: amount }
      : {
          ...FIXTURE_PLANS.plans[0]!,
          amountMinor: term.amountMinor,
          interval: term.interval,
          billingFrequency: term.billingFrequency,
          term: cadence,
        };
  const mojo = { ...FIXTURE_MOJO, plusTerms: terms.map((option) => (option.key === cadence ? { ...option, available: true } : option)) };
  const storage = new Map<string, string>();
  const kv = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
  };
  const calls: { path: string; body: unknown }[] = [];
  const fetcher: Fetcher = async (path, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ path, body });
    const mode = environment === "live" ? "live" : "test";
    const replies: Record<string, unknown> = {
      "/v2/billing/plans": { ...FIXTURE_PLANS, mode, plans: [offer] },
      "/v2/mojo/catalog": mojo,
      "/v2/billing/account": {
        provider,
        available: true,
        mode,
        reason: null,
        subscription: paid
          ? {
              plan: { key: "plus", name: "Meldiq Plus" },
              status: "active",
              standing: "entitled",
              interval: "month",
              currency: "USD",
              amountMinor: 499,
              currentPeriodEnd: Date.now() + 86400000,
              trialEnd: null,
              cancelAtPeriodEnd: false,
            }
          : null,
        invoices: [],
        offers: [],
        portal: false,
      },
      "/v2/billing/entitlements": {
        accountId: "acc_test",
        billing: { available: true, mode },
        personal: { plan: null, standing: "none", accessUntil: null, renews: null, quotaPlanId: null, subscription: null },
        organizations: [],
        revision: "1",
        evaluatedAt: Date.now(),
      },
      "/v2/billing/paypal/config": { provider: "paypal", environment, clientId: "public-test-client", subscriptions, cards: false, billingStartAt },
      "/v2/billing/sync": { checked: 0 },
      "/v2/billing/paypal/checkouts/chk_test": {
        id: "chk_test",
        product: "plus",
        providerRef: "I-TEST",
        status: paid ? "active" : "incomplete",
        confirmed: purchaseConfirmed,
        approved,
        currency: "USD",
        amountMinor: offer.amountMinor,
        interval: offer.interval,
        billingFrequency: offer.billingFrequency,
        expiresAt: Date.now() + 100000,
      },
      "/v2/billing/checkout": {
        checkoutId: "chk_test",
        url: `https://${environment === "live" ? "www" : "www.sandbox"}.paypal.com/webapps/billing/subscriptions?ba_token=TEST`,
        expiresAt: Date.now() + 10000,
      },
    };
    return new Response(JSON.stringify(replies[path] ?? {}), { status: path in replies ? 200 : 404 });
  };
  const session = new SessionStore(kv, fetcher);
  session.save({
    accessToken: "test-token",
    accessTokenExpiresAt: Date.now() + 100000,
    refreshToken: "refresh",
    refreshTokenExpiresAt: Date.now() + 200000,
    session: { id: "s" },
    account: { id: "acc_test", email: "test@example.test", name: "Test", createdAt: 1 },
  });
  return { session, fetcher, calls, kv, offer };
}

describe("PayPal website checkout", () => {
  it("uses authenticated PayPal availability and the server's exact deferred billing date", async () => {
    const date = Date.now() + 14 * 86400000;
    const { session } = setup({ billingStartAt: date });
    expect(await paymentDetails(session)).toEqual({ provider: "paypal", mode: "live", billingStartAt: date });
  });
  it("creates only the server-owned Plus plan and returns to the website, never sends an amount or merchant credentials", async () => {
    const { session, calls, fetcher } = setup();
    const details = await paymentDetails(session);
    const result = await startPayment(FIXTURE_PLANS.plans[0]!, details, session, fetcher);
    expect(result.provider).toBe("paypal");
    expect(result.url).toMatch(/^https:\/\/www.paypal.com\//);
    expect(calls.find((c) => c.path === "/v2/billing/checkout")?.body).toEqual({ planKey: "plus", returnTo: "site" });
  });
  it.each(["quarterly", "yearly"] as const)("sends the selected %s cadence and verifies the matching receipt", async (cadence) => {
    const { offer, session, calls, fetcher } = setup({ cadence, paid: true, purchaseConfirmed: true });
    await startPayment(offer, await paymentDetails(session), session, fetcher);
    expect(calls.find((c) => c.path === "/v2/billing/checkout")?.body).toEqual({ planKey: "plus", term: cadence, returnTo: "site" });
    const pending = {
      checkoutId: "chk_test",
      accountId: "acc_test",
      provider: "paypal" as const,
      mode: "live" as const,
      amountMinor: offer.amountMinor,
      interval: offer.interval,
      billingFrequency: offer.billingFrequency,
    };
    expect(await verifyPayment(session, pending)).toBe("confirmed");
    await expect(verifyPayment(session, { ...pending, interval: "month", billingFrequency: 1 })).rejects.toMatchObject({ code: "checkout_mismatch" });
  });
  it("refuses changed pricing before starting any provider session", async () => {
    const { session, calls, fetcher } = setup({ amount: 399 });
    await expect(startPayment(FIXTURE_PLANS.plans[0]!, await paymentDetails(session), session, fetcher)).rejects.toMatchObject({ code: "offer_changed" });
    expect(calls.some((c) => c.path === "/v2/billing/checkout")).toBe(false);
  });
  it("refuses a changed first-payment date until the customer reviews it again", async () => {
    const { session, calls, fetcher } = setup({ billingStartAt: Date.now() + 100000 });
    await expect(startPayment(FIXTURE_PLANS.plans[0]!, { provider: "paypal", mode: "live", billingStartAt: null }, session, fetcher)).rejects.toMatchObject({
      code: "offer_changed",
    });
    expect(calls.some((c) => c.path === "/v2/billing/checkout")).toBe(false);
  });
  it("does not offer a PayPal flow unless recurring payments are enabled", async () => {
    await expect(paymentDetails(setup({ subscriptions: false }).session)).rejects.toMatchObject({ code: "billing_unavailable" });
  });
  it("refuses sandbox checkout on the public website", () => {
    expect(() => requireLiveSitePayment("test", "meldiq.app")).toThrow("Live payment is unavailable");
    expect(() => requireLiveSitePayment("test", "www.meldiq.app")).toThrow("Live payment is unavailable");
    expect(() => requireLiveSitePayment("live", "meldiq.app")).not.toThrow();
    expect(() => requireLiveSitePayment("test", "localhost")).not.toThrow();
  });
  it("keeps live and sandbox redirects separate and rejects spoofed or credential-bearing addresses", () => {
    expect(paymentUrl("https://www.sandbox.paypal.com/checkout", { provider: "paypal", mode: "test" })).toContain("sandbox.paypal.com");
    for (const bad of [
      null,
      "http://www.paypal.com/",
      "https://www.paypal.com.evil.test/",
      "https://evil.test/?paypal.com",
      "https://user@www.paypal.com/",
      "https://www.sandbox.paypal.com/",
      "https://www.paypal.com:444/",
    ]) {
      expect(() => paymentUrl(bad, { provider: "paypal", mode: "live" })).toThrow();
    }
  });
  it("does not treat approval or an unrelated active account state as a confirmed payment", async () => {
    const pending = { amountMinor: 499, accountId: "acc_test", checkoutId: "chk_test", provider: "paypal" as const, mode: "live" as const };
    expect(await verifyPayment(setup({ paid: true }).session, pending)).toBe("pending");
    expect(await verifyPayment(setup({ approved: true }).session, pending)).toBe("pending");
  });
  it("distinguishes approved future billing from a paid and active subscription", async () => {
    const pending = { amountMinor: 499, accountId: "acc_test", checkoutId: "chk_test", provider: "paypal" as const, mode: "live" as const };
    expect(await verifyPayment(setup({ approved: true, billingStartAt: Date.now() + 86400000 }).session, pending)).toBe("scheduled");
    expect(await verifyPayment(setup({ paid: true, approved: true, purchaseConfirmed: true }).session, pending)).toBe("confirmed");
  });
  it("remembers the checkout only for its account and never accepts an id from an untrusted return URL", () => {
    const { kv } = setup();
    rememberPayment(kv, { accountId: "a", checkoutId: "chk_123", provider: "paypal", mode: "live" });
    expect(pendingPayment(kv, "a")?.checkoutId).toBe("chk_123");
    expect(pendingPayment(kv, "other")).toBeNull();
    forgetPayment(kv);
    expect(pendingPayment(kv, "a")).toBeNull();
    kv.setItem("meldiq.site.payment", "not-json");
    expect(pendingPayment(kv, "a")).toBeNull();
  });
});
