import { describe, it, expect } from "vitest";
import {
  formatGapDuration,
  getGapMinHeight,
  getTinyGapMinHeight,
  getGapRecommendationTitle,
  getGapTimeLabel,
  getTinyGapTimeLabel,
} from "../../../../../pages/homepage/components/mini_timeline/helpers/gapRowUtils";
import { getConflictTimeLabel } from "../../../../../pages/homepage/components/mini_timeline/helpers/conflictRowUtils";

describe("gapRowUtils branch coverage", () => {
  it("covers hour-boundary height compensation and tiny-gap max cap", () => {
    expect(getGapMinHeight(45, 50)).toBeGreaterThan(56);
    expect(getTinyGapMinHeight(100)).toBe(44);
  });

  it("covers formatGapDuration and recommendation title edge cases", () => {
    expect(formatGapDuration(60)).toBe("1h");
    expect(getGapRecommendationTitle({})).toBe("");
  });

  it("covers gap duration, height, time labels, and conflict labels", () => {
    expect(formatGapDuration(130)).toBe("2h 10m");
    expect(formatGapDuration(120)).toBe("2h");
    expect(formatGapDuration(45)).toBe("45m");
    expect(getGapMinHeight(90, 30)).toBeGreaterThanOrEqual(56);
    expect(getGapMinHeight(0, 30)).toBe(56);
    expect(getGapMinHeight(500, 0)).toBe(260);
    expect(getTinyGapMinHeight(10)).toBeGreaterThanOrEqual(24);
    expect(getTinyGapMinHeight(0)).toBe(24);
    expect(getGapTimeLabel(60)).toBeTruthy();
    expect(getTinyGapTimeLabel(5)).toMatch(/^\d{2}:\d{2}$/);
    expect(getGapRecommendationTitle({ title: "Read chapter" })).toBe("Read chapter");
    expect(getGapRecommendationTitle(null)).toBe("");
    expect(getConflictTimeLabel({ startMins: 30 })).toBeTruthy();
  });
});
