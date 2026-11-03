import { describe, expect, it } from "vitest";
import { ApiError, endpoints, request, zPublicPlans, type Offer } from "../src/lib/api";
import { formatBytes, formatDate, formatMoney, formatPrice, minorDigits, monthlyEquivalent } from "../src/lib/money";
import { describeGrant, describeLimits, disclosures, intervalsFor, limitName, offersFor, statusLabel } from "../src/lib/plans";
import { rememberSignup, takeSignupPassword } from "../src/lib/pendingSignup";
import { isPending, OPERATOR, PENDING, pendingDetails } from "../src/lib/site";
import { check, emailSchema, nameSchema, passwordSchema, safeNext } from "../src/lib/validation";

const offer = (o: Partial<Offer> = {}): Offer => ({
  key: "plus",
  name: "Plus",
  description: "",
  audience: "personal",
  interval: "month",
  currency: "USD",
  amountMinor: 500,
  trialDays: 0,
  graceDays: 0,
  limits: {},
  ...o,
});

describe("money", () => {
  it("formats minor units with each currency's own decimals, never floating-point drift", () => {
    expect(minorDigits("USD")).toBe(2);
    expect(minorDigits("JPY")).toBe(0);
    expect(minorDigits("KWD")).toBe(3);
    expect(formatMoney(500, "USD")).toBe("$5.00");
    expect(formatMoney(1999, "EUR")).toBe("€19.99");
    expect(formatMoney(500, "JPY")).toBe("¥500");
    expect(formatMoney(1234, "KWD")).toMatch(/1\.234/);
    expect(formatPrice(5000, "USD", "year")).toBe("$50.00 / year");
  });

  it("shows a yearly price per month only as a rounded-down comparison", () => {
    expect(monthlyEquivalent(5000, "year")).toBe(416);
    expect(monthlyEquivalent(500, "month")).toBe(500);
  });

  it("formats dates in UTC and sizes in binary units", () => {
    expect(formatDate(Date.UTC(2026, 9, 28, 23, 59))).toBe("October 28, 2026");
    expect(formatBytes(53687091200)).toBe("50 GB");
    expect(formatBytes(512)).toBe("512 bytes");
  });

  it("falls back for a code Intl doesn't know", () => {
    expect(minorDigits("not a currency")).toBe(2);
    expect(formatMoney(150, "zzz")).toMatch(/1\.50/);
  });
});

