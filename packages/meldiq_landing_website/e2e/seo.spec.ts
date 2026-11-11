import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

const origin = "https://meldiq.app";

test("every sitemap page is rendered, linked, and self-canonical", async ({ page, request }) => {
  test.setTimeout(90_000); // This test visits every public route; per-page tests retain their normal timeout.
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(sitemap.headers()["content-type"]).toContain("xml");
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  expect(urls.length).toBeGreaterThan(17);
  expect(new Set(urls).size).toBe(urls.length);

  const titles = new Set<string>();
  const links = new Set<string>();
  for (const url of urls) {
    const target = new URL(url!);
    expect(target.origin).toBe(origin);
    const response = await page.goto(target.pathname);
    expect(response?.status(), target.pathname).toBe(200);
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", url!);
    await expect(page.locator("meta[property='og:image']")).toHaveCount(1);
    await expect(page.locator("meta[name=robots][content*=noindex]")).toHaveCount(0);
    await expect(page.locator("main h1")).toHaveCount(1);
    titles.add(await page.title());
    for (const href of await page.locator("a[href^='/']").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")!))) {
      links.add(new URL(href, origin).pathname);
    }
  }
  expect(titles.size).toBe(urls.length);
  expect(urls.map((url) => new URL(url!).pathname).filter((path) => !links.has(path))).toEqual([]);
});

test("language alternates, robots, structured data and redirects work without JavaScript", async ({ page, request }) => {
  const en = "/gaming-community-chat";
  const es = "/es/chat-para-comunidades-gaming";
  for (const [path, lang] of [
    [en, "en"],
    [es, "es"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    for (const [language, alternate] of [
      ["en", en],
      ["es", es],
      ["x-default", en],
    ]) {
      await expect(page.locator(`link[rel=alternate][hreflang=${language}]`)).toHaveAttribute("href", origin + alternate);
    }
  }

  await page.goto("/");
  const schema = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(schema).toMatchObject({ "@type": "WebSite", name: "Meldiq", url: origin + "/" });

  for (const path of ["/account", "/account/billing", "/login", "/signup", "/forgot-password", "/verify-email", "/not-a-real-page"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === "/not-a-real-page" ? 404 : 200);
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", "noindex, nofollow");
    await expect(page.locator("link[rel=canonical]")).toHaveCount(0);
  }

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toBe(`User-agent: *\nDisallow: /v2/\nSitemap: ${origin}/sitemap.xml\n`);
  for (const path of ["/features/", "/features.html"]) {
    const redirect = await request.get(path + "?utm_source=test", { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers().location).toBe("/features?utm_source=test");
  }
});
