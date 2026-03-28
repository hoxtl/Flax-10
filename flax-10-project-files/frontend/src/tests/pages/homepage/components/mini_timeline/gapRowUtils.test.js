import { describe, it, expect, vi } from "vitest";
import {
  formatGapDuration,
  getGapMinHeight,
  getTinyGapMinHeight,
  getGapTimeLabel,
  getTinyGapTimeLabel,
  getGapRecommendationTitle,
} from "@/pages/homepage/components/mini_timeline/helpers/gapRowUtils";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({ formatHour12h: (h, m) => `${h}:${String(m).padStart(2, "0")}` }));
vi.mock("@/pages/homepage/utils/timelineUtils", () => ({ DAY_START_HOUR: 8 }));

describe("formatGapDuration", () => {
  it("formats minutes under an hour", () => expect(formatGapDuration(45)).toBe("45m"));
  it("formats exact hours", () => expect(formatGapDuration(120)).toBe("2h"));
  it("formats hours with remainder", () => expect(formatGapDuration(90)).toBe("1h 30m"));
});

describe("getGapMinHeight", () => {
  it("returns 56 for 0 minutes", () => expect(getGapMinHeight(0, 0)).toBe(56));
  it("returns at least 56 for positive minutes", () => expect(getGapMinHeight(20, 0)).toBeGreaterThanOrEqual(56));
  it("caps at 260", () => expect(getGapMinHeight(500, 0)).toBeLessThanOrEqual(260));
  it("handles hour crossings", () => expect(getGapMinHeight(90, 30)).toBeGreaterThan(getGapMinHeight(90, 0)));
});

describe("getTinyGapMinHeight", () => {
  it("returns 24 for 0 minutes", () => expect(getTinyGapMinHeight(0)).toBe(24));
  it("returns at least 24 for positive minutes", () => expect(getTinyGapMinHeight(10)).toBeGreaterThanOrEqual(24));
  it("caps at 44", () => expect(getTinyGapMinHeight(100)).toBe(44));
});

describe("getGapTimeLabel", () => {
  it("formats start minutes relative to DAY_START_HOUR", () => expect(getGapTimeLabel(60)).toBe("9:00"));
});

describe("getTinyGapTimeLabel", () => {
  it("pads hours and minutes", () => expect(getTinyGapTimeLabel(5)).toBe("08:05"));
  it("handles exact hour boundary", () => expect(getTinyGapTimeLabel(60)).toBe("09:00"));
});

describe("getGapRecommendationTitle", () => {
  it("returns task title", () => expect(getGapRecommendationTitle({ title: "Do work" })).toBe("Do work"));
  it("returns empty string when null", () => expect(getGapRecommendationTitle(null)).toBe(""));
});