describe("plans", () => {
  const offers = [
    offer(),
    offer({ key: "plus-y", interval: "year", amountMinor: 5000 }),
    offer({ key: "team", audience: "organization", amountMinor: 1200 }),
    offer({ key: "cheap", amountMinor: 300 }),
  ];

  it("groups offers by audience and interval, cheapest first", () => {
    expect(offersFor(offers, "personal", "month").map((o) => o.key)).toEqual(["cheap", "plus"]);
    expect(intervalsFor(offers, "personal")).toEqual(["month", "year"]);
    expect(intervalsFor(offers, "organization")).toEqual(["month"]);
  });

  it("describes only limits it knows", () => {
    expect(describeLimits({ members: 250, "storage.bytes": 1073741824, "roles.custom": 10, "made.up": 1 })).toEqual([
      "Up to 250 members (guests included)",
      "1 GB of stored files",
      "Up to 10 custom roles",
    ]);
    expect(limitName("members")).toBe("Members");
    expect(limitName("unknown")).toBe("unknown");
  });

  it("discloses price, currency, renewal, tax, cancellation and failed payments before paying", () => {
    const d = disclosures(offer({ trialDays: 7, graceDays: 3 })).join(" ");
    expect(d).toContain("$5.00 / month (USD)");
    expect(d).toContain("renews automatically");
    expect(d).toContain("No tax is added");
    expect(d).toContain("7-day free trial");
    expect(d).toContain("Cancel any time");
    expect(d).toContain("for 3 days while the payment is retried");
    expect(d).toContain("never deletes");
    expect(disclosures(offer({ trialDays: 7 }), false).join(" ")).not.toContain("free trial");
    expect(disclosures(offer({ graceDays: 1 })).join(" ")).toContain("for 1 day while");
    expect(disclosures(offer()).join(" ")).toContain("the plan stops until a payment succeeds");
  });

  it("tells someone in a free period that the first payment waits for its end", () => {
    const end = Date.UTC(2026, 10, 12);
    const d = disclosures(offer({ trialDays: 7 }), true, end).join(" ");
    expect(d).toContain("free Meldiq Plus period until November 12, 2026");
    expect(d).not.toContain("7-day free trial");
  });

  it("describes trials and invite bonuses", () => {
    const base = { quotaPlanId: null, subscription: null, standing: "entitled" as const, renews: false, plan: { key: "plus", name: "Meldiq Plus" } };
    const at = Date.UTC(2026, 10, 12);
    expect(describeGrant({ ...base, accessUntil: at, trial: { source: "signup", endsAt: at } })).toBe(
      "Your free Meldiq Plus trial runs until November 12, 2026.",
    );
    expect(describeGrant({ ...base, accessUntil: at, trial: { source: "invite", endsAt: at } })).toMatch(/joined through an invite/);
    expect(describeGrant({ ...base, accessUntil: at, trial: { source: "gift", endsAt: at } })).toMatch(/a gift from a friend/);
    expect(describeGrant({ ...base, accessUntil: at, trial: { source: "operator", endsAt: at } })).toMatch(/from the Meldiq team/);
    expect(describeGrant({ ...base, accessUntil: at, trial: { source: "invite_bonus", endsAt: at } })).toMatch(/friends you invited/);
  });

  it("explains each standing in plain words", () => {
    const base = { quotaPlanId: null, subscription: null };
    const at = Date.UTC(2026, 10, 30);
    expect(describeGrant({ ...base, plan: null, standing: "none", accessUntil: null, renews: null })).toMatch(/Free/);
    expect(describeGrant({ ...base, plan: { key: "p", name: "Plus" }, standing: "entitled", accessUntil: at, renews: true })).toBe(
      "Plus renews on November 30, 2026.",
    );
    expect(describeGrant({ ...base, plan: { key: "p", name: "Plus" }, standing: "entitled", accessUntil: at, renews: false })).toMatch(
      /ends on November 30, 2026 and won't renew/,
    );
    expect(describeGrant({ ...base, plan: { key: "p", name: "Plus" }, standing: "entitled", accessUntil: null, renews: true })).toMatch(/active/);
    expect(describeGrant({ ...base, plan: { key: "p", name: "Plus" }, standing: "grace", accessUntil: at, renews: false })).toMatch(/payment failed/i);
    expect(describeGrant({ ...base, plan: null, standing: "grace_ended", accessUntil: null, renews: null })).toMatch(/grace period is over/);
    expect(describeGrant({ ...base, plan: null, standing: "not_entitled", accessUntil: null, renews: null })).toMatch(/free limits/);
    expect(statusLabel("past_due")).toBe("Payment failed");
    expect(statusLabel("something_new")).toBe("something_new");
  });
});

