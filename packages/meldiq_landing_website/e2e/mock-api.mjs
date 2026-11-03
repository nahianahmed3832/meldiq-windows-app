/**
 * A stand-in for the Meldiq API's account and billing routes, for the website's browser tests and local previews. Its
 * answers follow the server's contracts (test/contracts.test.ts checks the fixtures against the server's own schemas);
 * the real behaviour is tested in meldiq_android/server (test/billing_stripe.test.ts). Nothing here talks to Stripe:
 * checkout and portal URLs point at https://checkout.stripe.com, which the tests intercept.
 *   node e2e/mock-api.mjs 8099
 */
import http from "node:http";
import { FIXTURE_MOJO, FIXTURE_PLANS, FIXTURE_SITE } from "./fixtures.mjs";

const port = Number(process.argv[2] ?? 8099);
const accounts = new Map(); // email -> { id, email, name, password, verified, plan: null | {...}, orgs: [] }
const tokens = new Map(); // access or refresh token -> email
let n = 0;

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const fail = (res, status, code, message) => json(res, status, { error: { code, message } });

function grant(a) {
  const access = `acc_tok_${++n}_${"x".repeat(24)}`;
  const refresh = `ref_tok_${n}_${"y".repeat(24)}`;
  tokens.set(access, a.email);
  tokens.set(refresh, a.email);
  return {
    accessToken: access,
    accessTokenExpiresAt: Date.now() + 15 * 60_000,
    refreshToken: refresh,
    refreshTokenExpiresAt: Date.now() + 30 * 86_400_000,
    session: { id: `ses_${n}`, deviceId: null, createdAt: Date.now() },
    account: { id: a.id, email: a.email, name: a.name, createdAt: 1, legacyLinkedAt: null, selectedWorkspaceId: null, identity: null },
  };
}

const DAY = 86_400_000;

function grantView(a) {
  if (!a.plan && a.trialEndsAt) {
    const plus = FIXTURE_PLANS.plans.find((p) => p.key === "plus");
    return {
      plan: { key: "plus", name: plus.name },
      standing: "entitled",
      accessUntil: a.trialEndsAt,
      renews: false,
      quotaPlanId: null,
      subscription: null,
      trial: { source: a.trialSource, endsAt: a.trialEndsAt },
    };
  }
  if (!a.plan) return { plan: null, standing: "none", accessUntil: null, renews: null, quotaPlanId: null, subscription: null, trial: null };
  return {
    trial: null,
    plan: { key: a.plan.key, name: a.plan.name },
    standing: "entitled",
    accessUntil: a.plan.periodEnd,
    renews: true,
    quotaPlanId: null,
    subscription: {
      status: "active",
      provider: a.provider ?? "stripe",
      interval: a.plan.interval,
      currentPeriodEnd: a.plan.periodEnd,
      trialEnd: null,
      cancelAtPeriodEnd: a.canceled ?? false,
    },
  };
}

function billing(a, audience) {
  const offers = FIXTURE_PLANS.plans.filter((p) => p.audience === audience);
  const sub = a.plan
    ? {
        plan: { key: a.plan.key, name: a.plan.name },
        status: "active",
        standing: "entitled",
        interval: a.plan.interval,
        currency: a.plan.currency,
        amountMinor: a.plan.amountMinor,
        currentPeriodEnd: a.plan.periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: a.canceled ?? false,
      }
    : null;
  const invoices = a.plan
    ? [
        {
          status: "paid",
          currency: a.plan.currency,
          amountDueMinor: a.plan.amountMinor,
          amountPaidMinor: a.plan.amountMinor,
          amountRefundedMinor: 0,
          periodStart: Date.now(),
          periodEnd: a.plan.periodEnd,
          issuedAt: Date.now(),
          paidAt: Date.now(),
        },
      ]
    : [];
  return {
    provider: a.provider ?? "stripe",
    available: true,
    reason: null,
    mode: "test",
    subscription: sub,
    invoices,
    offers,
    portal: a.provider !== "paypal" && !!a.customer,
  };
}

