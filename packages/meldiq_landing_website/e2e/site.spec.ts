import { expect, type Page, test } from "@playwright/test";
const API = "http://127.0.0.1:8199";
const PUBLIC_PAGES = [
  ["/", /Your people,.*your channels.*[Oo]ne place to talk/],
  ["/features", /Everything you need.*to talk, together/],
  ["/pricing", /Free messaging.*Optional Mojo/],
  ["/download", /Download Meldiq/],
  ["/faq", /Questions, answered/],
  ["/support", /How can we help/],
  ["/legal/terms", /Terms of Service/],
  ["/legal/privacy", /Privacy Policy/],
  ["/legal/billing", /Mojo Plus: renewal, cancellation/],
  ["/legal/acceptable-use", /Acceptable Use Policy/],
  ["/legal/account-deletion", /Account deletion/],
] as const;
let seq = 0;
const unique = (name: string) => `${name}.${Date.now()}.${++seq}@example.test`;

async function account(page: Page, opts: { totp?: boolean; provider?: "paypal" | "stripe" } = {}) {
  const email = unique("buyer");
  await page.request.post(`${API}/__test/account`, { data: { email, password: "correct horse battery", name: "Buyer", ...opts } });
  return email;
}

async function signIn(page: Page, email: string, next = "") {
  await page.goto(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Signed in once the page has left the sign-in form (the session is saved before it navigates).
  await page.waitForURL((u) => u.pathname !== "/login");
}

test.describe("redesigned public pages", () => {
  for (const [path, heading] of PUBLIC_PAGES) {
    test(`${path} renders with metadata and fits the viewport`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.locator("header").getByRole("link", { name: "Plus", exact: true, includeHidden: true })).toHaveAttribute("href", "/pricing");
      await expect(page).toHaveTitle(/Meldiq/);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain("https://meldiq.app");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
  test("keeps security headers and avoids executable inline scripts", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
    await expect(page.locator("script:not([src]):not([type='application/json'])")).toHaveCount(0);
  });
  test("mobile navigation opens, closes with Escape, and follows links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(page.getByRole("button", { name: "Close navigation", exact: true })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Plus", exact: true }).click();
    await expect(page).toHaveURL(/pricing$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free messaging. Optional Mojo Plus.");
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toHaveAttribute("aria-expanded", "false");
  });
  test("FAQ combines search and category filters and resets empty results", async ({ page }) => {
    await page.goto("/faq");
    await page.getByRole("button", { name: "Privacy", exact: true }).click();
    await expect(page.locator(".faq-answers details")).toHaveCount(4);
    await page.getByRole("searchbox").fill("independent");
    await expect(page.locator(".faq-answers details")).toHaveCount(1);
    await page.locator("summary").click();
    await expect(page.locator("details")).toHaveAttribute("open", "");
    await page.getByRole("searchbox").fill("nomatch-123");
    await expect(page.getByText("No answers found.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clear search & filters" }).click();
    await expect(page.locator(".faq-answers details")).toHaveCount(31);
  });
  test("available downloads are real and planned platforms have no fake download", async ({ page }) => {
    await page.goto("/download");
    await expect(page.getByRole("link", { name: "Get it on Google Play", exact: true })).toHaveAttribute(
      "href",
      "https://play.google.com/store/apps/details?id=com.meldiq.android",
    );
    await expect(page.getByRole("link", { name: "Open Meldiq in your browser" })).toHaveAttribute("href", "https://web.meldiq.app/");
    await expect(page.getByRole("link", { name: "Download for Windows", exact: true })).toHaveAttribute("href", /\/downloads\/windows\/0\.2\.0\//);
    await expect(page.locator(".coming-card")).toHaveCount(2);
    await expect(page.locator(".coming-card a,.coming-card button")).toHaveCount(0);
  });
  test("closed sales show the approved Plus preview without Go or purchase buttons", async ({ page }) => {
    await page.route("**/v2/billing/plans", (r) => r.fulfill({ json: { available: false, mode: null, plans: [] } }));
    await page.goto("/pricing");
    await expect(page.getByRole("article", { name: "Mojo Go" })).toHaveCount(0);
    await expect(page.getByRole("article", { name: "Mojo Plus" })).toContainText("$3.99");
    await expect(page.getByRole("article", { name: "Mojo Plus" })).toContainText("Files up to 1,024 MB");
    await expect(page.getByRole("button", { name: /Choose Mojo/ })).toHaveCount(0);
    await expect(page.locator(".plan-grid")).not.toContainText("$0.99");
  });
  test("current catalog benefits and one-time Sparks match the app", async ({ page }) => {
    await page.goto("/pricing");
    const comparison = page.getByRole("table");
    await expect(comparison).toContainText("8,000");
    await expect(comparison).toContainText("2,000");
    await expect(comparison).toContainText("1,024 MB");
    await expect(comparison).toContainText("2K (1440p) 60 fps");
    await expect(comparison.getByRole("row", { name: /Bots you can make/ })).toContainText("10");
    await expect(page.locator(".spark-levels")).toContainText("20 sticker slots");
    await expect(page.getByText(/Extra Sparks are/)).toContainText("$0.99 each as a one-time purchase");
    await page.goto("/faq");
    await page.getByText("What is Meldiq Spark?", { exact: true }).click();
    await expect(page.locator("details[open]")).toContainText("$0.99 each as a one-time purchase");
  });
  test("community Bots+ stays separate from the personal subscription", async ({ page }) => {
    await page.route("**/v2/billing/plans", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.plans.push({
        key: "bots_plus",
        name: "Meldiq Bots+",
        description: "Premium bots for one community",
        audience: "organization",
        interval: "month",
        currency: "USD",
        amountMinor: 399,
        trialDays: 0,
        graceDays: 3,
        limits: {},
      });
      await route.fulfill({ response, json: body });
    });
    await page.goto("/pricing");
    const addon = page.getByRole("region", { name: "Meldiq Bots+" });
    await expect(addon).toContainText("$3.99 / month");
    await expect(addon.getByRole("link")).toHaveAttribute("href", "https://web.meldiq.app");
    await expect(page.locator(".plan-grid")).not.toContainText("Bots+");
  });
  test("failed price lookup does not claim sales are closed", async ({ page }) => {
    await page.route("**/v2/billing/plans", (r) =>
      r.fulfill({ status: 503, json: { error: { code: "unavailable", message: "Billing temporarily unavailable" } } }),
    );
    await page.goto("/pricing");
    await expect(page.locator(".notice")).toContainText("Check billing");
    await expect(page.getByRole("article", { name: "Mojo Plus" })).toContainText("Check availability");
  });
  test("legacy plans and stale limits cannot reopen purchases", async ({ page }) => {
    await page.route("**/v2/mojo/catalog", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.plans = body.plans.map((p: { key: string }) => (p.key === "plus" ? { ...p, uploadBytes: 2_000_000_000 } : p));
      await route.fulfill({ response, json: body });
    });
    await page.goto("/pricing?plan=go");
    await expect(page.getByRole("article", { name: "Mojo Go" })).toHaveCount(0);
    await expect(page.getByRole("article", { name: "Mojo Plus" })).toContainText("$3.99");
    await expect(page.getByRole("article", { name: "Mojo Plus" })).toContainText("Files up to 1,024 MB");
    await expect(page.getByRole("button", { name: /Choose Mojo/ })).toHaveCount(0);
    await expect(page.getByRole("table").locator("thead th")).toHaveCount(3);
  });
  test("console entitlement changes appear in the comparison", async ({ page }) => {
    await page.route("**/v2/mojo/catalog", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.plans = body.plans.map((p: { key: string }) => (p.key === "plus" ? { ...p, messageChars: 6123 } : p));
      await route.fulfill({ response, json: body });
    });
    await page.goto("/pricing");
    await expect(page.getByRole("table")).toContainText("6,123");
  });
  test("all header and footer destinations resolve", async ({ page, request }) => {
    await page.goto("/");
    const links = await page
      .locator("header a[href^='/'],footer a[href^='/']")
      .evaluateAll((nodes) => [...new Set(nodes.map((a) => a.getAttribute("href")!.split("#")[0]!))]);
    for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
  });
  test("legal drafts remain clearly marked", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.getByRole("note")).toContainText("Draft for review");
    await expect(page.locator(".placeholder").first()).toContainText("To be confirmed");
  });
  test("unknown route returns the existing 404", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/wandered off/);
  });
});

