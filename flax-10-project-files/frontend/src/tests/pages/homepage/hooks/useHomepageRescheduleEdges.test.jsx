import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const extractBaseEventIdMock = vi.fn((id) => id);
const formatTimeMock = vi.fn(() => "10:00");
const getNextFreeSlotTodayMock = vi.fn(() => null);

vi.mock("../../../../pages/homepage/utils", () => ({
  formatTime: (...args) => formatTimeMock(...args),
  getAllFreeWindowsToday: vi.fn(() => []),
  getNextFreeSlotToday: (...args) => getNextFreeSlotTodayMock(...args),
  isRoutineEvent: vi.fn(() => false),
}));

vi.mock("../../../../components/calendar/utils/eventUtils", () => ({
  extractBaseEventId: (...args) => extractBaseEventIdMock(...args),
}));

const conflictMocks = vi.hoisted(() => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(),
  buildConflictResolutionToastMessage: vi.fn(),
}));

vi.mock("../../../../components/common/reschedule_events/rescheduleEventConflicts", () => conflictMocks);

import { useHomepageReschedule } from "../../../../pages/homepage/hooks/useHomepageReschedule";

function buildRescheduleProps(overrides = {}) {
  return {
    addEvent: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    editEvent: vi.fn().mockResolvedValue(undefined),
    loadEvents: vi.fn().mockResolvedValue(undefined),
    refetchTasks: vi.fn(),
    removeEvent: vi.fn().mockResolvedValue(undefined),
    selectedDate: new Date("2026-03-24T09:00:00Z"),
    showToast: vi.fn(),
    sortedEvents: [],
    ...overrides,
  };
}

describe("useHomepageReschedule extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conflictMocks.buildConflictResolutionPlan.mockReturnValue({
      operations: [{ event: { id: 1, title: "Office hour" } }],
      unresolved: [],
    });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValue("Cleared 1 conflict.");
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue(undefined);
  });

  it("shows error toast when rescheduleTomorrow fails", async () => {
    const props = buildRescheduleProps({ addEvent: vi.fn().mockRejectedValue(new Error("n")) });
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleRescheduleTomorrow({ id: "e1", title: "E", start_time: "2026-03-24T13:00:00Z" }); });
    expect(props.showToast).toHaveBeenCalledWith("Couldn't re-schedule. Try again.");
  });

  it("uses 25 min fallback for tomorrow reschedule", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleRescheduleTomorrow({ id: "e2", title: "R", start_time: "2026-03-24T10:00:00Z" }); });
    const addArgs = props.addEvent.mock.calls[0][0];
    const diff = new Date(addArgs.end_time).getTime() - new Date(addArgs.start_time).getTime();
    expect(diff).toBe(25 * 60000);
  });

  it("handleReschedule moves to same-day slot", async () => {
    getNextFreeSlotTodayMock.mockReturnValue({ start: new Date("2026-03-24T12:00:00Z"), end: new Date("2026-03-24T12:45:00Z") });
    formatTimeMock.mockReturnValue("12:00");
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleReschedule({ id: "e3", title: "S", start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T09:45:00Z" }); });
    expect(props.removeEvent).toHaveBeenCalled();
    expect(props.addEvent).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith('"S" → 12:00');
  });

  it("handleReschedule falls back to tomorrow", async () => {
    getNextFreeSlotTodayMock.mockReturnValue(null);
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleReschedule({ id: "e4", title: "W", start_time: "2026-03-24T07:00:00Z", end_time: "2026-03-24T08:00:00Z" }); });
    const addDate = new Date(props.addEvent.mock.calls[0][0].start_time);
    expect(addDate.getDate()).toBe(25);
  });
});
