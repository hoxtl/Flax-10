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
});
