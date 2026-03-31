import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("../../../../components/calendar/utils/dateUtils");

import {
  addDays,
  addHourToTime,
  addMonths,
  addWeeks,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatDateWithYear,
  formatDayLabel,
  formatMonthYear,
  formatShortDate,
  formatTime,
  formatTimeRange,
  getEndOfMonth,
  getEndOfYear,
  getGreeting,
  getMonthDays,
  getMonthWeeks,
  getStartOfMonth,
  getStartOfWeek,
  getStartOfYear,
  getWeekDays,
  isSameDay,
  isSameMonth,
  isToday,
  overlapsDay,
  parseDateInput,
  startOfDay,
} from "../../../../components/calendar/utils/dateUtils";
import {
  handleDragOverEffect,
  parseDropPayload,
  setupDragStart,
} from "../../../../components/calendar/utils/dragUtils";
import { eventsOverlap } from "../../../../components/calendar/utils/overlapUtils";
import {
  calculateNewHeight,
  commitResize,
  createResizeSession,
} from "../../../../components/calendar/utils/resizeUtils";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("dateUtils", () => {
  it("builds week ranges from a local date", () => {
    const date = new Date("2026-03-18T15:45:00");
    const weekDays = getWeekDays(date);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0].getDay()).toBe(0);
    expect(weekDays[6].getDay()).toBe(6);

    const weekStart = getStartOfWeek(date);
    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
  });

  it("builds month ranges from a local date", () => {
    const date = new Date("2026-03-18T15:45:00");
    const monthDays = getMonthDays(date);
    const monthWeeks = getMonthWeeks(date);

    expect(getStartOfMonth(date).getDate()).toBe(1);
    expect(getEndOfMonth(date).getDate()).toBe(31);

    expect(monthDays.length % 7).toBe(0);
    expect(monthDays[0].getDay()).toBe(0);
    expect(monthDays.at(-1).getDay()).toBe(6);

    expect(monthWeeks).toHaveLength(monthDays.length / 7);
    expect(monthWeeks[0]).toHaveLength(7);
    expect(monthWeeks.at(-1)).toHaveLength(7);
  });

  it("builds year ranges from a local date", () => {
    const date = new Date("2026-03-18T15:45:00");
    expect(getStartOfYear(date).toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(getEndOfYear(date).toISOString().slice(0, 10)).toBe("2026-12-31");
  });

  it("handles day arithmetic and comparisons", () => {
    const today = new Date("2026-03-18T12:00:00");

    expect(addDays(today, 2).toISOString().slice(0, 10)).toBe("2026-03-20");
    expect(addWeeks(today, 2).toISOString().slice(0, 10)).toBe("2026-04-01");
    expect(addMonths(new Date("2026-01-18T12:00:00"), 2).getMonth()).toBe(2);

    expect(isSameDay(new Date("2026-03-18T01:00:00"), new Date("2026-03-18T23:59:00"))).toBe(true);
    expect(isSameMonth(new Date("2026-03-01T00:00:00"), new Date("2026-03-31T23:59:00"))).toBe(true);
    expect(isSameMonth(new Date("2026-03-31T23:59:00"), new Date("2026-04-01T00:00:00"))).toBe(false);
  });

  it("handles date parsing and normalization bounds", () => {
    expect(startOfDay(new Date("2026-03-18T18:20:00")).toISOString()).toBe(
      new Date("2026-03-18T00:00:00.000").toISOString(),
    );

    const parsed = parseDateInput("2026-03-21");
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMinutes()).toBe(0);
    expect(parseDateInput("")).toBeNull();
  });

  it("resolves relative labels and today checks correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T09:00:00"));
    const today = new Date("2026-03-18T12:00:00");
    const tomorrow = new Date("2026-03-19T12:00:00");

    expect(isToday(today)).toBe(true);
    expect(isToday(new Date("2026-03-17T23:59:59"))).toBe(false);

    expect(overlapsDay(new Date("2026-03-18T08:00:00"), new Date("2026-03-18T10:00:00"), today)).toBe(true);
    expect(overlapsDay(new Date("2026-03-17T22:00:00"), new Date("2026-03-18T00:00:00"), today)).toBe(false);

    expect(formatDayLabel(today)).toBe("Today");
    expect(formatDayLabel(tomorrow, today)).toBe(
      tomorrow.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    );
  });

  it("formats dates into varying semantic structures", () => {
    const date = new Date("2026-03-18T10:05:00");

    expect(formatDate(date)).toBe("Wed, 18 Mar");
    expect(formatShortDate(date)).toBe("18 Mar");
    expect(formatDateWithYear(date)).toBe("Wed, 18 Mar 2026");
    expect(formatMonthYear(date)).toBe("March 2026");
  });

  it("formats time outputs accurately and combined outputs", () => {
    const date = new Date("2026-03-18T10:05:00");

    expect(formatTime(date)).toBe(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
    expect(formatDateTime(date)).toBe(`${formatDate(date)} at ${formatTime(date)}`);
    expect(addHourToTime("23:05")).toBe("00:05");
  });

  it("formats date and time ranges for all-day, midnight, and multi-day events", () => {
    const allDayStart = "2026-03-18T00:00:00";
    const allDayEnd = "2026-03-19T00:00:00";
    const multiStart = "2026-03-18T10:00:00";
    const multiEnd = "2026-03-20T12:30:00";

    expect(formatDateRange(allDayStart, allDayEnd, true)).toBe(
      formatDateWithYear(new Date(allDayStart)),
    );
    expect(formatDateRange(allDayStart, allDayEnd, false)).toBe(
      formatDateWithYear(new Date(allDayStart)),
    );
    expect(formatDateRange(multiStart, multiEnd, false)).toBe(
      `${formatShortDate(new Date(multiStart))} – ${formatDateWithYear(new Date(multiEnd))}`,
    );

    expect(formatTimeRange(allDayStart, allDayEnd, true)).toBe("All day");
    expect(formatTimeRange(allDayStart, allDayEnd, false)).toBe("All day");
    expect(formatTimeRange(multiStart, multiEnd, false)).toBe(
      `${formatTime(new Date(multiStart))} - ${formatTime(new Date(multiEnd))}`,
    );
  });

  it("returns morning, afternoon, and evening greetings", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-03-18T09:00:00"));
    expect(getGreeting()).toBe("Good morning");

    vi.setSystemTime(new Date("2026-03-18T15:00:00"));
    expect(getGreeting()).toBe("Good afternoon");

    vi.setSystemTime(new Date("2026-03-18T20:00:00"));
    expect(getGreeting()).toBe("Good evening");
  });
});

