import { beforeEach, describe, expect, it, vi } from "vitest";

const isNowMock = vi.fn();
const getAllFreeWindowsTodayMock = vi.fn();

vi.mock("../../../pages/Homepage/utils/eventUtils", () => ({
  isNow: (...args) => isNowMock(...args),
}));

vi.mock("../../../pages/Homepage/utils/slotUtils", () => ({
  getAllFreeWindowsToday: (...args) => getAllFreeWindowsTodayMock(...args),
}));

import { getNavigatorContext, getOverlappingPairs } from "../../../pages/Homepage/utils/navigatorUtils";

describe("navigatorUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllFreeWindowsTodayMock.mockReturnValue([]);
    isNowMock.mockReturnValue(false);
  });

  it("returns overlapping pairs in chronological order", () => {
    const pairs = getOverlappingPairs([
      { id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:15:00.000Z" },
      { id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
      { id: 3, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
    ]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].a.id).toBe(1);
    expect(pairs[0].b.id).toBe(2);
    expect(getOverlappingPairs([])).toEqual([]);
  });

  it("falls back to the default context when the date is not today or there are no events", () => {
    expect(
      getNavigatorContext(
        new Date("2026-03-24T09:00:00.000Z"),
        "2026-03-25",
        [{ id: 1 }],
        () => false,
      ),
    ).toEqual({
      state: "none",
      currentBlock: null,
      nextItem: null,
      gapMins: null,
      overlaps: [],
      conflictAt: null,
      firstGapWindow: null,
    });

    expect(getNavigatorContext(new Date("2026-03-24T09:00:00.000Z"), "2026-03-24", [], () => true)).toEqual({
      state: "none",
      currentBlock: null,
      nextItem: null,
      gapMins: null,
      overlaps: [],
      conflictAt: null,
      firstGapWindow: null,
    });
  });

  it("builds task, gap, end-of-day, and conflict contexts", () => {
    getAllFreeWindowsTodayMock.mockReturnValue([
      { start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T12:00:00.000Z"), minutes: 60 },
      { start: new Date("2026-03-24T13:00:00.000Z"), end: new Date("2026-03-24T13:10:00.000Z"), minutes: 10 },
    ]);

    isNowMock.mockImplementation((start, end) => start === "2026-03-24T09:00:00.000Z" && end === "2026-03-24T10:00:00.000Z");
    expect(
      getNavigatorContext(
        new Date("2026-03-24T09:30:00.000Z"),
        "2026-03-24",
        [
          { id: 1, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
          { id: 2, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
        ],
        () => true,
      ),
    ).toMatchObject({
      state: "task",
      currentBlock: { id: 1, start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
      nextItem: { id: 2, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
      overlaps: [],
    });

    isNowMock.mockReturnValue(false);
    expect(
      getNavigatorContext(
        new Date("2026-03-24T09:30:00.000Z"),
        "2026-03-24",
        [{ id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }],
        () => true,
      ),
    ).toMatchObject({
      state: "gap",
      nextItem: { id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" },
      gapMins: 150,
      firstGapWindow: { start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T12:00:00.000Z"), minutes: 60 },
    });

    getAllFreeWindowsTodayMock.mockReturnValue([{ start: new Date("2026-03-24T11:00:00.000Z"), end: new Date("2026-03-24T11:10:00.000Z"), minutes: 10 }]);
    expect(
      getNavigatorContext(
        new Date("2026-03-24T09:30:00.000Z"),
        "2026-03-24",
        [{ id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }],
        () => true,
      ),
    ).toMatchObject({
      state: "gap",
      firstGapWindow: null,
    });

    expect(
      getNavigatorContext(
        new Date("2026-03-24T14:30:00.000Z"),
        "2026-03-24",
        [{ id: 1, start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }],
        () => true,
      ),
    ).toMatchObject({ state: "endOfDay" });

    isNowMock.mockReturnValue(true);
    expect(
      getNavigatorContext(
        new Date("2026-03-24T10:15:00.000Z"),
        "2026-03-24",
        [
          { id: 1, start_time: "2026-03-24T10:00:00.000Z", end_time: "2026-03-24T11:00:00.000Z" },
          { id: 2, start_time: "2026-03-24T10:30:00.000Z", end_time: "2026-03-24T11:30:00.000Z" },
        ],
        () => true,
      ),
    ).toMatchObject({
      state: "conflict",
      currentBlock: null,
      conflictAt: new Date("2026-03-24T10:30:00.000Z"),
    });
  });
});
