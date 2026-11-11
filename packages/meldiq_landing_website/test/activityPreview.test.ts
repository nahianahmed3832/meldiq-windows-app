import { describe, expect, it } from "vitest";
import { ACTIVITY_PREVIEW_INTERVAL_MS, getActivityPreview } from "../src/lib/activityPreview";

describe("simulated activity preview", () => {
  it("changes every three minutes and stays between 150 and 300 inclusive", () => {
    const start = Date.UTC(2026, 0, 1);
    let previous = getActivityPreview(start - 1);
    for (let interval = 0; interval < 176_000; interval++) {
      const value = getActivityPreview(start + interval * ACTIVITY_PREVIEW_INTERVAL_MS);
      if (!Number.isInteger(value) || value < 150 || value > 300 || value === previous) {
        throw new Error(`Invalid activity at interval ${interval}: ${previous} → ${value}`);
      }
      previous = value;
    }
  });

  it("remains stable within the same interval across page loads", () => {
    const start = Date.UTC(2026, 10, 1, 12, 0);
    expect(getActivityPreview(start)).toBe(getActivityPreview(start + ACTIVITY_PREVIEW_INTERVAL_MS - 1));
  });
});
