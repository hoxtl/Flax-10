import { beforeEach, describe, expect, it, vi } from "vitest";

const filterEventsInWindow = vi.fn();
const buildGapOrTinyGap = vi.fn();
const buildEventEntry = vi.fn();
const addSpacing = vi.fn();
const groupOverlappingEvents = vi.fn();
const insertNowMarker = vi.fn();
const injectHourMarks = vi.fn();

vi.mock("../../../../pages/homepage/utils/plan_timeline/eventRows", () => ({
  filterEventsInWindow: (...args) => filterEventsInWindow(...args),
  buildGapOrTinyGap: (...args) => buildGapOrTinyGap(...args),
  buildEventEntry: (...args) => buildEventEntry(...args),
  addSpacing: (...args) => addSpacing(...args),
  groupOverlappingEvents: (...args) => groupOverlappingEvents(...args),
}));

vi.mock("../../../../pages/homepage/utils/plan_timeline/hourMarks", () => ({
  insertNowMarker: (...args) => insertNowMarker(...args),
  injectHourMarks: (...args) => injectHourMarks(...args),
}));

import {
  CAMPUS_DISPLAY,
  computePlanTimelineRows,
} from "../../../../pages/homepage/utils/plan_timeline";

describe("plan timeline index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports campus display labels", () => {
    expect(CAMPUS_DISPLAY.strand).toBe("Strand");
  });

  it("calls pipeline helpers with correct arguments for today", () => {
    const eventA = { id: "a", start_time: "2026-03-05T09:00:00.000Z", end_time: "2026-03-05T10:00:00.000Z" };
    const eventB = { id: "b", start_time: "2026-03-05T07:00:00.000Z", end_time: "2026-03-05T08:00:00.000Z" };
    filterEventsInWindow.mockReturnValue([eventA, eventB]);
    buildGapOrTinyGap.mockReturnValueOnce({ type: "free", id: "gap-1", startMins: 120, endMins: 180 });
    buildEventEntry.mockReturnValueOnce({ type: "event", id: "row-a", startMins: 180, endMins: 240 })
      .mockReturnValueOnce({ type: "event", id: "row-b", startMins: 60, endMins: 120 });
    addSpacing.mockImplementation((rows) => rows);
    groupOverlappingEvents.mockImplementation((rows) => rows);
    insertNowMarker.mockImplementation((rows) => rows);
    injectHourMarks.mockImplementation((rows) => rows);
    const now = new Date("2026-03-05T05:30:00.000Z");

    computePlanTimelineRows(
      [eventA, eventB], new Date("2026-03-05T00:00:00.000Z"),
      new Date("2026-03-05T06:00:00.000Z"), new Date("2026-03-05T23:00:00.000Z"),
      now, [{ title: "Essay" }], [{ title: "Lab" }], () => true,
    );

    expect(filterEventsInWindow).toHaveBeenCalled();
    expect(buildGapOrTinyGap).toHaveBeenCalledWith(240, 60, 1, eventA, eventB);
    expect(buildEventEntry).toHaveBeenCalledWith(eventA, [eventA, eventB], now, [{ title: "Essay" }], [{ title: "Lab" }]);
    expect(addSpacing).toHaveBeenCalled();
    expect(groupOverlappingEvents).toHaveBeenCalled();
  });

  it("sorts rows, inserts now marker, and injects hour marks for today", () => {
    const eventA = { id: "a", start_time: "2026-03-05T09:00:00.000Z", end_time: "2026-03-05T10:00:00.000Z" };
    const eventB = { id: "b", start_time: "2026-03-05T07:00:00.000Z", end_time: "2026-03-05T08:00:00.000Z" };
    filterEventsInWindow.mockReturnValue([eventA, eventB]);
    buildGapOrTinyGap.mockReturnValueOnce({ type: "free", id: "gap-1", startMins: 120, endMins: 180 });
    buildEventEntry.mockReturnValueOnce({ type: "event", id: "row-a", startMins: 180, endMins: 240 }).mockReturnValueOnce({ type: "event", id: "row-b", startMins: 60, endMins: 120 });
    addSpacing.mockImplementation((rows) => rows);
    groupOverlappingEvents.mockImplementation((rows) => rows);
    insertNowMarker.mockImplementation((rows) => [...rows, { type: "now", id: "now-marker" }]);
    injectHourMarks.mockImplementation((rows) => [{ type: "hourMark", id: "hour-7" }, ...rows]);

    const result = computePlanTimelineRows(
      [eventA, eventB], new Date("2026-03-05T00:00:00.000Z"),
      new Date("2026-03-05T06:00:00.000Z"), new Date("2026-03-05T23:00:00.000Z"),
      new Date("2026-03-05T05:30:00.000Z"), [{ title: "Essay" }], [{ title: "Lab" }], () => true,
    );

    const expectedRows = [{ type: "event", id: "row-b", startMins: 60, endMins: 120 }, { type: "free", id: "gap-1", startMins: 120, endMins: 180 }, { type: "event", id: "row-a", startMins: 180, endMins: 240 }];
    expect(insertNowMarker).toHaveBeenCalledWith(expectedRows, 0);
    expect(injectHourMarks).toHaveBeenCalled();
    expect(result[0]).toEqual({ type: "hourMark", id: "hour-7" });
  });

  it("skips now-marker insertion when the date is not today or now is missing", () => {
    filterEventsInWindow.mockReturnValue([]);
    addSpacing.mockImplementation((rows) => rows);
    groupOverlappingEvents.mockImplementation((rows) => rows);
    injectHourMarks.mockImplementation((rows) => rows);

    const selectedDate = new Date("2026-03-05T00:00:00.000Z");
    const result = computePlanTimelineRows(
      [],
      selectedDate,
      new Date("2026-03-05T06:00:00.000Z"),
      new Date("2026-03-05T23:00:00.000Z"),
      null,
      [],
      [],
      () => false,
    );

    expect(insertNowMarker).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("falls back to start_time when an event has no end_time", () => {
    const event = { id: "solo", start_time: "2026-03-05T07:00:00.000Z" };
    filterEventsInWindow.mockReturnValue([event]);
    buildGapOrTinyGap.mockReturnValue(null);
    buildEventEntry.mockReturnValue({ type: "event", id: "solo-row", startMins: 60, endMins: 60 });
    addSpacing.mockImplementation((rows) => rows);
    groupOverlappingEvents.mockImplementation((rows) => rows);
    injectHourMarks.mockImplementation((rows) => rows);

    const result = computePlanTimelineRows(
      [event],
      new Date("2026-03-05T00:00:00.000Z"),
      new Date("2026-03-05T06:00:00.000Z"),
      new Date("2026-03-05T23:00:00.000Z"),
      new Date("2026-03-05T07:10:00.000Z"),
      [],
      [],
      () => false,
    );

    expect(buildEventEntry).toHaveBeenCalledWith(event, [event], expect.any(Date), [], []);
    expect(result).toEqual([{ type: "event", id: "solo-row", startMins: 60, endMins: 60 }]);
  });
});
