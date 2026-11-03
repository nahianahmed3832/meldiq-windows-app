import { describe, expect, it } from "vitest";
import { FIXTURE_MOJO, FIXTURE_PLANS } from "../e2e/fixtures.mjs";
import { subscriptionOffers, subscriptionPreview } from "../src/lib/subscription";

describe("approved subscription rollout", () => {
  const plus = FIXTURE_PLANS.plans[0]!;
  it("never offers Go, old pricing, yearly billing, or organization plans for a new purchase", () => {
    const stale = [
      { ...plus, key: "go", amountMinor: 99 },
      { ...plus, amountMinor: 499 },
      { ...plus, interval: "year" as const },
      { ...plus, audience: "organization" as const },
      { ...plus, currency: "EUR" },
      plus,
    ];
    expect(subscriptionOffers(stale, FIXTURE_MOJO)).toEqual([plus]);
  });
  it("keeps purchases closed until the actual server upload limit matches, even if marketing is updated", () => {
    const old = { ...FIXTURE_MOJO, plans: FIXTURE_MOJO.plans.map((p) => (p.key === "plus" ? { ...p, uploadBytes: 2_000_000_000 } : p)) };
    expect(subscriptionOffers([plus], old)).toEqual([]);
    expect(subscriptionOffers([plus], null)).toEqual([]);
    expect(subscriptionPreview(old).plans.find((p) => p.key === "plus")?.uploadBytes).toBe(1_024_000_000);
    expect(subscriptionPreview(old).enforced).toBe(false);
    expect(old.plans.find((p) => p.key === "plus")?.uploadBytes).toBe(2_000_000_000);
  });
  it("shows Free and Plus, preserving community Spark benefits and other catalog values", () => {
    const preview = subscriptionPreview(FIXTURE_MOJO);
    expect(preview.plans.map((p) => p.key)).toEqual(["free", "plus"]);
    expect(preview.spark).toEqual(FIXTURE_MOJO.spark);
    expect(preview.plans[1]?.messageChars).toBe(FIXTURE_MOJO.plans.find((p) => p.key === "plus")?.messageChars);
  });
});
