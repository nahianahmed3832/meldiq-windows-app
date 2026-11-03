import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { zMojoCatalog } from "../src/lib/api";
import { BillingTerms } from "../src/components/BillingTerms";
import { FIXTURE_MOJO } from "../e2e/fixtures.mjs";

describe("published billing terms", () => {
  it("preserves live term prices and explicit availability", () => {
    const catalog = zMojoCatalog.parse(FIXTURE_MOJO);
    expect(catalog.plusTerms?.map((t) => [t.key, t.amountMinor, t.available])).toEqual([
      ["monthly", 499, true],
      ["quarterly", 1299, false],
      ["yearly", 4999, false],
    ]);
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: catalog, monthlyAvailable: true }));
    expect(html).toContain("$12.99");
    expect(html).toContain("$49.99");
    expect(html.match(/Not available yet/g)).toHaveLength(2);
    expect(html.match(/<a /g)).toHaveLength(1);
  });
  it("does not infer availability when the field is absent or monthly sales are closed", () => {
    const catalog = zMojoCatalog.parse({ ...FIXTURE_MOJO, plusTerms: (FIXTURE_MOJO.plusTerms ?? []).map(({ available: _available, ...term }) => term) });
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: catalog, monthlyAvailable: true }));
    expect(html).not.toContain("<a ");
    const closed = renderToStaticMarkup(createElement(BillingTerms, { mojo: zMojoCatalog.parse(FIXTURE_MOJO), monthlyAvailable: false }));
    expect(closed).not.toContain("<a ");
  });
  it("supports older catalogs without billing terms", () => {
    const { plusTerms: _terms, ...legacy } = FIXTURE_MOJO;
    const html = renderToStaticMarkup(createElement(BillingTerms, { mojo: zMojoCatalog.parse(legacy), monthlyAvailable: true }));
    expect(html).toBe("");
  });
});