test.describe("existing checkout integration", () => {
  test("sends a signed-out visitor to sign in, then back to the plan", async ({ page }) => {
    const email = await account(page);
    await page.goto("/pricing");
    await page.getByRole("button", { name: "Choose Mojo Plus" }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct horse battery");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("dialog", { name: "Get Mojo Plus" })).toBeVisible();
  });

  test("states every term before payment, needs agreement, then hands over to Stripe", async ({ page }) => {
    const email = await account(page);
    await signIn(page, email, "/pricing");
    await page.getByRole("button", { name: "Choose Mojo Plus" }).click();
    const dialog = page.getByRole("dialog", { name: "Get Mojo Plus" });
    await expect(dialog).toContainText("$3.99 / month (USD)");
    await expect(dialog).toContainText("renews automatically");
    await expect(dialog).toContainText("No tax is added");
    // The account is in its 14-day trial: the first payment waits for its end.
    await expect(dialog).toContainText("You're in a free Mojo Plus period until");
    await expect(dialog).toContainText("Cancel any time");
    await expect(dialog).toContainText("the plan stops until a payment succeeds");
    await expect(dialog).not.toContainText("free trial");
    const pay = dialog.getByRole("button", { name: "Continue to payment" });
    await expect(pay).toBeDisabled();
    await dialog.getByRole("checkbox").check();
    await page.route("https://checkout.stripe.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<h1>Stripe test checkout</h1>" }));
    const request = page.waitForRequest((r) => r.url().endsWith("/v2/billing/checkout"));
    await pay.click();
    // The page names a plan only: never a price, an amount or an owner.
    expect((await request).postDataJSON()).toEqual({ planKey: "plus", returnTo: "site" });
    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\/c\/pay\//);
  });
});

