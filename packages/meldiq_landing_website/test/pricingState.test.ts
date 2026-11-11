import { describe, expect, it } from "vitest";
import { pricingState } from "../src/lib/pricingState";
import { zMojoCatalog, zPublicPlans } from "../src/lib/api";
import { FIXTURE_MOJO, FIXTURE_PLANS } from "../e2e/fixtures.mjs";
const billing = { state: "ready", catalog: zPublicPlans.parse(FIXTURE_PLANS) } as const;
const benefits = { state: "ready", mojo: zMojoCatalog.parse(FIXTURE_MOJO) } as const;
describe("pricing availability requires both authoritative catalogs", () => {
  it("does not confuse either unresolved response with unavailable sales", () => {
    expect(pricingState(billing, { state: "loading" })).toBe("loading");
    expect(pricingState({ state: "loading" }, benefits)).toBe("loading");
    expect(pricingState({ state: "loading" }, { state: "loading" })).toBe("loading");
  });
  it("distinguishes failed or absent benefits from closed sales", () => {
    expect(pricingState(billing, { state: "error" })).toBe("error");
    expect(pricingState(billing, { state: "ready", mojo: null })).toBe("error");
    expect(pricingState({ state: "error", message: "offline" }, benefits)).toBe("error");
  });
  it("requires a compatible offer and preserves the existing purchase gate", () => {
    expect(pricingState(billing, benefits)).toBe("ready");
    expect(pricingState({ ...billing, catalog: { ...billing.catalog, available: false } }, benefits)).toBe("unavailable");
    expect(pricingState({ ...billing, catalog: { ...billing.catalog, plans: [] } }, benefits)).toBe("unavailable");
    expect(pricingState(billing, { ...benefits, mojo: { ...benefits.mojo, plans: [] } })).toBe("unavailable");
  });
});
