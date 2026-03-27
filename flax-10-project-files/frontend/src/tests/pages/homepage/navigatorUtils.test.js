import { beforeEach, describe, expect, it, vi } from "vitest";

const isNowMock = vi.fn();
const getAllFreeWindowsTodayMock = vi.fn();

vi.mock("../../../pages/homepage/utils/eventUtils", () => ({
  isNow: (...args) => isNowMock(...args),
}));

vi.mock("../../../pages/homepage/utils/slotUtils", () => ({
  getAllFreeWindowsToday: (...args) => getAllFreeWindowsTodayMock(...args),
}));

import { getNavigatorContext, getOverlappingPairs } from "../../../pages/homepage/utils/navigatorUtils";

describe("navigatorUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllFreeWindowsTodayMock.mockReturnValue([]);
    isNowMock.mockReturnValue(false);
  });

  it("returns overlapping pairs in chronological order safely", () => {
    const pairs = getOverlappingPairs([{ id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:15:00.000Z" }, { id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].a.id).toBe(1);
    expect(pairs[0].b.id).toBe(2);
  });

  it("handles empty or missing overlapping pairs arrays", () => {
    expect(getOverlappingPairs([])).toEqual([]);
    expect(getOverlappingPairs(null)).toEqual([]);
    expect(getOverlappingPairs([{ id: 1, start_time: "2026-03-24T10:00:00.000Z" }, { id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }])).toEqual([]);
  });

  it("identifies overlap intervals based on start and end time boundaries", () => {
    const pair = getOverlappingPairs([{ id: 4, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }, { id: 5, start_time: "2026-03-24T10:30:00.000Z" }])[0];
    expect(pair).toMatchObject({
      a: { id: 4, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      b: { id: 5, start_time: "2026-03-24T10:30:00.000Z" },
      overlapStart: new Date("2026-03-24T10:30:00.000Z"),
      overlapEnd: new Date("2026-03-24T10:30:00.000Z"),
    });
  });

  it("falls back to the default context when the date is not today", () => {
    expect(getNavigatorContext(new Date("2026-03-24T09:00:00.000Z"), "2026-03-25", [{ id: 1 }], () => false)).toEqual({
      state: "none", currentBlock: null, nextItem: null, gapMins: null, overlaps: [], conflictAt: null, firstGapWindow: null,
    });
  });

  it("returns default empty navigator context when there are no events", () => {
    expect(getNavigatorContext(new Date("2026-03-24T09:00:00.000Z"), "2026-03-24", [], () => true)).toEqual({
      state: "none", currentBlock: null, nextItem: null, gapMins: null, overlaps: [], conflictAt: null, firstGapWindow: null,
    });
  });

  it("builds task contexts when the current time is inside a block", () => {
    isNowMock.mockImplementation((start, end) => start === "2026-03-24T09:00:00.000Z" && end === "2026-03-24T10:00:00.000Z");
    const ctx = getNavigatorContext(new Date("2026-03-24T09:30:00.000Z"), "2026-03-24", [{ id: 1, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" }, { id: 2, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }], () => true);
    expect(ctx).toMatchObject({ state: "task", currentBlock: { id: 1 }, nextItem: { id: 2 }, overlaps: [] });
  });

  it("builds gap contexts with accurate gap durations and free windows", () => {
    getAllFreeWindowsTodayMock.mockReturnValue([{ start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T12:00:00.000Z"), minutes: 60 }]);
    isNowMock.mockReturnValue(false);
    const ctx = getNavigatorContext(new Date("2026-03-24T09:30:00.000Z"), "2026-03-24", [{ id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }], () => true);
    expect(ctx).toMatchObject({ state: "gap", nextItem: { id: 1 }, gapMins: 150, firstGapWindow: { minutes: 60 } });
  });

  it("clears gap windows when all remaining slots are too short", () => {
    getAllFreeWindowsTodayMock.mockReturnValue([{ start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T11:10:00.000Z"), minutes: 10 }]);
    isNowMock.mockReturnValue(false);
    expect(getNavigatorContext(new Date("2026-03-24T09:30:00.000Z"), "2026-03-24", [{ id: 1, start_time: "2026-03-24T12:00:00.000Z" }], () => true)).toMatchObject({ state: "gap", firstGapWindow: null });
  });

  it("builds end-of-day contexts when all events are in the past", () => {
    expect(getNavigatorContext(new Date("2026-03-24T14:30:00.000Z"), "2026-03-24", [{ id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }], () => true)).toMatchObject({ state: "endOfDay" });
  });

  it("builds conflict contexts when active overlaps are detected", () => {
    isNowMock.mockReturnValue(true);
    expect(getNavigatorContext(new Date("2026-03-24T10:15:00.000Z"), "2026-03-24", [{ id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" }, { id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:30:00.000Z" }], () => true)).toMatchObject({ state: "conflict", conflictAt: new Date("2026-03-24T10:30:00.000Z") });
  });

  it("keeps the current block during an active conflict", () => {
    getAllFreeWindowsTodayMock.mockReturnValue([]);
    isNowMock.mockImplementation((start, end) => start === "2026-03-24T10:00:00.000Z" && end === "2026-03-24T11:00:00.000Z");

    expect(
      getNavigatorContext(
        new Date("2026-03-24T10:45:00.000Z"),
        "2026-03-24",
        [
          { id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
          { id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:30:00.000Z" },
        ],
        () => true,
      ),
    ).toMatchObject({
      state: "conflict",
      currentBlock: { id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      firstGapWindow: null,
      conflictAt: new Date("2026-03-24T10:30:00.000Z"),
    });
  });
});