test.describe("legal and business details from the admin console", () => {
  test("the legal and support pages show what operators filled in, and placeholders for the rest", async ({ page }) => {
    await page.route("**/v2/site/details", async (route) => {
      const res = await route.fetch();
      const body = await res.json();
      await route.fulfill({
        response: res,
        json: {
          ...body,
          operator: { ...body.operator, address: "1 Example Street, Wilmington, DE 19801, USA", jurisdiction: "Delaware, USA" },
          contacts: { ...body.contacts, supportEmail: "support@meldiq.test" },
          policies: { ...body.policies, refundRules: "First rule.\n\nSecond rule.", failedPaymentGraceDays: 7 },
          legalUpdatedOn: "2026-10-29",
        },
      });
    });
    await page.goto("/legal/billing");
    await expect(page.getByText("First rule.")).toBeVisible();
    await expect(page.getByText("Second rule.")).toBeVisible();
    await expect(page.getByText(/grace period of 7 days/)).toBeVisible();
    await expect(page.getByText("Last updated 2026-10-29.")).toBeVisible();
    await page.goto("/legal/terms");
    await expect(page.getByText(/1 Example Street, Wilmington, DE 19801, USA \(organised in Delaware, USA\)/)).toBeVisible();
    await expect(page.locator(".placeholder").first()).toBeVisible(); // governing law isn't decided
    await page.goto("/support");
    await expect(page.getByText("support@meldiq.test").first()).toBeVisible();
  });
});

test.describe("existing account trials and referrals", () => {
  test("the account page shows the trial and the personal invite link", async ({ page }) => {
    const email = await account(page);
    await signIn(page, email);
    await expect(page.getByText(/Your free Mojo Plus trial runs until/)).toBeVisible();
    await expect(page.getByText(/^1[34] days left$/)).toBeVisible();
    const link = page.getByLabel("Your invite link");
    await expect(link).toHaveValue(/^https:\/\/meldiq\.app\/signup\?ref=[A-Z0-9]+$/);
    await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
  });

  test("signing up through an invite link gives the new account 30 days and tells both", async ({ page }) => {
    const inviter = await account(page);
    const { code } = await (await page.request.post(`${API}/__test/refcode`, { data: { email: inviter } })).json();
    const email = unique("invited");
    await page.goto(`/signup?ref=${code}`);
    await expect(page.getByRole("status").filter({ hasText: "You were invited" })).toBeVisible();
    await page.getByLabel("Your name").fill("Invited Friend");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await expect(page.getByText("your invite gave you and your friend 30 days of Mojo Plus")).toBeVisible();
    await expect(page.getByText(/You joined through an invite: Mojo Plus is free until/)).toBeVisible();
  });
});

