import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { zMojoCatalog, zPublicPlans } from "../src/lib/api";
import { BillingTerms } from "../src/components/BillingTerms";
import { FIXTURE_MOJO, FIXTURE_PLANS } from "../e2e/fixtures.mjs";

const monthly = zPublicPlans.parse(FIXTURE_PLANS).plans;
const onChoose = () => {};

describe("published billing terms", () => {
  it("preserves live term prices and explicit availability", () => {
    const catalog = zMojoCatalog.parse(FIXTURE_MOJO);
    expect(catalog.plusTerms?.map((t) => [t.key, t.amountMinor, t.available])).toEqual([
      ["monthly", 499, true],
      ["quarterly", 1299, false],
      ["yearly", 4999, false],
    ]);
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: catalog, offers: monthly, onChoose }));
    expect(html).toContain("$12.99");
    expect(html).toContain("$49.99");
    expect(html.match(/Not available yet/g)).toHaveLength(2);
    expect(html.match(/<a /g)).toHaveLength(1);
  });
  it("does not infer availability without a matching published offer", () => {
    const catalog = zMojoCatalog.parse({ ...FIXTURE_MOJO, plusTerms: (FIXTURE_MOJO.plusTerms ?? []).map(({ available: _available, ...term }) => term) });
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: catalog, offers: [], onChoose }));
    expect(html).not.toContain("<a ");
    const closed = renderToStaticMarkup(createElement(BillingTerms, { mojo: zMojoCatalog.parse(FIXTURE_MOJO), offers: [], onChoose }));
    expect(closed).not.toContain("<a ");
  });
  it("supports older catalogs without billing terms", () => {
    const { plusTerms: _terms, ...legacy } = FIXTURE_MOJO;
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: zMojoCatalog.parse(legacy), offers: [], onChoose }));
    expect(html).toBe("");
  });
});
