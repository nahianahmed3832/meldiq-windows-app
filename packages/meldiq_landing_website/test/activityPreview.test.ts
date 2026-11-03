import { describe, expect, it } from "vitest";
import { getActivityPreview } from "../src/lib/activityPreview";

describe("simulated activity preview", () => {
  it("stays in range and changes gently every minute, including segment and date boundaries", () => {
    const start = Date.UTC(2026, 0, 1);
    let previous = getActivityPreview(start - 60_000);
    for (let minute = 0; minute < 527_040; minute++) {
      const value = getActivityPreview(start + minute * 60_000);
      if (!Number.isInteger(value) || value < 200 || value > 2000 || value === previous || Math.abs(value - previous) > 17) {
        throw new Error(`Invalid activity at minute ${minute}: ${previous} → ${value}`);
      }
      previous = value;
    }
  });

  it("remains stable within the minute and across page loads", () => {
    const minute = Date.UTC(2026, 10, 1, 12, 0);
    expect(getActivityPreview(minute)).toBe(getActivityPreview(minute + 59_999));
    expect(getActivityPreview(minute)).toBe(getActivityPreview(minute));
  });
});
