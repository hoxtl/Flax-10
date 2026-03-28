import { describe, expect, it } from "vitest";

import {
  buildWeekLabels,
  getWeekIndexForDate,
} from "../../../../components/calendar/utils/weekUtils";

describe("weekUtils", () => {
  it("builds plain week labels when there is no reading week", () => {
    expect(buildWeekLabels(3, false, 1)).toEqual(["1", "2", "3"]);
  });

  it("inserts the reading week label at the configured index", () => {
    expect(buildWeekLabels(4, true, 2)).toEqual(["1", "2", "RW", "3", "4"]);
  });

  it("returns -1 before the schedule start, normal week indexes in range, and clamps to the max index", () => {
    const cfg = {
      startDate: "2026-01-05T00:00:00.000Z",
      totalWeeks: 4,
      hasReadingWeek: true,
    };

    expect(getWeekIndexForDate(new Date("2026-01-04T23:59:00.000Z"), cfg)).toBe(-1);
    expect(getWeekIndexForDate(new Date("2026-01-05T12:00:00.000Z"), cfg)).toBe(0);
    expect(getWeekIndexForDate(new Date("2026-01-19T12:00:00.000Z"), cfg)).toBe(2);
    expect(getWeekIndexForDate(new Date("2026-03-30T12:00:00.000Z"), cfg)).toBe(4);
  });

  it("computes the max index without a reading week", () => {
    expect(
      getWeekIndexForDate(new Date("2026-02-20T12:00:00.000Z"), {
        startDate: "2026-01-05T00:00:00.000Z",
        totalWeeks: 4,
        hasReadingWeek: false,
      }),
    ).toBe(3);
  });
});
