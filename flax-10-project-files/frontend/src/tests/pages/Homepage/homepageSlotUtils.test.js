import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const isTodayMock = vi.fn();
const overlapsDayMock = vi.fn();

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
  overlapsDay: (...args) => overlapsDayMock(...args),
}));

import {
  getAllFreeWindowsToday,
  getNextFreeSlotToday,
  isNightSlot,
} from "../../../pages/Homepage/utils/slotUtils";

describe("homepageSlotUtils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T08:00:00.000Z"));
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("identifies night slots explicitly by hours", () => {
    expect(isNightSlot()).toBe(false);
    expect(isNightSlot("2026-03-24T23:30:00.000Z")).toBe(true);
    expect(isNightSlot("2026-03-24T05:30:00.000Z")).toBe(true);
    expect(isNightSlot("2026-03-24T12:00:00.000Z")).toBe(false);
  });

  it("returns null for next free slot when date is not today", () => {
    isTodayMock.mockReturnValue(false);
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);
  });

  it("calculates next free slots avoiding overlapping event sequences", () => {
    isTodayMock.mockReturnValue(true);
    overlapsDayMock.mockReturnValue(true);
    expect(getNextFreeSlotToday([], "2026-03-24", 0)).toBeNull();
    expect(getNextFreeSlotToday(null, "2026-03-24", 30)).toMatchObject({ start: new Date("2026-03-24T08:00:00.000Z"), end: new Date("2026-03-24T08:30:00.000Z") });
    
    const slot = getNextFreeSlotToday([{ start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" }], "2026-03-24", 30);
    expect(slot).toMatchObject({ start: new Date("2026-03-24T08:00:00Z"), end: new Date("2026-03-24T08:30:00Z") });
  });

  it("shifts the start time past upcoming short blocks", () => {
    expect(getNextFreeSlotToday([{ start_time: "2026-03-24T08:10:00.000Z", end_time: "2026-03-24T08:20:00.000Z" }], "2026-03-24", 30)).toMatchObject({
      start: new Date("2026-03-24T08:20:00.000Z"),
      end: new Date("2026-03-24T08:50:00.000Z"),
    });
    expect(getNextFreeSlotToday([{ start_time: "2026-03-24T07:30:00.000Z" }], "2026-03-24", 30)).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
      end: new Date("2026-03-24T08:30:00.000Z"),
    });
  });

  it("returns empty arrays or nulls when the day is ending", () => {
    vi.setSystemTime(new Date("2026-03-24T23:59:59.999Z"));
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);
    vi.setSystemTime(new Date("2026-03-24T23:50:00.000Z"));
    expect(getNextFreeSlotToday([], "2026-03-24", 30)).toBeNull();
    expect(getAllFreeWindowsToday([], "2026-03-24")).toEqual([]);
  });

  it("collects all free windows across the day with duration mapping", () => {
    const windows = getAllFreeWindowsToday([{ start_time: "2026-03-24T08:10:00Z", end_time: "2026-03-24T08:20:00Z" }, { start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" }], "2026-03-24");
    expect(windows[0]).toMatchObject({ minutes: 40 });
    expect(windows.some((window) => window.minutes >= 15)).toBe(true);
  });

  it("clips free windows bounded by missing end times", () => {
    expect(getAllFreeWindowsToday([{ start_time: "2026-03-24T07:30:00.000Z" }], "2026-03-24")[0]).toMatchObject({
      start: new Date("2026-03-24T08:00:00.000Z"),
    });
    expect(getAllFreeWindowsToday([{ start_time: "2026-03-24T08:05:00.000Z", end_time: "2026-03-24T08:10:00.000Z" }], "2026-03-24")[0]).toMatchObject({
      start: new Date("2026-03-24T08:10:00.000Z"),
    });
  });
});