describe("validation", () => {
  it("matches the server's account rules", () => {
    expect(check({ email: emailSchema, password: passwordSchema, name: nameSchema }, { email: "a@b.co", password: "0123456789", name: "A" })).toEqual({});
    expect(check({ email: emailSchema, password: passwordSchema, name: nameSchema }, { email: "nope", password: "short", name: " " })).toEqual({
      email: "Enter an email address like name@example.com.",
      password: "Use at least 10 characters.",
      name: "Enter your name.",
    });
    expect(passwordSchema.safeParse("x".repeat(129)).success).toBe(false);
    expect(nameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });

  it("follows only same-site paths after signing in", () => {
    expect(safeNext("/pricing?plan=x")).toBe("/pricing?plan=x");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", undefined, ["/a"]])
      expect(safeNext(bad)).toBe("/account");
  });

  it("hands the sign-up password to the next step once, for the same address only", () => {
    rememberSignup("A@x.test", "secret-pass-1");
    expect(takeSignupPassword("b@x.test")).toBeNull();
    rememberSignup("A@x.test", "secret-pass-1");
    expect(takeSignupPassword("a@x.test")).toBe("secret-pass-1");
    expect(takeSignupPassword("a@x.test")).toBeNull();
  });
});

describe("site details", () => {
  it("marks every unconfirmed business detail as a placeholder, and finds them", () => {
    expect(OPERATOR.legalName).toBe("GRIIPBUDDY LLC");
    const { legalName: _confirmed, ...rest } = OPERATOR;
    expect(Object.values(rest).every(isPending)).toBe(true);
    expect(isPending("support@example.test")).toBe(false);
    expect(pendingDetails(`a ${PENDING("x")} b ${PENDING("y")} ${PENDING("x")}`)).toEqual(["[To be confirmed: x]", "[To be confirmed: y]"]);
  });
});

describe("api requests", () => {
  const respond = (status: number, body: unknown) => async () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  it("validates answers and sends tokens only as a bearer header to this origin's API", async () => {
    let seen: { url: string; init?: RequestInit } | null = null;
    const plans = { available: false, mode: null, plans: [] };
    const r = await request("/v2/billing/plans", zPublicPlans, { token: "tok" }, async (url, init) => {
      seen = { url, init };
      return respond(200, plans)();
    });
    expect(r).toEqual(plans);
    expect(seen!.url).toBe("/v2/billing/plans");
    expect((seen!.init!.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(seen!.init!.credentials).toBe("omit");
    await expect(request("https://evil.example/v2/x", zPublicPlans)).rejects.toThrow(/Not an API path/);
  });

  it("turns the error envelope, bad answers and network failures into ApiErrors", async () => {
    await expect(endpoints.plans(respond(409, { error: { code: "billing_unavailable", message: "No provider" } }))).rejects.toMatchObject({
      status: 409,
      code: "billing_unavailable",
      message: "No provider",
    });
    await expect(endpoints.plans(respond(500, "oops"))).rejects.toMatchObject({ code: "unexpected" });
    await expect(endpoints.plans(respond(200, { plans: "nope" }))).rejects.toMatchObject({ code: "unexpected_answer" });
    await expect(
      endpoints.plans(async () => {
        throw new TypeError("offline");
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("treats an API without billing routes as nothing on sale, not as a failure", async () => {
    expect(await endpoints.plans(respond(404, { error: { code: "not_found", message: "Not found" } }))).toEqual({ available: false, mode: null, plans: [] });
  });

  it("names the website as the sign-in's device label", async () => {
    let body: unknown;
    await endpoints
      .login({ email: "a@b.co", password: "p" }, async (_u, init) => {
        body = JSON.parse(String(init?.body));
        return respond(401, { error: { code: "invalid_credentials", message: "no" } })();
      })
      .catch(() => undefined);
    expect(body).toEqual({ email: "a@b.co", password: "p", deviceName: "Meldiq website" });
  });
});

describe("site details from the console", () => {
  it("print the console's values, and placeholders for what isn't decided", async () => {
    const { operatorFrom, FALLBACK } = await import("../src/lib/details");
    expect(operatorFrom(null)).toEqual(FALLBACK);
    const op = operatorFrom({
      operator: { legalName: "GRIIPBUDDY LLC", address: "1 Main St", jurisdiction: "Delaware, USA", registration: null, governingLaw: null },
      contacts: { supportEmail: "help@example.com", privacyEmail: null, dpo: null },
      policies: {
        minimumAge: 16,
        refundWindowDays: 1,
        refundRules: "One.\n\n  Two.  \n",
        failedPaymentGraceDays: 0,
        legalBases: null,
        billingRecordRetention: null,
        transferSafeguards: null,
      },
      legalUpdatedOn: "2026-10-29",
    });
    expect(op).toMatchObject({
      address: "1 Main St (organised in Delaware, USA)",
      supportEmail: "help@example.com",
      minimumAge: "16 years old",
      refundWindow: "1 day",
      refundRules: ["One.", "Two."],
      gracePeriod: "0 days",
      legalUpdated: "2026-10-29",
    });
    expect(op.governingLaw).toMatch(/^\[To be confirmed:/);
    expect(op.privacyEmail).toMatch(/^\[To be confirmed:/);
  });
});
