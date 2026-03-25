import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getHoursOfDay,
  formatHour,
  calculateEventStyle,
  calculateNewEndTime,
} from "../../components/Calendar/DayView/dayViewHelpers";

vi.mock("../../components/Calendar/utils/overlapUtils", () => ({
  getEventKey: vi.fn((event) => `${event.id}-${new Date(event.start_time).getTime()}-${new Date(event.end_time).getTime()}`),
  calculateEventColumns: vi.fn((events) => {
    const map = new Map();
    events.forEach((e, i) =>
      map.set(`${e.id}-${new Date(e.start_time).getTime()}-${new Date(e.end_time).getTime()}`, { column: i, totalColumns: events.length }),
    );
    return map;
  }),
}));

describe("getHoursOfDay", () => {
  it("returns array of 24 hours from 0 to 23", () => {
    const hours = getHoursOfDay();
    expect(hours).toHaveLength(24);
    expect(hours[0]).toBe(0);
    expect(hours[23]).toBe(23);
  });
});

describe("formatHour", () => {
  it("formats midnight as 12 AM", () => {
    expect(formatHour(0)).toBe("12 AM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatHour(12)).toBe("12 PM");
  });

  it("formats AM hours", () => {
    expect(formatHour(9)).toBe("9 AM");
    expect(formatHour(1)).toBe("1 AM");
  });

  it("formats PM hours", () => {
    expect(formatHour(13)).toBe("1 PM");
    expect(formatHour(23)).toBe("11 PM");
  });
});

describe("calculateEventStyle", () => {
  const slotHeight = 60;
  const baseEvent = {
    id: 1,
    start_time: "2026-01-01T10:00:00",
    end_time: "2026-01-01T11:00:00",
  };

  it("returns base style with single event (no overlap)", () => {
    const style = calculateEventStyle(baseEvent, slotHeight, [baseEvent]);
    expect(style.position).toBe("absolute");
    expect(style.width).toBe("100%");
    expect(style.left).toBe("0");
  });

  it("returns style with top based on start time", () => {
    // 10 hours * 60 slotHeight + 1 = 601px
    const style = calculateEventStyle(baseEvent, slotHeight, null);
    expect(style.top).toBe("601px");
  });

  it("returns style with height based on duration (1 hour = 60px - 2)", () => {
    const style = calculateEventStyle(baseEvent, slotHeight, null);
    expect(style.height).toBe("58px");
  });

  it("clips event to day boundaries when currentDate is provided", () => {
    const crossDayEvent = {
      id: 2,
      start_time: "2026-01-01T23:00:00",
      end_time: "2026-01-02T02:00:00",
    };
    const today = new Date("2026-01-01");
    const style = calculateEventStyle(crossDayEvent, slotHeight, null, today);
    // End is clipped to midnight, so duration should be 1 hour
    expect(style.height).toBe("58px");
  });

  it("applies layout when multiple events overlap", () => {
    const event2 = {
      id: 2,
      start_time: "2026-01-01T10:00:00",
      end_time: "2026-01-01T11:00:00",
    };
    const style = calculateEventStyle(baseEvent, slotHeight, [
      baseEvent,
      event2,
    ]);
    // With 2 columns, width should be 50%
    expect(style.width).toContain("50%");
  });
});

describe("calculateNewEndTime", () => {
  const event = {
    start_time: "2026-01-01T10:00:00",
    end_time: "2026-01-01T11:00:00",
  };
  const slotHeight = 60;
  const snapInterval = 15;

  it("calculates new end time from drag delta", () => {
    const newEnd = calculateNewEndTime(event, 30, slotHeight, snapInterval);
    // 30px / 60 * 60 = 30 minutes delta, snapped to 30 (nearest 15)
    expect(newEnd.getHours()).toBe(11);
    expect(newEnd.getMinutes()).toBe(30);
  });

  it("prevents new end time from being before start", () => {
    // Large negative delta that would go before start
    const newEnd = calculateNewEndTime(event, -200, slotHeight, snapInterval);
    // Should be at least snapInterval after start
    const start = new Date(event.start_time);
    expect(newEnd.getTime()).toBeGreaterThan(start.getTime());
  });

  it("snaps to interval boundaries", () => {
    // 7px delta with 60px/hr = 7 min, rounds to nearest 15 = 0 or 15
    const newEnd = calculateNewEndTime(event, 10, slotHeight, snapInterval);
    // 10/60*60 = 10 min, rounds to 15
    expect(newEnd.getMinutes() % 15).toBe(0);
  });
});
