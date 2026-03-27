import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHomepageReschedule } from "../../../../pages/homepage/hooks/useHomepageReschedule";

const conflictMocks = vi.hoisted(() => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(),
  buildConflictResolutionToastMessage: vi.fn(),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/homepage/hooks/useHomepageReschedule.test.jsx
vi.mock("../../../../pages/homepage/utils", () => ({
=======
vi.mock("../../../../pages/homepage/utils/index", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Homepage/hooks/useHomepageReschedule.test.jsx
  formatTime: vi.fn(() => "09:00"),
  getAllFreeWindowsToday: vi.fn(() => []),
  getNextFreeSlotToday: vi.fn(() => null),
  isRoutineEvent: vi.fn(() => false),
}));

vi.mock("../../../../components/calendar/utils/eventUtils", () => ({
  extractBaseEventId: vi.fn((id) => id),
}));

vi.mock("../../../../components/common/reschedule_events/rescheduleEventConflicts", () => conflictMocks);

describe("useHomepageReschedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conflictMocks.buildConflictResolutionPlan.mockReturnValue({
      operations: [{ event: { id: 1, title: "Office hour" } }],
      unresolved: [],
    });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValue("Cleared 1 conflict.");
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue(undefined);
  });

  it("resolves timeline conflicts and reloads events", async () => {
    const loadEvents = vi.fn().mockResolvedValue(undefined);
    const refetchTasks = vi.fn();
    const { result } = renderHook(() => useHomepageReschedule({ editEvent: vi.fn(), loadEvents, refetchTasks, selectedDate: new Date(), showToast: vi.fn(), sortedEvents: [] }));
    await act(async () => { await result.current.handleResolveTimelineConflicts(); });
    expect(conflictMocks.applyConflictResolutionPlan).toHaveBeenCalled();
    expect(loadEvents).toHaveBeenCalled();
    expect(refetchTasks).toHaveBeenCalled();
  });

  it("shows a confirmation toast after clearing conflicts", async () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useHomepageReschedule({ editEvent: vi.fn(), loadEvents: vi.fn(), refetchTasks: vi.fn(), selectedDate: new Date(), showToast, sortedEvents: [] }));
    await act(async () => { await result.current.handleResolveTimelineConflicts(); });
    expect(showToast).toHaveBeenCalledWith("Cleared 1 conflict.", { durationMs: 8500 });
    expect(showToast).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ actionLabel: "Undo" }));
  });

  it("skips conflict resolution bypassing revalidation when unchanged", async () => {
    conflictMocks.buildConflictResolutionPlan.mockReturnValueOnce({ operations: [], unresolved: [] });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValueOnce("Already clear.");
    const showToast = vi.fn();
    const refetchTasks = vi.fn();
    const { result } = renderHook(() => useHomepageReschedule({ editEvent: vi.fn(), loadEvents: vi.fn(), refetchTasks, selectedDate: new Date(), showToast, sortedEvents: [] }));
    await act(async () => { await result.current.handleResolveTimelineConflicts(); });
    expect(conflictMocks.applyConflictResolutionPlan).not.toHaveBeenCalled();
    expect(refetchTasks).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Already clear.");
  });

  it("resolves the reschedule payload applying the offset successfully", async () => {
    const addEvent = vi.fn().mockResolvedValue(undefined);
    const removeEvent = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHomepageReschedule({ addEvent, deleteTask: vi.fn(), editEvent: vi.fn(), loadEvents: vi.fn(), refetchTasks: vi.fn(), removeEvent, selectedDate: new Date(), showToast: vi.fn(), sortedEvents: [] }));
    await act(async () => { await result.current.handleRescheduleTomorrow({ id: "evt_99", title: "Essay", description: "Draft", start_time: "2026-03-24T13:00Z", end_time: "2026-03-24T14:30Z" }); });
    expect(addEvent).toHaveBeenCalled();
    expect(removeEvent).toHaveBeenCalledWith("evt_99");
  });

  it("synchronizes the ui by firing revalidation after offset updates", async () => {
    const loadEvents = vi.fn().mockResolvedValue(undefined);
    const refetchTasks = vi.fn();
    const showToast = vi.fn();
    const { result } = renderHook(() => useHomepageReschedule({ addEvent: vi.fn().mockResolvedValue(), deleteTask: vi.fn(), editEvent: vi.fn(), loadEvents, refetchTasks, removeEvent: vi.fn().mockResolvedValue(), selectedDate: new Date(), showToast, sortedEvents: [] }));
    await act(async () => { await result.current.handleRescheduleTomorrow({ id: "evt_99", title: "Essay", description: "Draft", start_time: "2026-03-24T13:00Z", end_time: "2026-03-24T14:30Z" }); });
    expect(loadEvents).toHaveBeenCalled();
    expect(refetchTasks).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('"Essay" re-scheduled for tomorrow at 9:00');
  });

  it("catches applied plan issues alerting the user contextually", async () => {
    conflictMocks.applyConflictResolutionPlan.mockRejectedValueOnce(new Error("nope"));
    const showToast = vi.fn();
    const { result } = renderHook(() => useHomepageReschedule({ editEvent: vi.fn(), loadEvents: vi.fn(), refetchTasks: vi.fn(), selectedDate: new Date(), showToast, sortedEvents: [{ id: 1 }] }));
    await act(async () => { await result.current.handleResolveTimelineConflicts(); });
    expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Try again.");
  });
});
