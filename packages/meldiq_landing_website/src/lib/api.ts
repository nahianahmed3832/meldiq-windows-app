import { z } from "zod";

/**
 * The Meldiq API as this website uses it: the same account API (v2) every Meldiq client uses, on the same origin (nginx
 * proxies /v2 to the API; `next dev` does in development). Answers are validated with schemas that mirror the server's
 * contracts (meldiq_android/server/src/shared/contracts/http/billing.ts and accounts.ts); test/contracts.test.ts checks
 * the mirror against the server's own schemas when that checkout is next to this one.
 */

const zLimits = z.record(z.string(), z.number());

export const zOffer = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  audience: z.enum(["personal", "organization"]),
  interval: z.enum(["month", "year"]),
  billingFrequency: z.number().int().positive().optional(),
  term: z.enum(["monthly", "quarterly", "yearly"]).nullable().optional(),
  currency: z.string(),
  amountMinor: z.number().int().nonnegative(),
  trialDays: z.number().int().nonnegative(),
  graceDays: z.number().int().nonnegative(),
  limits: zLimits,
});
export type Offer = z.infer<typeof zOffer>;

/** The free periods on offer (API 0.53.0; absent from older APIs, null while trials are off). */
export const zTrialOffer = z.object({ planKey: z.string(), days: z.number(), referralDays: z.number(), referralYearlyCapDays: z.number() });
export type TrialOffer = z.infer<typeof zTrialOffer>;

export const zPublicPlans = z.object({
  available: z.boolean(),
  mode: z.enum(["test", "live"]).nullable(),
  plans: z.array(zOffer),
  trial: zTrialOffer.nullable().optional(),
});
export type PublicPlans = z.infer<typeof zPublicPlans>;

