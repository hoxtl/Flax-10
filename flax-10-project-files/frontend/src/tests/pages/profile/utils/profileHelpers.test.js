import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildFullName,
  buildInitials,
  getFilteredEvents,
  getRangeLabel,
  getUpcomingCount,
  RANGE_OPTIONS,
} from "../../../../pages/profile/utils/profileHelpers";

describe("profileHelpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters events relative to a provided base date and sorts them", () => {
    const events = [
      { id: 2, start_time: "2026-03-28T08:00:00Z" },
      { id: 1, start_time: "2026-03-26T08:00:00Z" },
      { id: 3, start_time: "2026-04-05T08:00:00Z" },
    ];

    expect(getFilteredEvents(events, "today", "2026-03-26T00:00:00Z").map((event) => event.id)).toEqual([1]);
    expect(getFilteredEvents(events, "week", "2026-03-26T00:00:00Z").map((event) => event.id)).toEqual([1, 2]);
    expect(getFilteredEvents(events, "month", "2026-03-26T00:00:00Z").map((event) => event.id)).toEqual([1, 2, 3]);
  });

  it("returns safe empty results when there are no events", () => {
    expect(getFilteredEvents(null, "today")).toEqual([]);
    expect(getUpcomingCount([])).toBe(0);
  });

  it("counts upcoming events within the current month", () => {
    expect(
      getUpcomingCount([
        { start_time: "2026-03-27T09:00:00Z" },
        { start_time: "2026-04-27T09:00:00Z" },
      ]),
    ).toBe(1);
  });

  it("maps range labels and leaves unknown labels untouched", () => {
    expect(RANGE_OPTIONS).toEqual([
      ["today", "Today"],
      ["week", "This Week"],
      ["month", "This Month"],
    ]);
    expect(getRangeLabel("today")).toBe("Today");
    expect(getRangeLabel("week")).toBe("This Week");
    expect(getRangeLabel("month")).toBe("This Month");
    expect(getRangeLabel("custom-range")).toBe("custom-range");
  });

  it("builds initials from names and falls back when needed", () => {
    expect(buildInitials({ name: "Ada Lovelace" })).toBe("AL");
    expect(buildInitials({ first_name: "Ada", last_name: "Lovelace" })).toBe("AL");
    expect(buildInitials({})).toBe("?");
  });

  it("builds display names from the available fields", () => {
    expect(buildFullName({ name: "Ada Lovelace" })).toBe("Ada Lovelace");
    expect(buildFullName({ first_name: "Ada", last_name: "Lovelace" })).toBe("Ada Lovelace");
    expect(buildFullName({})).toBe("Guest");
  });
});
