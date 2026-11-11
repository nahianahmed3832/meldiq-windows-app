import { expect, test } from "@playwright/test";

const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
test.skip(!id, "Enable the optional GA4 stream when building and running this test.");

test("opt-in sends sanitized public views and explicit download clicks", async ({ page }) => {
  const loaded: string[] = [];
  await page.route("https://www.googletagmanager.com/gtag/js?**", async (route) => {
    loaded.push(route.request().url());
    await route.fulfill({ contentType: "text/javascript", body: "/* Replace Google tag in the browser test. */" });
  });
  await page.route("https://play.google.com/**", (route) => route.fulfill({ body: "Play Store fixture" }));

  await page.goto("/download", { referer: "https://www.google.com/" });
  await expect(page.getByRole("button", { name: "Allow analytics" })).toBeVisible();
  expect(loaded).toEqual([]);
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => loaded.length).toBe(1);

  const commands = () => page.evaluate(() => {
    return (window.dataLayer ?? []).map((item) => Array.from(item as IArguments));
  });
  const entry = await commands();
  expect(entry).toContainEqual(["config", id, expect.objectContaining({ page_location: "https://meldiq.app/download", page_referrer: "https://www.google.com/" })]);
  expect(JSON.stringify(entry)).not.toMatch(/sensitive-fixture|example\.test|email=/);
  await page.getByRole("link", { name: "Get it on Google Play" }).evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
  await page.getByRole("link", { name: "Get it on Google Play" }).click();
  await expect.poll(commands).toContainEqual(["event", "play_store_click", expect.objectContaining({ platform: "android" })]);

  await page.goto("/features");
  await page.getByRole("link", { name: "Create a Free Account" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  expect(await commands()).toEqual([]);
});

test("declining analytics keeps Google code off subsequent public visits", async ({ page }) => {
  const loaded: string[] = [];
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    loaded.push(route.request().url());
    await route.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "No thanks" }).click();
  await page.goto("/download");
  await expect(page.getByRole("button", { name: "Analytics preferences" })).toBeVisible();
  expect(loaded).toEqual([]);
});

test("query URLs and detailed external referrers cannot load the tag", async ({ page }) => {
  const loaded: string[] = [];
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    loaded.push(route.request().url());
    await route.abort();
  });
  await page.goto("/download?email=fixture%40example.test");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect(page.getByRole("button", { name: "Analytics preferences" })).toBeVisible();
  expect(loaded).toEqual([]);
  await page.goto("/download", { referer: "https://www.google.com/search?q=sensitive-fixture" });
  await expect(page.getByRole("button", { name: "Analytics preferences" })).toBeVisible();
  // WebKit may discard the cross-origin path before the document receives it.
  if (await page.evaluate(() => document.referrer.includes("sensitive-fixture"))) expect(loaded).toEqual([]);
});
