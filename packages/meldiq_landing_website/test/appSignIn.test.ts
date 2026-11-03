import { describe, expect, it } from "vitest";
import { appSignInDestination } from "../src/lib/appSignIn";

describe("central application sign-in", () => {
  it("preserves Plus and account-management intent with first-party paths", () => {
    expect(appSignInDestination("/pricing?plan=plus")).toBe("https://web.meldiq.app/settings/mojo");
    expect(appSignInDestination("/account/billing")).toBe("https://web.meldiq.app/settings/billing");
    expect(appSignInDestination("/account")).toBe("https://web.meldiq.app/settings/account");
  });
  it("rejects external URLs, duplicate next parameters and unapproved query values", () => {
    for (const next of [
      "https://evil.example/",
      "//evil.example/",
      "/pricing?plan=plus&token=secret",
      "/account/billing?redirect=https://evil.example",
      ["/account", "https://evil.example/"],
      undefined,
    ]) {
      expect(appSignInDestination(next)).toBe("https://web.meldiq.app/");
    }
  });
});
