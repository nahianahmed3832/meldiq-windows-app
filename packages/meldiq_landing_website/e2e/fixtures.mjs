/**
 * Example answers of the Meldiq API used by the mock API and checked against the server's contracts
 * (test/contracts.test.ts). They follow the owner's decision of 2026-11-01: Meldiq Mojo, one personal plan: Meldiq Plus at $4.99 a month with 1 GB uploads. Free periods are server grants (14-day trial, 30 days through an invite link, up to 90 bonus days a year), not Stripe trials. What is sold comes only from the published catalog.
 */
export const FIXTURE_PLANS = {
  available: true,
  mode: "test",
  plans: [
    {
      key: "plus",
      name: "Meldiq Plus",
      description: "",
      audience: "personal",
      interval: "month",
      currency: "USD",
      amountMinor: 499,
      trialDays: 0,
      graceDays: 0,
      limits: {},
    },
  ],
  trial: { planKey: "plus", days: 14, referralDays: 30, referralYearlyCapDays: 90 },
};

/** Closed-sales fixture for unavailable or unpublished plans. */
export const EMPTY_PLANS = { available: false, mode: null, plans: [] };

/** Current production entitlements and Spark interval in test mode; legacy Go remains to exercise filtering. */
export const FIXTURE_MOJO = {
  version: "2026-11-01.2",
  units: { mb: 1000000, gb: 1000000000 },
  plans: [
    {
      key: "free",
      name: "Free",
      listPriceMinor: 0,
      messageChars: 2000,
      uploadBytes: 50000000,
      screen: ["720p60"],
      sparks: 0,
      badge: null,
      check: false,
      customItems: 20,
      bots: 2,
      botReview: "regular",
    },
    {
      key: "go",
      name: "Mojo Go",
      listPriceMinor: 99,
      messageChars: 2000,
      uploadBytes: 200000000,
      screen: ["720p60"],
      sparks: 1,
      badge: "go",
      check: false,
      customItems: 50,
      bots: 4,
      botReview: "regular",
    },
    {
      key: "plus",
      name: "Meldiq Plus",
      listPriceMinor: 499,
      messageChars: 8000,
      uploadBytes: 1000000000,
      screen: ["1440p60"],
      sparks: 2,
      badge: "plus",
      check: true,
      customItems: 250,
      bots: 10,
      botReview: "priority",
    },
  ],
  screenPresets: [
    { id: "720p30", label: "720p 30 fps", width: 1280, height: 720, fps: 30 },
    { id: "720p60", label: "720p 60 fps", width: 1280, height: 720, fps: 60 },
    { id: "1080p30", label: "1080p 30 fps", width: 1920, height: 1080, fps: 30 },
    { id: "1080p60", label: "1080p 60 fps", width: 1920, height: 1080, fps: 60 },
    { id: "1440p30", label: "2K (1440p) 30 fps", width: 2560, height: 1440, fps: 30 },
    { id: "1440p60", label: "2K (1440p) 60 fps", width: 2560, height: 1440, fps: 60 },
  ],
  spark: {
    listPriceMinor: 99,
    interval: "one_time",
    maxPurchase: 20,
    levels: [
      { level: 0, sparks: 0, emojiSlots: 50, stickerSlots: 20, uploadBytes: null, voiceKbps: 48, screen: [] },
      { level: 1, sparks: 2, emojiSlots: 100, stickerSlots: 20, uploadBytes: 50000000, voiceKbps: 128, screen: ["720p30"] },
      { level: 2, sparks: 5, emojiSlots: 200, stickerSlots: 20, uploadBytes: 200000000, voiceKbps: 256, screen: ["1080p60"] },
      { level: 3, sparks: 8, emojiSlots: 500, stickerSlots: 20, uploadBytes: 1000000000, voiceKbps: 384, screen: ["1080p60", "1440p30"] },
    ],
  },
  gifts: { months: [1, 3, 12], noteMax: 280 },
  enforced: true,
  onSale: {
    mode: "test",
    go: null,
    plus: { currency: "USD", amountMinor: 499 },
    spark: { currency: "USD", amountMinor: 99 },
    botsPlus: { currency: "USD", amountMinor: 399 },
    gifts: false,
  },
};

export const FIXTURE_SITE = {
  operator: { legalName: "GRIIPBUDDY LLC", address: null, jurisdiction: null, registration: null, governingLaw: null },
  contacts: { supportEmail: null, privacyEmail: null, dpo: null },
  policies: {
    minimumAge: null,
    refundWindowDays: 14,
    refundRules: null,
    failedPaymentGraceDays: null,
    legalBases: null,
    billingRecordRetention: null,
    transferSafeguards: null,
  },
  legalUpdatedOn: "2026-10-28",
};