const readBody = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        resolve(b ? JSON.parse(b) : {});
      } catch {
        resolve(null);
      }
    });
  });

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const body = req.method === "POST" ? await readBody(req) : {};
    if (body === null) return fail(res, 400, "bad_request", "Unreadable body");
    const auth = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    const me = tokens.has(auth) && auth.startsWith("acc_") ? accounts.get(tokens.get(auth)) : null;
    const route = `${req.method} ${url.pathname}`;

    switch (route) {
      case "GET /v2/billing/plans":
        return json(res, 200, FIXTURE_PLANS);
      case "GET /v2/mojo/catalog":
        return json(res, 200, FIXTURE_MOJO);
      case "GET /v2/site/details":
        return json(res, 200, FIXTURE_SITE);
      case "POST /v2/auth/register": {
        if (accounts.has(body.email)) return fail(res, 409, "email_taken", "That email already has a Meldiq account. Use another address, or sign in with it.");
        accounts.set(body.email, {
          id: `acc_${++n}`,
          email: body.email,
          name: body.name,
          password: body.password,
          verified: false,
          plan: null,
          customer: false,
          orgs: [],
        });
        return json(res, 202, { status: "verification_sent" });
      }
      case "POST /v2/auth/email/verify": {
        const a = accounts.get(body.email);
        if (!a || body.code !== "123456" || body.password !== a.password)
          return fail(res, 400, "invalid_code", "That code isn't right, or it has expired. Ask for a new one.");
        a.verified = true;
        return json(res, 200, { verified: true });
      }
      case "POST /v2/auth/email/resend":
        return json(res, 202, { status: "sent_if_pending" });
      case "POST /v2/auth/login": {
        const a = accounts.get(body.email);
        if (!a || a.password !== body.password) return fail(res, 401, "invalid_credentials", "That email and password don't match an account.");
        if (!a.verified) return fail(res, 403, "email_unverified", "Verify your email first: enter the code we sent you.");
        if (a.totp && body.totpCode !== "654321") return fail(res, 401, "totp_required", "Enter the code from your authenticator app.");
        return json(res, 200, grant(a));
      }
      case "POST /v2/auth/refresh": {
        const email = tokens.get(body.refreshToken);
        if (!email) return fail(res, 401, "unauthorized", "Sign in again.");
        return json(res, 200, grant(accounts.get(email)));
      }
      case "POST /v2/auth/password/forgot":
        return json(res, 202, { status: "sent_if_registered" });
      case "POST /v2/auth/password/reset":
        return body.code === "ABCDE-FGHJK"
          ? json(res, 200, { ok: true })
          : fail(res, 400, "invalid_code", "That code isn't right, or it has expired. Ask for a new one.");
      // Test helper: make an account verified, with two-step sign-in or an organization it owns.
      case "POST /__test/account": {
        accounts.set(body.email, {
          id: `acc_${++n}`,
          email: body.email,
          name: body.name ?? "Test",
          password: body.password,
          verified: true,
          totp: !!body.totp,
          provider: body.provider ?? "stripe",
          plan: null,
          customer: false,
          orgs: body.orgs ?? [],
        });
        return json(res, 200, { ok: true });
      }
      // Test helper: an account's invite code (made as the server would, on first use).
      case "POST /__test/refcode": {
        const a = accounts.get(body.email);
        a.refCode ??= `REF${String(++n).padStart(7, "7")}`;
        return json(res, 200, { code: a.refCode });
      }
      case "POST /__test/activate": {
        const a = accounts.get(body.email);
        const p = FIXTURE_PLANS.plans.find((x) => x.key === body.planKey);
        a.plan = { ...p, periodEnd: Date.now() + 30 * 86_400_000 };
        return json(res, 200, { ok: true });
      }
    }

    if (!me) return fail(res, 401, "unauthorized", "Authentication required");
    // Like the server: an account's 14-day trial starts at sign-up (here, the first time it's looked at).
    if (!me.trialEndsAt) {
      me.trialEndsAt = Date.now() + 14 * DAY;
      me.trialSource = "signup";
    }
    me.refCode ??= `REF${String(++n).padStart(7, "7")}`;
    switch (route) {
      case "GET /v2/billing/referral":
        return json(res, 200, {
          available: true,
          code: me.refCode,
          invited: me.invited ?? 0,
          bonusDaysThisYear: Math.min(90, 30 * (me.invited ?? 0)),
          yearlyCapDays: 90,
          daysEach: 30,
        });
      case "POST /v2/billing/referral/claim": {
        const inviter = [...accounts.values()].find((x) => x.refCode === String(body.code ?? "").toUpperCase());
        if (!inviter) return fail(res, 404, "not_found", "That invite link isn't valid");
        if (inviter === me) return fail(res, 409, "conflict", "You can't use your own invite link");
        if (me.referred) return fail(res, 409, "conflict", "This account already joined through an invite link");
        me.referred = true;
        me.trialEndsAt = Date.now() + 30 * DAY;
        me.trialSource = "invite";
        inviter.invited = (inviter.invited ?? 0) + 1;
        return json(res, 200, { inviteeEndsAt: me.trialEndsAt, inviterDays: 30 });
      }
      case "POST /v2/auth/logout":
        tokens.delete(auth);
        return json(res, 200, { ok: true });
      case "GET /v2/billing/entitlements":
        return json(res, 200, {
          accountId: me.id,
          billing: { available: true, mode: "test" },
          personal: grantView(me),
          organizations: me.orgs.map((o) => ({
            orgId: o.orgId,
            name: o.name,
            role: o.role,
            manageBilling: o.role === "OWNER",
            ...grantView({ plan: null }),
            limits: [{ key: "members", limit: null, source: "none" }],
          })),
          revision: `rev${me.plan ? 1 : 0}`,
          evaluatedAt: Date.now(),
        });
      case "GET /v2/billing/paypal/config":
        return json(res, 200, {
          provider: "paypal",
          environment: "sandbox",
          clientId: "test-public-client",
          billingStartAt: me.trialEndsAt,
          subscriptions: true,
          cards: false,
        });
      case "POST /v2/billing/paypal/cancel":
        if (me.provider !== "paypal" || !me.plan) return fail(res, 404, "not_found", "No PayPal subscription");
        if (body.confirm !== true) return fail(res, 400, "bad_request", "Confirmation required");
        me.canceled = true;
        return json(res, 200, { confirmed: true, accessUntil: me.plan.periodEnd, status: "active" });
      case "GET /v2/billing/account":
        return json(res, 200, billing(me, "personal"));
      case "POST /v2/billing/checkout": {
        const keys = Object.keys(body);
        if (keys.some((k) => !["planKey", "orgId", "returnTo"].includes(k))) return fail(res, 400, "bad_request", "Unexpected field");
        const p = FIXTURE_PLANS.plans.find((x) => x.key === body.planKey);
        if (!p || (p.audience === "organization") !== !!body.orgId) return fail(res, 404, "not_found", "No such plan");
        if (body.orgId && !me.orgs.some((o) => o.orgId === body.orgId && o.role === "OWNER"))
          return fail(res, 403, "forbidden", "Only the community's owners manage its billing");
        me.customer = true;
        me.lastCheckout = body;
        me.checkoutId = `chk_${++n}`;
        return json(res, 200, {
          checkoutId: me.checkoutId,
          url:
            me.provider === "paypal"
              ? `https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=MOCK_${n}`
              : `https://checkout.stripe.com/c/pay/cs_test_${n}`,
          expiresAt: Date.now() + 86_400_000,
        });
      }
      case "POST /v2/billing/portal":
        if (!me.customer) return fail(res, 404, "not_found", "There is no billing account to manage yet");
        return json(res, 200, { url: "https://billing.stripe.test/p/session/1" });
      case "POST /v2/billing/sync":
        return json(res, 200, { checked: me.plan ? 1 : 0 });
    }
    if (req.method === "GET" && url.pathname.startsWith("/v2/billing/paypal/checkouts/")) {
      if (url.pathname.split("/").pop() !== me.checkoutId) return fail(res, 404, "not_found", "Purchase not found");
      return json(res, 200, {
        id: me.checkoutId,
        product: "plus",
        providerRef: "I-MOCK",
        status: me.plan ? "active" : "incomplete",
        confirmed: !!me.plan,
        approved: !me.plan,
        currency: "USD",
        amountMinor: 499,
        interval: "month",
        expiresAt: Date.now() + 100000,
      });
    }
    if (req.method === "GET" && url.pathname.startsWith("/v2/billing/orgs/")) {
      const orgId = url.pathname.split("/").pop();
      const org = me.orgs.find((o) => o.orgId === orgId);
      if (!org) return fail(res, 404, "not_found", "Organization not found");
      if (org.role !== "OWNER") return fail(res, 403, "forbidden", "Only the community's owners manage its billing");
      return json(res, 200, billing({ plan: null, customer: false }, "organization"));
    }
    return fail(res, 404, "not_found", "Not found");
  })
  .listen(port, "127.0.0.1", () => console.log(`mock Meldiq API on http://127.0.0.1:${port}`));
