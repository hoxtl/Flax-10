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

vi.mock("../../../../components/common/RescheduleEvents/rescheduleEventConflicts", () => conflictMocks);

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
});
