import { expect, test } from "@playwright/test";
import { FIXTURE_MOJO, FIXTURE_PLANS } from "./fixtures.mjs";

for (const delayed of ["plans", "benefits"] as const) {
  test(`pricing stays neutral while ${delayed} is unresolved`, async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(delayed === "plans" ? "**/v2/billing/plans" : "**/v2/mojo/catalog", async (route) => {
      await gate;
      await route.fulfill({ json: delayed === "plans" ? FIXTURE_PLANS : FIXTURE_MOJO });
    });
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Checking current plans…")).toBeVisible();
    await expect(page.locator(".plan-grid")).not.toContainText("not on sale");
    await expect(page.getByRole("button", { name: "Choose Meldiq Plus" })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const before = await page.locator(".plan.featured").boundingBox();
    release();
    await expect(page.getByRole("button", { name: "Choose Meldiq Plus" })).toBeVisible();
    const after = await page.locator(".plan.featured").boundingBox();
    expect(Math.abs(before!.height - after!.height)).toBeLessThan(2);
  });
}

test("a benefits failure is honest and retry recovers without enabling a purchase early", async ({ page }) => {
  let failed = true;
  await page.route("**/v2/mojo/catalog", (r) =>
    failed ? r.fulfill({ status: 503, json: { error: { code: "offline", message: "Temporary failure" } } }) : r.fulfill({ json: FIXTURE_MOJO }),
  );
  await page.goto("/pricing");
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn’t confirm");
  await expect(page.getByRole("button", { name: "Choose Meldiq Plus" })).toHaveCount(0);
  await expect(page.locator(".plan-grid")).not.toContainText("not on sale");
  failed = false;
  await page.getByRole("button", { name: "Retry loading plans" }).click();
  await expect(page.getByRole("button", { name: "Choose Meldiq Plus" })).toBeVisible();
});

test("developers have a single setup action, working index and copy control", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    }),
  );
  await page.goto("/developers");
  await expect(page.locator(".developer-intro .button.primary")).toHaveCount(1);
  await expect(page.locator(".developer-intro .button.primary")).toHaveAttribute("href", "https://web.meldiq.app/settings/developer");
  await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "SDKs & examples" }).click();
  await expect(page).toHaveURL(/#sdk$/);
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByRole("status")).toHaveText("Code copied.");
  expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toContain('import { MeldiqBot } from "./javascript/index.mjs"');
  await page.locator(".page-index summary").click();
  await expect(page.locator(".page-index details")).not.toHaveAttribute("open");
});

test("copy failure gives a manual fallback", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await page.goto("/developers");
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByRole("status")).toContainText("Select the code below");
});

test("Windows ARM keeps the browser recommendation and every platform choice", async ({ browser }) => {
  const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; ARM64)", viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.url()));
  await page.goto("http://127.0.0.1:4199/download");
  await expect(page.locator(".platform-card.suggested h2")).toHaveText("Web app");
  await expect(page.getByRole("link", { name: "Download for Windows", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get it on Google Play", exact: true })).toBeVisible();
  expect(downloads).toEqual([]);
  await context.close();
});

for (const route of [
  "/developers",
  "/download",
  "/features",
  "/pricing",
  "/tutorials",
  "/security",
  "/creators",
  "/partners",
  "/brand",
  "/roadmap",
  "/legal/privacy",
  "/es/chat-para-comunidades-gaming",
]) {
  test(`${route} has working on-page anchors, themes and a usable 320px layout`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(route);
    await page.getByRole("button", { name: "Switch to light mode", exact: true }).click();
    await expect(page.locator(".interior-site")).toHaveClass(/is-light/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const broken = await page
      .locator('main a[href^="#"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")!.slice(1)).filter((id) => id && !document.getElementById(id)));
    expect(broken).toEqual([]);
    await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
    await expect(page.locator(".interior-site")).not.toHaveClass(/is-light/);
  });
}