describe("dragUtils", () => {
  it("parses accepted payloads and rejects unknown types or invalid JSON", () => {
    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify({ type: "event", data: { id: 1 } })),
    };

    expect(parseDropPayload({ dataTransfer }, ["event"])).toEqual({
      type: "event",
      data: { id: 1 },
    });
    expect(parseDropPayload({ dataTransfer }, ["task"])).toBeNull();
    expect(
      parseDropPayload(
        { dataTransfer: { getData: vi.fn().mockReturnValue("{not-json") } },
        ["event"],
      ),
    ).toBeNull();
  });

  it("writes drag data and applies the drag-over move effect", () => {
    const setData = vi.fn();
    const preventDefault = vi.fn();
    const event = {
      dataTransfer: {
        setData,
        effectAllowed: "",
        dropEffect: "",
      },
    };

    setupDragStart(event, "event", { id: 5 });
    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({ type: "event", data: { id: 5 } }),
    );
    expect(event.dataTransfer.effectAllowed).toBe("move");

    handleDragOverEffect({ preventDefault, dataTransfer: event.dataTransfer });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(event.dataTransfer.dropEffect).toBe("move");
  });
});

describe("resizeUtils", () => {
  it("snaps resized heights and enforces the minimum height", () => {
    expect(calculateNewHeight(60, 90, 60)).toBe(90);
    expect(calculateNewHeight(60, -200, 60)).toBe(15);
  });

  it("commits resized durations with both the event duration and fallback default", () => {
    const editEvent = vi.fn();

    commitResize({ id: 1, duration: 60 }, 30, editEvent);
    commitResize({ id: 2 }, -200, editEvent);

    expect(editEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 1, duration: 90 }));
    expect(editEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 2, duration: 15 }));
  });

  it("creates a resize session that clamps move events and removes listeners on mouseup", () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    createResizeSession(100, 40, { onMove, onEnd });

    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 80 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 140 }));
    document.dispatchEvent(new MouseEvent("mouseup", { clientY: 150 }));

    expect(onMove).toHaveBeenNthCalledWith(1, 30);
    expect(onMove).toHaveBeenNthCalledWith(2, 80);
    expect(onEnd).toHaveBeenCalledWith(50);

    const moveCallCount = onMove.mock.calls.length;
    document.dispatchEvent(new MouseEvent("mousemove", { clientY: 170 }));
    expect(onMove).toHaveBeenCalledTimes(moveCallCount);
  });
});

describe("overlapUtils", () => {
  it("treats invalid date ranges as non-overlapping", () => {
    expect(
      eventsOverlap(
        { id: 1, start_time: "not-a-date", end_time: "still-bad" },
        { id: 2, start_time: "2026-03-18T10:00:00Z", end_time: "2026-03-18T11:00:00Z" },
      ),
    ).toBe(false);
  });
});
