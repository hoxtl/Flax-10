import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const computePlanTimelineRowsMock = vi.fn();
const deriveBestFreeRowIdMock = vi.fn();
const deriveAssignedGapTasksMock = vi.fn();
const deriveGapDeadlineFallbacksMock = vi.fn();
const isTodayMock = vi.fn();
const isNowMock = vi.fn();

vi.mock("../../../../pages/homepage/utils/planTimelineRows", () => ({
  computePlanTimelineRows: (...args) => computePlanTimelineRowsMock(...args),
}));

vi.mock("../../../../pages/homepage/hooks/mini_timeline/assignmentUtils", () => ({
  deriveAssignedGapTasks: (...args) => deriveAssignedGapTasksMock(...args),
  deriveBestFreeRowId: (...args) => deriveBestFreeRowIdMock(...args),
  deriveGapDeadlineFallbacks: (...args) => deriveGapDeadlineFallbacksMock(...args),
}));

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../../pages/homepage/utils/eventUtils", () => ({
  isNow: (...args) => isNowMock(...args),
}));

import { useMiniTimelineData } from "../../../../pages/homepage/hooks/useMiniTimelineData";
import { DAY_END_HOUR, DAY_START_HOUR } from "../../../../pages/homepage/utils/timelineUtils";

describe("useMiniTimelineData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(true);
    isNowMock.mockReturnValue(false);
    computePlanTimelineRowsMock.mockReturnValue([{ id: "row-1" }]);
    deriveBestFreeRowIdMock.mockReturnValue("free-row");
    deriveAssignedGapTasksMock.mockReturnValue({ map: { "free-row": { id: 1 } }, nextMap: { "free-row": null } });
    deriveGapDeadlineFallbacksMock.mockReturnValue({ "free-row": { title: "Fallback" } });
  });

  const baseProps = {
    selectedDate: new Date("2026-03-24T12:34:00Z"), now: new Date("2026-03-24T09:00:00Z"),
    sortedEvents: [{ id: 1 }], dayTasks: [{ id: 2 }], tasksDueToday: [{ id: 3 }], suggestableTasks: [{ id: 4 }],
    skippedGapTasks: {}, slottedTaskIds: new Set(), slottedTitles: new Set(),
    deadlineSuggestions: [{ id: 5 }], hasTimerSession: false,
  };
  it("builds rows and derives best free row", () => {
    const { result } = renderHook(() => useMiniTimelineData(baseProps));
    expect(computePlanTimelineRowsMock).toHaveBeenCalled();
    expect(result.current.rows).toEqual([{ id: "row-1" }]);
    expect(result.current.bestFreeRowId).toBe("free-row");
  });
  it("derives gap tasks and fallbacks", () => {
    const { result } = renderHook(() => useMiniTimelineData(baseProps));
    expect(result.current.assignedGapTasks).toEqual({ map: { "free-row": { id: 1 } }, nextMap: { "free-row": null } });
    expect(result.current.gapDeadlineFallbacks).toEqual({ "free-row": { title: "Fallback" } });
  });
  it("uses correct day bounds", () => {
    renderHook(() => useMiniTimelineData(baseProps));
    const [, , start, end] = computePlanTimelineRowsMock.mock.calls[0];
    expect(start.getHours()).toBe(DAY_START_HOUR);
    expect(end.getHours()).toBe(DAY_END_HOUR);
  });

  it("returns the active event only when today and timer is off", () => {
    isNowMock.mockImplementation((start, end) => start === "start" && end === "end");

    const { result } = renderHook(() =>
      useMiniTimelineData({
        selectedDate: new Date("2026-03-24T00:00:00Z"),
        now: new Date("2026-03-24T09:00:00Z"),
        sortedEvents: [
          { id: "ignored" },
          { id: "active", start_time: "start", end_time: "end" },
        ],
        dayTasks: [],
        tasksDueToday: [],
        suggestableTasks: [],
        skippedGapTasks: {},
        slottedTaskIds: new Set(),
        slottedTitles: new Set(),
        deadlineSuggestions: [],
        hasTimerSession: false,
      })
    );

    expect(result.current.currentBlock).toEqual({ id: "active", start_time: "start", end_time: "end" });
  });

  it("returns no current block when timer session is active or the date is not today", () => {
    const baseProps = {
      selectedDate: new Date("2026-03-24T00:00:00Z"),
      now: new Date("2026-03-24T09:00:00Z"),
      sortedEvents: [{ id: "active", start_time: "start", end_time: "end" }],
      dayTasks: [],
      tasksDueToday: [],
      suggestableTasks: [],
      skippedGapTasks: {},
      slottedTaskIds: new Set(),
      slottedTitles: new Set(),
      deadlineSuggestions: [],
    };

    const withTimer = renderHook(() => useMiniTimelineData({ ...baseProps, hasTimerSession: true }));
    expect(withTimer.result.current.currentBlock).toBeNull();

    isTodayMock.mockReturnValue(false);
    const notToday = renderHook(() => useMiniTimelineData({ ...baseProps, hasTimerSession: false }));
    expect(notToday.result.current.currentBlock).toBeNull();
  });
});