const zSubscriptionView = z.object({
  plan: z.object({ key: z.string(), name: z.string() }),
  status: z.string(),
  standing: z.string(),
  interval: z.enum(["month", "year"]),
  currency: z.string(),
  amountMinor: z.number(),
  currentPeriodEnd: z.number().nullable(),
  trialEnd: z.number().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export const zInvoice = z.object({
  status: z.string(),
  currency: z.string(),
  amountDueMinor: z.number(),
  amountPaidMinor: z.number(),
  amountRefundedMinor: z.number(),
  periodStart: z.number().nullable(),
  periodEnd: z.number().nullable(),
  issuedAt: z.number(),
  paidAt: z.number().nullable(),
});
export type Invoice = z.infer<typeof zInvoice>;

export const zOwnerBilling = z.object({
  provider: z.string().nullable().optional(),
  available: z.boolean(),
  reason: z.string().nullable(),
  mode: z.enum(["test", "live"]).nullable(),
  subscription: zSubscriptionView.nullable(),
  invoices: z.array(zInvoice),
  offers: z.array(zOffer),
  portal: z.boolean(),
});
export type OwnerBilling = z.infer<typeof zOwnerBilling>;

const zGrant = {
  plan: z.object({ key: z.string(), name: z.string() }).nullable(),
  /** A free period giving the plan: the account's trial, an invite, an invite bonus (API 0.53.0), a friend's gift (0.54.0), or days from the Meldiq team ("operator", 0.58.0). */
  trial: z
    .object({ source: z.enum(["signup", "invite", "invite_bonus", "gift", "operator"]), endsAt: z.number() })
    .nullable()
    .optional(),
  standing: z.enum(["entitled", "grace", "grace_ended", "not_entitled", "none"]),
  accessUntil: z.number().nullable(),
  renews: z.boolean().nullable(),
  quotaPlanId: z.string().nullable(),
  subscription: z
    .object({
      status: z.string(),
      provider: z.string(),
      interval: z.enum(["month", "year"]),
      currentPeriodEnd: z.number().nullable(),
      trialEnd: z.number().nullable(),
      cancelAtPeriodEnd: z.boolean(),
    })
    .nullable(),
};

export const zEntitlements = z.object({
  accountId: z.string(),
  billing: z.object({ available: z.boolean(), mode: z.enum(["test", "live"]).nullable() }),
  personal: z.object(zGrant),
  organizations: z.array(
    z.object({
      orgId: z.string(),
      name: z.string(),
      role: z.string(),
      manageBilling: z.boolean(),
      ...zGrant,
      limits: z.array(z.object({ key: z.string(), limit: z.number().nullable(), source: z.string() })),
    }),
  ),
  revision: z.string(),
  evaluatedAt: z.number(),
});
export type Entitlements = z.infer<typeof zEntitlements>;
export type Grant = Entitlements["personal"];

export const zAccountView = z.object({ id: z.string(), email: z.string(), name: z.string(), createdAt: z.number() });
export type AccountView = z.infer<typeof zAccountView>;

export const zSessionGrant = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.number(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.number(),
  session: z.object({ id: z.string() }),
  account: zAccountView,
});
export type SessionGrant = z.infer<typeof zSessionGrant>;

export const zCheckoutStarted = z.object({ checkoutId: z.string(), url: z.string().nullable(), expiresAt: z.number() });
export const zPortal = z.object({ url: z.string() });
export const zSynced = z.object({ checked: z.number() });
const zAnything = z.unknown();

const zErrorEnvelope = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

/** A failed request: the server's error code and its plain-words message (or a network failure, code "network"). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  token?: string | null;
}

/** One JSON request to the API on this origin, validated with [schema]. Never sends a token anywhere else. */
export async function request<T>(path: string, schema: z.ZodType<T>, opts: RequestOptions = {}, fetcher: Fetcher = fetch): Promise<T> {
  if (!path.startsWith("/v2/")) throw new Error(`Not an API path: ${path}`);
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  let res: Response;
  try {
    res = await fetcher(path, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network", "Meldiq can't be reached right now. Check your connection and try again.");
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = zErrorEnvelope.safeParse(json);
    if (e.success) throw new ApiError(res.status, e.data.error.code, e.data.error.message);
    throw new ApiError(res.status, "unexpected", "Something went wrong on our side. Try again in a moment.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiError(res.status, "unexpected_answer", "The server's answer wasn't what this page expected. Reload and try again.");
  return parsed.data;
}

export const zReferral = z.object({
  available: z.boolean(),
  code: z.string(),
  invited: z.number(),
  bonusDaysThisYear: z.number(),
  yearlyCapDays: z.number(),
  daysEach: z.number(),
});
export type Referral = z.infer<typeof zReferral>;
export const zReferralClaimed = z.object({ inviteeEndsAt: z.number(), inviterDays: z.number() });

/** The catalog before Meldiq Plus is published (and from an API without billing routes yet): nothing on sale. */
export const NOTHING_ON_SALE: PublicPlans = { available: false, mode: null, plans: [] };

/** Whether [e] says the API has no billing routes (an API older than 0.52.0): treated as "not on sale yet", not a fault. */
export function billingNotDeployed(e: unknown): boolean {
  return e instanceof ApiError && e.status === 404;
}

/** The endpoints this site calls, in one place. */
export const endpoints = {
  plans: (f?: Fetcher) =>
    request("/v2/billing/plans", zPublicPlans, {}, f).catch((e: unknown) => {
      if (billingNotDeployed(e)) return NOTHING_ON_SALE;
      throw e;
    }),
  register: (body: { name: string; email: string; password: string }, f?: Fetcher) => request("/v2/auth/register", zAnything, { method: "POST", body }, f),
  verifyEmail: (body: { email: string; code: string; password: string }, f?: Fetcher) =>
    request("/v2/auth/email/verify", zAnything, { method: "POST", body }, f),
  resendCode: (email: string, f?: Fetcher) => request("/v2/auth/email/resend", zAnything, { method: "POST", body: { email } }, f),
  login: (body: { email: string; password: string; totpCode?: string }, f?: Fetcher) =>
    request("/v2/auth/login", zSessionGrant, { method: "POST", body: { ...body, deviceName: "Meldiq website" } }, f),
  refresh: (refreshToken: string, f?: Fetcher) => request("/v2/auth/refresh", zSessionGrant, { method: "POST", body: { refreshToken } }, f),
  logout: (token: string, f?: Fetcher) => request("/v2/auth/logout", zAnything, { method: "POST", token }, f),
  forgotPassword: (email: string, f?: Fetcher) => request("/v2/auth/password/forgot", zAnything, { method: "POST", body: { email } }, f),
  resetPassword: (body: { email: string; code: string; newPassword: string }, f?: Fetcher) =>
    request("/v2/auth/password/reset", zAnything, { method: "POST", body }, f),
};

/**
 * Meldiq Plus's perks and Meldiq Spark's levels (GET /v2/mojo/catalog, API 0.54.0; numbers operators may change in the
 * console since 0.58.0). Only the fields the site shows are checked; anything else the API adds is ignored.
 */
const zPlanPerks = z.object({
  key: z.string(),
  name: z.string(),
  messageChars: z.number(),
  uploadBytes: z.number(),
  screen: z.array(z.string()),
  sparks: z.number(),
  badge: z.string().nullable(),
  check: z.boolean(),
  customItems: z.number(),
  bots: z.number().optional(),
});
const zSparkLevel = z.object({
  level: z.number(),
  sparks: z.number(),
  emojiSlots: z.number(),
  stickerSlots: z.number().optional(),
  uploadBytes: z.number().nullable(),
  voiceKbps: z.number(),
  screen: z.array(z.string()),
});
const zPrice = z.object({ currency: z.string(), amountMinor: z.number() }).nullable();
/** Published terms. A configured price alone never enables a purchase. */
export const zPlusTerm = z.object({
  key: z.enum(["monthly", "quarterly", "yearly"]),
  months: z.number().int().positive(),
  amountMinor: z.number().int().nonnegative(),
  interval: z.enum(["month", "year"]),
  billingFrequency: z.number().int().positive(),
  currency: z.string(),
  available: z.boolean().optional(),
});
export type PlusTerm = z.infer<typeof zPlusTerm>;
export const zMojoCatalog = z.object({
  version: z.string(),
  plans: z.array(zPlanPerks),
  screenPresets: z.array(z.object({ id: z.string(), label: z.string() })),
  spark: z.object({ listPriceMinor: z.number(), interval: z.string(), maxPurchase: z.number(), levels: z.array(zSparkLevel) }),
  gifts: z.object({ months: z.array(z.number()) }),
  enforced: z.boolean().optional(),
  plusTerms: z.array(zPlusTerm).optional(),
  onSale: z.object({ plus: zPrice.nullish(), spark: zPrice.optional(), gifts: z.boolean().optional() }).partial().optional(),
});
export type MojoCatalog = z.infer<typeof zMojoCatalog>;
export type PlanPerks = MojoCatalog["plans"][number];
export type SparkLevel = MojoCatalog["spark"]["levels"][number];

/** The Mojo catalog, or null from an API without it (older than 0.54.0). */
export function mojoCatalog(f?: Fetcher): Promise<MojoCatalog | null> {
  return request("/v2/mojo/catalog", zMojoCatalog, {}, f).catch((e: unknown) => {
    if (billingNotDeployed(e)) return null;
    throw e;
  });
}

/** Who runs Meldiq and its policies, as set in the admin console (GET /v2/site/details, API 0.60.0; null: not decided). */
const zText = z.string().nullable();
export const zSiteDetails = z.object({
  operator: z.object({ legalName: zText, address: zText, jurisdiction: zText, registration: zText, governingLaw: zText }),
  contacts: z.object({ supportEmail: zText, privacyEmail: zText, dpo: zText }),
  policies: z.object({
    minimumAge: z.number().nullable(),
    refundWindowDays: z.number().nullable(),
    refundRules: zText,
    failedPaymentGraceDays: z.number().nullable(),
    legalBases: zText,
    billingRecordRetention: zText,
    transferSafeguards: zText,
  }),
  legalUpdatedOn: z.string(),
});
export type SiteDetails = z.infer<typeof zSiteDetails>;

/** The site details, or null from an API without them (older than 0.60.0). */
export function siteDetails(f?: Fetcher): Promise<SiteDetails | null> {
  return request("/v2/site/details", zSiteDetails, {}, f).catch((e: unknown) => {
    if (billingNotDeployed(e)) return null;
    throw e;
  });
}