test.describe("accounts", () => {
  test("validates the sign-up form before sending anything", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
  });

  test("signs up, verifies the address and lands signed in", async ({ page }) => {
    const email = unique("new");
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("New Person");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/verify-email/);
    // The password went with us in memory: only the code is asked for.
    await expect(page.getByLabel("Password")).toHaveCount(0);
    await page.getByLabel("Verification code").fill("000000");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await expect(page.getByText("That code isn't right")).toBeVisible();
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await expect(page.getByRole("heading", { name: "Your account", level: 1 })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("shows the server's reasons for a refused sign-in, and asks for the two-step code", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(unique("nobody"));
    await page.getByLabel("Password").fill("wrong password!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator('.callout[role="alert"]')).toContainText("don't match an account");
    const email = await account(page, { totp: true });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct horse battery");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByLabel("Two-step sign-in code").fill("654321");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Your account", level: 1 })).toBeVisible();
  });

  test("keeps signed-out visitors away from account pages, and never follows an outside next", async ({ page }) => {
    await page.goto("/account/billing");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fbilling/);
    const email = await account(page);
    await signIn(page, email, "https://evil.example/");
    await expect(page).toHaveURL(/\/account$/);
  });

  test("resets a password with an emailed code", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(unique("reset"));
    await page.getByRole("button", { name: "Send a code" }).click();
    await page.getByLabel("Code from the email").fill("ABCDE-FGHJK");
    await page.getByLabel("New password").fill("another long passphrase");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("Your password is changed")).toBeVisible();
  });
});

test.describe("PayPal integration", () => {
  test("reviews PayPal, preserves the checkout, and verifies future billing after return", async ({ page }) => {
    const email = await account(page, { provider: "paypal" });
    await signIn(page, email, "/pricing");
    await page.getByRole("button", { name: "Choose Mojo Plus" }).click();
    const dialog = page.getByRole("dialog", { name: "Get Mojo Plus" });
    const pay = dialog.getByRole("button", { name: "Continue to PayPal" });
    await expect(pay).toBeDisabled();
    await expect(dialog).toContainText("Payment is handled securely by PayPal");
    await dialog.getByRole("checkbox").check();
    await page.route("https://www.sandbox.paypal.com/**", (r) => r.fulfill({ contentType: "text/html", body: "<h1>Mock PayPal approval</h1>" }));
    await pay.click();
    await expect(page).toHaveURL(/^https:\/\/www\.sandbox\.paypal\.com\//);
    await page.goto("/account/billing?checkout=success");
    await expect(page.getByRole("status").filter({ hasText: "PayPal confirmed your subscription approval" })).toBeVisible();
    await expect(page.getByText("Your subscription is active.", { exact: false })).toHaveCount(0);
  });
  test("cancels renewal only after confirmation and preserves paid access", async ({ page }) => {
    const email = await account(page, { provider: "paypal" });
    await page.request.post(`${API}/__test/activate`, { data: { email, planKey: "plus" } });
    await signIn(page, email, "/account/billing");
    await page.getByRole("button", { name: "Cancel subscription", exact: true }).click();
    await expect(page.getByText("Cancel automatic renewal?", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Confirm cancellation", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Renewal is canceled" })).toBeVisible();
    await expect(page.getByText("Canceled: you keep the plan", { exact: false })).toBeVisible();
  });
});

test.describe("billing page", () => {
  test("waits for the server after Stripe, rather than trusting the return address", async ({ page }) => {
    const email = await account(page);
    await signIn(page, email);
    await page.goto("/account/billing?checkout=success");
    await expect(page.getByText("Confirming your payment")).toBeVisible();
    await expect(page.getByText("Free", { exact: true })).toBeVisible();
    // The provider's confirmation reaches the server (the mock stands in for the verified webhook).
    await page.request.post(`${API}/__test/activate`, { data: { email, planKey: "plus" } });
    await expect(page.getByText("Your subscription is active")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("definition").filter({ hasText: "Mojo Plus" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Paid" })).toBeVisible();
  });

  test("shows the billing status after leaving checkout", async ({ page }) => {
    const email = await account(page);
    await signIn(page, email);
    await page.goto("/account/billing?checkout=canceled");
    await expect(page.getByText("Checkout was closed. Check your subscription status below before trying again.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mojo Plus", exact: true, level: 2 })).toBeVisible();
  });
});
