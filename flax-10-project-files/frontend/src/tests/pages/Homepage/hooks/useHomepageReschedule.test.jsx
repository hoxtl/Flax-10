import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHomepageReschedule } from "../../../../pages/Homepage/hooks/useHomepageReschedule";

const conflictMocks = vi.hoisted(() => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(),
  buildConflictResolutionToastMessage: vi.fn(),
}));

vi.mock("../../../../pages/Homepage/utils/index", () => ({
  formatTime: vi.fn(() => "09:00"),
  getAllFreeWindowsToday: vi.fn(() => []),
  getNextFreeSlotToday: vi.fn(() => null),
  isRoutineEvent: vi.fn(() => false),
}));

vi.mock("../../../../components/Calendar/utils/eventUtils", () => ({
  extractBaseEventId: vi.fn((id) => id),
}));

vi.mock("../../../../components/Common/RescheduleEvents/rescheduleEventConflicts", () => conflictMocks);

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

  it("shows a confirmation toast without undo after clearing conflicts", async () => {
    const showToast = vi.fn();
    const loadEvents = vi.fn().mockResolvedValue(undefined);
    const refetchTasks = vi.fn();

    const { result } = renderHook(() =>
      useHomepageReschedule({
        editEvent: vi.fn().mockResolvedValue(undefined),
        loadEvents,
        refetchTasks,
        selectedDate: new Date("2026-03-24T09:00:00Z"),
        showToast,
        sortedEvents: [],
      })
    );

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(conflictMocks.applyConflictResolutionPlan).toHaveBeenCalled();
    expect(loadEvents).toHaveBeenCalled();
    expect(refetchTasks).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Cleared 1 conflict.", { durationMs: 8500 });
    expect(showToast).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ actionLabel: "Undo" })
    );
  });

  it("skips conflict resolution when there are no operations", async () => {
    conflictMocks.buildConflictResolutionPlan.mockReturnValueOnce({
      operations: [],
      unresolved: [],
    });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValueOnce("Already clear.");

    const showToast = vi.fn();
    const refetchTasks = vi.fn();

    const { result } = renderHook(() =>
      useHomepageReschedule({
        editEvent: vi.fn(),
        loadEvents: vi.fn(),
        refetchTasks,
        selectedDate: new Date("2026-03-24T09:00:00Z"),
        showToast,
        sortedEvents: [],
      })
    );

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(conflictMocks.applyConflictResolutionPlan).not.toHaveBeenCalled();
    expect(refetchTasks).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Already clear.");
  });

  it("moves an item to tomorrow and refetches tasks", async () => {
    const addEvent = vi.fn().mockResolvedValue(undefined);
    const removeEvent = vi.fn().mockResolvedValue(undefined);
    const loadEvents = vi.fn().mockResolvedValue(undefined);
    const refetchTasks = vi.fn();
    const showToast = vi.fn();

    const { result } = renderHook(() =>
      useHomepageReschedule({
        addEvent,
        deleteTask: vi.fn(),
        editEvent: vi.fn(),
        loadEvents,
        refetchTasks,
        removeEvent,
        selectedDate: new Date("2026-03-24T09:00:00Z"),
        showToast,
        sortedEvents: [],
      })
    );

    await act(async () => {
      await result.current.handleRescheduleTomorrow({
        id: "evt_99",
        title: "Essay",
        description: "Draft",
        start_time: "2026-03-24T13:00:00.000Z",
        end_time: "2026-03-24T14:30:00.000Z",
      });
    });

    expect(addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Essay",
        description: "Draft",
        start_time: "2026-03-25T09:00:00.000Z",
        end_time: "2026-03-25T10:30:00.000Z",
      })
    );
    expect(removeEvent).toHaveBeenCalledWith("evt_99");
    expect(loadEvents).toHaveBeenCalled();
    expect(refetchTasks).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('"Essay" re-scheduled for tomorrow at 9:00');
  });

  it("shows the conflict-resolution failure toast when applying the plan fails", async () => {
    conflictMocks.applyConflictResolutionPlan.mockRejectedValueOnce(new Error("nope"));

    const showToast = vi.fn();
    const loadEvents = vi.fn();
    const refetchTasks = vi.fn();

    const { result } = renderHook(() =>
      useHomepageReschedule({
        editEvent: vi.fn(),
        loadEvents,
        refetchTasks,
        selectedDate: new Date("2026-03-24T09:00:00Z"),
        showToast,
        sortedEvents: [{ id: 1 }],
      })
    );

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Try again.");
    expect(loadEvents).not.toHaveBeenCalled();
    expect(refetchTasks).not.toHaveBeenCalled();
  });
});
