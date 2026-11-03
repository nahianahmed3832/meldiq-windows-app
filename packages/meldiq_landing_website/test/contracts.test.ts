import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FIXTURE_PLANS } from "../e2e/fixtures.mjs";
import { zEntitlements, zOwnerBilling, zPublicPlans } from "../src/lib/api";

/**
 * The website's view of the API against the server's own contracts, when the server's checkout is next to this one
 * (../meldiq_android/server). Skipped, and saying so, when it isn't.
 */
const SERVER_CONTRACTS = path.resolve(import.meta.dirname, "../../meldiq_android/server/src/shared/contracts/http/billing.ts");
const present = fs.existsSync(SERVER_CONTRACTS);

describe.skipIf(!present)("contracts shared with meldiq_android/server", () => {
  it("the fixtures the mock API serves are valid server answers", async () => {
    const server = await import(SERVER_CONTRACTS);
    expect(server.PublicPlans.safeParse(FIXTURE_PLANS).success).toBe(true);
  });

  it("the website accepts every answer the server's schemas allow (same fields, same types)", async () => {
    const server = await import(SERVER_CONTRACTS);
    const entitlements = {
      accountId: "acc_1",
      billing: { available: true, mode: "test" },
      personal: {
        plan: { key: "plus", name: "Mojo Plus" },
        standing: "entitled",
        accessUntil: 2,
        renews: false,
        quotaPlanId: null,
        subscription: null,
        trial: { source: "signup", endsAt: 2 },
      },
      organizations: [
        {
          orgId: "org_1",
          name: "Org",
          role: "OWNER",
          manageBilling: true,
          plan: { key: "team", name: "Team" },
          standing: "entitled",
          accessUntil: 1,
          renews: true,
          quotaPlanId: null,
          trial: null,
          subscription: { status: "active", provider: "stripe", interval: "month", currentPeriodEnd: 1, trialEnd: null, cancelAtPeriodEnd: false },
          limits: [{ key: "members", limit: 3, source: "plan" }],
        },
      ],
      revision: "abc",
      evaluatedAt: 1,
    };
    expect(server.AccountEntitlements.safeParse(entitlements).success).toBe(true);
    expect(zEntitlements.safeParse(entitlements).success).toBe(true);
    const billing = { available: true, reason: null, mode: "test", subscription: null, invoices: [], offers: FIXTURE_PLANS.plans, portal: false };
    expect(server.OwnerBilling.safeParse(billing).success).toBe(true);
    expect(zOwnerBilling.safeParse(billing).success).toBe(true);
    expect(zPublicPlans.safeParse(FIXTURE_PLANS).success).toBe(true);
  });
});
