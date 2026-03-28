import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  addDays: (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  },
  addWeeks: (date, weeks) => {
    const next = new Date(date);
    next.setDate(next.getDate() + weeks * 7);
    return next;
  },
  addMonths: (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  },
  getStartOfMonth: (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0)),
  getEndOfMonth: (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
}));

import { expandRecurringEvents } from "../../../../components/calendar/utils/recurrenceUtils";

describe("recurrenceUtils", () => {
  it("returns non-recurring events unchanged", () => {
    const event = {
      id: 1,
      recurrence: "none",
      start_time: "2026-03-10T09:00:00.000Z",
      end_time: "2026-03-10T10:00:00.000Z",
    };

    expect(expandRecurringEvents([event], new Date("2026-03-15T00:00:00.000Z"))).toEqual([event]);
  });

  it("treats missing recurrence as none and allows endless recurring events without an end date", () => {
    const plainEvent = {
      id: 10,
      start_time: "2026-03-05T09:00:00.000Z",
      end_time: "2026-03-05T10:00:00.000Z",
    };
    const weeklyNoEnd = {
      id: 11,
      recurrence: "weekly",
      start_time: "2026-03-05T09:00:00.000Z",
      end_time: "2026-03-05T10:00:00.000Z",
    };

    expect(expandRecurringEvents([plainEvent], new Date("2026-03-15T00:00:00.000Z"))).toEqual([plainEvent]);
    expect(expandRecurringEvents([weeklyNoEnd], new Date("2026-03-15T00:00:00.000Z")).map((event) => event.id)).toContain(
      "11_0",
    );
  });

  it("keeps unsupported recurrences only when they overlap the view range", () => {
    const overlapping = {
      id: 2,
      recurrence: "custom",
      start_time: "2026-03-20T09:00:00.000Z",
      end_time: "2026-03-20T10:00:00.000Z",
    };
    const outside = {
      id: 3,
      recurrence: "custom",
      start_time: "2026-05-20T09:00:00.000Z",
      end_time: "2026-05-20T10:00:00.000Z",
    };

    const result = expandRecurringEvents([overlapping, outside], new Date("2026-03-15T00:00:00.000Z"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2_0");
    expect(result[0]._baseId).toBe(2);
  });

  it("expands supported recurrences and skips exception dates", () => {
    const daily = {
      id: 4,
      recurrence: "daily",
      start_time: "2026-03-01T09:00:00.000Z",
      end_time: "2026-03-01T10:00:00.000Z",
      exception_dates: ["2026-03-02"],
      recurrence_end_date: "2026-03-03T00:00:00.000Z",
    };

    const result = expandRecurringEvents([daily], new Date("2026-03-15T00:00:00.000Z"));
    expect(result.map((event) => event.id)).toEqual(["4_0", "4_2"]);
  });

  it("reads nested recurrence exceptions and supports weekly/biweekly/monthly/yearly rules", () => {
    const weekly = {
      id: 5,
      recurrence: "weekly",
      start_time: "2026-03-01T09:00:00.000Z",
      end_time: "2026-03-01T10:00:00.000Z",
      recurrence_rule: { exception_dates: ["2026-03-08"] },
      recurrence_end_date: "2026-03-20T00:00:00.000Z",
    };
    const biweekly = {
      id: 6,
      recurrence: "biweekly",
      start_time: "2026-03-01T09:00:00.000Z",
      end_time: "2026-03-01T10:00:00.000Z",
      recurrence_end_date: "2026-03-31T00:00:00.000Z",
    };
    const monthly = {
      id: 7,
      recurrence: "monthly",
      start_time: "2026-03-10T09:00:00.000Z",
      end_time: "2026-03-10T10:00:00.000Z",
      recurrence_end_date: "2026-04-15T00:00:00.000Z",
    };
    const yearly = {
      id: 8,
      recurrence: "yearly",
      start_time: "2025-03-10T09:00:00.000Z",
      end_time: "2025-03-10T10:00:00.000Z",
      recurrence_end_date: "2027-03-15T00:00:00.000Z",
    };

    const march = new Date("2026-03-15T00:00:00.000Z");
    expect(expandRecurringEvents([weekly], march).map((event) => event.id)).toEqual(["5_0", "5_2"]);
    expect(expandRecurringEvents([biweekly], march).map((event) => event.id)).toEqual(["6_0", "6_1", "6_2"]);
    expect(expandRecurringEvents([monthly], march).map((event) => event.id)).toEqual(["7_0"]);
    expect(expandRecurringEvents([yearly], march).map((event) => event.id)).toEqual(["8_1"]);
  });

  it("includes a yearly occurrence created via addYears when the next year overlaps the view", () => {
    const yearly = {
      id: 9,
      recurrence: "yearly",
      start_time: "2025-04-05T09:00:00.000Z",
      end_time: "2025-04-05T10:00:00.000Z",
      recurrence_end_date: "2026-04-10T00:00:00.000Z",
    };

    expect(expandRecurringEvents([yearly], new Date("2026-03-15T00:00:00.000Z")).map((event) => event.id)).toEqual([
      "9_1",
    ]);
  });
});
