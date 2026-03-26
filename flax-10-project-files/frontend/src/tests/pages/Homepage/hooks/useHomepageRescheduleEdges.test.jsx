import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const extractBaseEventIdMock = vi.fn((id) => id);
const formatTimeMock = vi.fn(() => "10:00");
const getNextFreeSlotTodayMock = vi.fn(() => null);

vi.mock("../../../../pages/homepage/utils/index", () => ({
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
    const props = buildRescheduleProps({
      addEvent: vi.fn().mockRejectedValue(new Error("network")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleRescheduleTomorrow({
        id: "evt_1",
        title: "Essay",
        start_time: "2026-03-24T13:00:00.000Z",
        end_time: "2026-03-24T14:00:00.000Z",
      });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't re-schedule. Try again.");
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it("uses item's end_time fallback of 25 min when end_time is absent for tomorrow reschedule", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleRescheduleTomorrow({
        id: "evt_2",
        title: "Read notes",
        start_time: "2026-03-24T10:00:00.000Z",
      });
    });

    const addedEvent = props.addEvent.mock.calls[0][0];
    const diff = new Date(addedEvent.end_time).getTime() - new Date(addedEvent.start_time).getTime();
    expect(diff).toBe(25 * 60000);
  });

  it("handleReschedule moves to same-day slot when one is available", async () => {
    const slot = {
      start: new Date("2026-03-24T12:00:00.000Z"),
      end: new Date("2026-03-24T12:45:00.000Z"),
    };
    getNextFreeSlotTodayMock.mockReturnValue(slot);
    formatTimeMock.mockReturnValue("12:00");

    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleReschedule({
        id: "evt_3",
        title: "Study session",
        start_time: "2026-03-24T09:00:00.000Z",
        end_time: "2026-03-24T09:45:00.000Z",
      });
    });

    expect(props.removeEvent).toHaveBeenCalled();
    expect(props.addEvent).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith('"Study session" → 12:00');
  });

  it("handleReschedule falls back to tomorrow when no free slot exists", async () => {
    getNextFreeSlotTodayMock.mockReturnValue(null);

    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleReschedule({
        id: "evt_4",
        title: "Workout",
        start_time: "2026-03-24T07:00:00.000Z",
        end_time: "2026-03-24T08:00:00.000Z",
      });
    });

    const addedEvent = props.addEvent.mock.calls[0][0];
    const addedDate = new Date(addedEvent.start_time);
    expect(addedDate.getDate()).toBe(25);
  });

  it("handleReschedule shows error when editEvent fails during slot move", async () => {
    const slot = {
      start: new Date("2026-03-24T12:00:00.000Z"),
      end: new Date("2026-03-24T13:00:00.000Z"),
    };
    getNextFreeSlotTodayMock.mockReturnValue(slot);
    const props = buildRescheduleProps({
      editEvent: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleReschedule({
        id: "evt_5",
        title: "Seminar prep",
        start_time: "2026-03-24T09:00:00.000Z",
        end_time: "2026-03-24T09:45:00.000Z",
      });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't reschedule. Try again.");
    expect(props.addEvent).toHaveBeenCalledTimes(2);
  });

  it("handleQuickStartGap adds an event when a task is provided", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    const gapDate = new Date("2026-03-24T11:00:00.000Z");
    const task = { id: 7, title: "Write report", description: "Draft intro", estimated_blocks: 2 };

    await act(async () => {
      await result.current.handleQuickStartGap(gapDate, 50, task);
    });

    expect(props.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Write report",
        description: "Draft intro",
      }),
    );
    expect(props.loadEvents).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalled();
  });

  it("handleQuickStartGap is a no-op when task is null", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleQuickStartGap(new Date(), 30, null);
    });

    expect(props.addEvent).not.toHaveBeenCalled();
  });

  it("handleQuickStartGap shows error toast when addEvent fails", async () => {
    const props = buildRescheduleProps({
      addEvent: vi.fn().mockRejectedValue(new Error("offline")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleQuickStartGap(
        new Date("2026-03-24T11:00:00.000Z"),
        30,
        { id: 8, title: "Revise notes", estimated_blocks: 1 },
      );
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't add to schedule. Try again.");
  });

  it("handleConflictAutoMove moves event and shows toast", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictAutoMove(
        { id: "e1", title: "Lecture" },
        new Date("2026-03-24T11:00:00.000Z"),
        new Date("2026-03-24T12:00:00.000Z"),
      );
    });

    expect(props.editEvent).toHaveBeenCalled();
    expect(props.loadEvents).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith("Event moved to next available window.");
  });

  it("handleConflictAutoMove shows error toast when editEvent fails", async () => {
    const props = buildRescheduleProps({
      editEvent: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictAutoMove(
        { id: "e2", title: "Workshop" },
        new Date("2026-03-24T11:00:00.000Z"),
        new Date("2026-03-24T12:00:00.000Z"),
      );
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't move event. Try again.");
  });

  it("handleConflictPushTomorrow moves event to tomorrow and shows undo toast", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "e3",
        title: "Study group",
        start_time: "2026-03-24T14:00:00.000Z",
        end_time: "2026-03-24T15:00:00.000Z",
      });
    });

    expect(props.editEvent).toHaveBeenCalled();
    expect(props.loadEvents).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith(
      expect.stringContaining("moved to tomorrow"),
      expect.objectContaining({ actionLabel: "Undo" }),
    );
  });

  it("handleConflictPushTomorrow undo action restores the original event window", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "e3",
        title: "Study group",
        start_time: "2026-03-24T14:00:00.000Z",
        end_time: "2026-03-24T15:00:00.000Z",
      });
    });

    const undoOptions = props.showToast.mock.calls.at(-1)[1];

    await act(async () => {
      await undoOptions.onAction();
    });

    expect(props.editEvent).toHaveBeenLastCalledWith("e3", {
      start_time: "2026-03-24T14:00:00.000Z",
      end_time: "2026-03-24T15:00:00.000Z",
    });
    expect(props.showToast).toHaveBeenCalledWith("Undid move.");
  });

  it("handleConflictPushTomorrow shows an undo failure toast when restore fails", async () => {
    const props = buildRescheduleProps();
    props.editEvent
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("undo failed"));
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "e3",
        title: "Study group",
        start_time: "2026-03-24T14:00:00.000Z",
        end_time: "2026-03-24T15:00:00.000Z",
      });
    });

    const undoOptions = props.showToast.mock.calls.at(-1)[1];

    await act(async () => {
      await undoOptions.onAction();
    });

    expect(props.showToast).toHaveBeenCalledWith("Undo failed.");
  });

  it("handleConflictPushTomorrow is a no-op when start_time is absent", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({ id: "e4", title: "No start" });
    });

    expect(props.editEvent).not.toHaveBeenCalled();
  });

  it("handleConflictPushTomorrow shows error toast when editEvent fails", async () => {
    const props = buildRescheduleProps({
      editEvent: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "e5",
        title: "Broken event",
        start_time: "2026-03-24T14:00:00.000Z",
        end_time: "2026-03-24T15:00:00.000Z",
      });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't move to tomorrow.");
  });

  it("handleTimelineDelete deletes a regular event and shows confirmation toast", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleTimelineDelete({ id: "e6", title: "Workshop" });
    });

    expect(props.removeEvent).toHaveBeenCalledWith("e6");
    expect(props.loadEvents).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith('"Workshop" deleted.');
  });

  it("handleTimelineDelete removes a task-sourced event", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleTimelineDelete({
        id: "e7",
        title: "Task event",
        source: "task",
        external_id: 42,
      });
    });

    expect(props.deleteTask).toHaveBeenCalledWith(42);
    expect(props.showToast).toHaveBeenCalledWith('"Task event" removed.');
  });

  it("handleTimelineDelete shows error toast when removal fails", async () => {
    const props = buildRescheduleProps({
      removeEvent: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleTimelineDelete({ id: "e8", title: "Broken" });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't delete item.");
  });

  it("handleTimelineDelete accepts a raw event id and falls back to a generic label", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleTimelineDelete("e9");
    });

    expect(props.removeEvent).toHaveBeenCalledWith("e9");
    expect(props.showToast).toHaveBeenCalledWith('"Event" deleted.');
  });

  it("resolveConflictsLoading starts false and is set true then false during conflict resolution", async () => {
    let resolveConflicts;
    conflictMocks.applyConflictResolutionPlan.mockImplementationOnce(
      () => new Promise((resolve) => { resolveConflicts = resolve; }),
    );

    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    expect(result.current.resolveConflictsLoading).toBe(false);

    let pending;
    act(() => {
      pending = result.current.handleResolveTimelineConflicts();
    });

    await waitFor(() => expect(result.current.resolveConflictsLoading).toBe(true));

    await act(async () => {
      resolveConflicts();
      await pending;
    });

    expect(result.current.resolveConflictsLoading).toBe(false);
  });

  it("shows the read-only conflicts message when every move fails", async () => {
    conflictMocks.applyConflictResolutionPlan.mockResolvedValueOnce({
      failures: [{ id: 1 }],
    });
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(props.showToast).toHaveBeenCalledWith(
      "Couldn't reschedule your events. Some conflicts are read-only."
    );
  });
});
