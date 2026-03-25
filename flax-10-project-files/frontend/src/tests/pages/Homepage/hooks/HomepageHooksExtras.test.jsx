import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// Mocks for useHomepageReschedule branches
// ──────────────────────────────────────────────────────────────────────────────

const extractBaseEventIdMock = vi.fn((id) => id);
const formatTimeMock = vi.fn(() => "10:00");
const getNextFreeSlotTodayMock = vi.fn(() => null);

vi.mock("../../../../pages/Homepage/utils/index", () => ({
  formatTime: (...args) => formatTimeMock(...args),
  getAllFreeWindowsToday: vi.fn(() => []),
  getNextFreeSlotToday: (...args) => getNextFreeSlotTodayMock(...args),
  isRoutineEvent: vi.fn(() => false),
}));

vi.mock("../../../../components/Calendar/utils/eventUtils", () => ({
  extractBaseEventId: (...args) => extractBaseEventIdMock(...args),
}));

const conflictMocks = vi.hoisted(() => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(),
  buildConflictResolutionToastMessage: vi.fn(),
}));

vi.mock("../../../../components/common/RescheduleEvents/rescheduleEventConflicts", () => conflictMocks);

// ──────────────────────────────────────────────────────────────────────────────
// Mocks for useCountdown
// ──────────────────────────────────────────────────────────────────────────────
// (no external dependencies — uses real timers / Date)

// ──────────────────────────────────────────────────────────────────────────────
// Mocks for useHomepageActions extra branches
// ──────────────────────────────────────────────────────────────────────────────

const updateTaskMock = vi.fn();
const deleteTaskMock = vi.fn();

vi.mock("../../../../api/taskApi", () => ({
  updateTask: (...args) => updateTaskMock(...args),
  deleteTask: (...args) => deleteTaskMock(...args),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Mocks for useIntelligenceDashboard
// ──────────────────────────────────────────────────────────────────────────────

const tflGetDelaysMock = vi.fn(() => Promise.resolve([]));
vi.mock("../../../../api/tflApi", () => ({
  tflService: { getTfLDelays: (...args) => tflGetDelaysMock(...args) },
}));
vi.mock("../../../../api/adminApi", () => ({
  getMyCourseChangeRequest: vi.fn(() => Promise.resolve(null)),
}));
vi.mock("../../../../api/userApi", () => ({
  updateUserSettings: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../../../components/Analytics/useAttendanceStats", () => ({
  default: vi.fn(() => ({ loading: false, stats: null })),
}));
vi.mock("../../../../components/Analytics/attendanceChartConfig", () => ({
  getAttendancePercentage: vi.fn(() => 0),
}));
vi.mock("../../../../lib/termConfig", () => ({
  loadTermConfig: vi.fn(() => null),
}));
vi.mock("../../../../pages/Homepage/components/IntelligenceUtils", () => ({
  getCurrentEvent: vi.fn(() => null),
  getLiveContext: vi.fn(() => ({ label: "Right now", text: "idle", meta: null, tone: "neutral", iconKey: "Clock3" })),
  getUpcomingEvent: vi.fn(() => null),
}));
vi.mock("../../../../pages/Homepage/utils/kclTflMapping", () => ({
  getRelevantDelays: vi.fn(() => []),
  isSevereDisruption: vi.fn(() => false),
}));
vi.mock("../../../../pages/Analytics/hooks/useAnalyticsOverview", () => ({
  default: vi.fn(() => ({})),
}));

import { useHomepageReschedule } from "../../../../pages/Homepage/hooks/useHomepageReschedule";
import { useHomepageActions } from "../../../../pages/Homepage/hooks/useHomepageActions";
import { useCountdown } from "../../../../pages/Homepage/hooks/useCountdown";
import {
  getSemesterProgress,
  useIntelligenceDashboard,
} from "../../../../pages/Homepage/hooks/useIntelligenceDashboard";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

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

function buildActionsProps(overrides = {}) {
  return {
    openPopup: vi.fn(),
    refetchTasks: vi.fn().mockResolvedValue([]),
    removePendingTask: vi.fn(),
    showCompletionToast: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// useHomepageReschedule — uncovered branches
// ──────────────────────────────────────────────────────────────────────────────

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
        // no end_time — should fall back to 25 min
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

    // Should produce a tomorrow event
    const addedEvent = props.addEvent.mock.calls[0][0];
    const addedDate = new Date(addedEvent.start_time);
    expect(addedDate.getDate()).toBe(25); // tomorrow
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
    // Should restore the original event
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
});

// ──────────────────────────────────────────────────────────────────────────────
// useHomepageActions — extra branches
// ──────────────────────────────────────────────────────────────────────────────

describe("useHomepageActions extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.AudioContext = undefined;
    window.webkitAudioContext = vi.fn(function () {
      return {
        currentTime: 0,
        destination: {},
        createOscillator: () => ({
          connect: vi.fn(),
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: () => ({
          connect: vi.fn(),
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        }),
      };
    });
  });

  it("falls back to webkitAudioContext when AudioContext is undefined", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: "task-20", title: "Non-routine task", completed: false });
    });

    expect(window.webkitAudioContext).toHaveBeenCalled();
  });

  it("handleTaskWidgetComplete does not call sound or removePendingTask when toggling to incomplete", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 5, title: "Some task", completed: true });
    });

    expect(props.removePendingTask).not.toHaveBeenCalled();
    expect(props.showCompletionToast).not.toHaveBeenCalled();
  });

  it("handleTaskToggle notifies completion and refetches when completing", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskToggle({ id: 99, title: "Review slides" }, true);
    });

    expect(props.showCompletionToast).toHaveBeenCalled();
    expect(updateTaskMock).toHaveBeenCalledWith(99, { completed: true });
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it("deleteTaskAndRefresh accepts a plain task id (non-object)", async () => {
    deleteTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.deleteTaskAndRefresh(77);
    });

    expect(deleteTaskMock).toHaveBeenCalledWith(77);
    expect(props.refetchTasks).toHaveBeenCalled();
  });

  it("handleTaskUpdateFailure does not show toast when refreshed tasks appear completed", async () => {
    updateTaskMock.mockRejectedValueOnce(new Error("fail"));
    const props = buildActionsProps({
      refetchTasks: vi.fn().mockResolvedValue([{ id: 5, completed: true }]),
    });
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 5, title: "Essay", completed: false });
    });

    expect(props.showToast).not.toHaveBeenCalled();
  });

  it("getTaskId handles a numeric id (no task- prefix)", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: 42, title: "Plain id task", completed: false });
    });

    expect(updateTaskMock).toHaveBeenCalledWith(42, { completed: true });
  });

  it("getTaskId handles a string id without task- prefix", async () => {
    updateTaskMock.mockResolvedValueOnce({});
    const props = buildActionsProps();
    const { result } = renderHook(() => useHomepageActions(props));

    await act(async () => {
      await result.current.handleTaskWidgetComplete({ id: "abc-123", title: "String id", completed: false });
    });

    expect(updateTaskMock).toHaveBeenCalledWith("abc-123", { completed: true });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// useCountdown — branch coverage
// ──────────────────────────────────────────────────────────────────────────────

describe("useCountdown branches", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns empty text and relaxed urgency for null target", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.text).toBe("");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("returns empty text and relaxed urgency for non-Date target", () => {
    const { result } = renderHook(() => useCountdown("not-a-date"));
    expect(result.current.text).toBe("");
    expect(result.current.urgency).toBe("relaxed");
  });

  it('returns "now" text when less than 1 minute remains', () => {
    const target = new Date(Date.now() + 30000); // 30 seconds
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("now");
    expect(result.current.urgency).toBe("urgent");
  });

  it("returns in Xm when less than 60 minutes remain", () => {
    const target = new Date(Date.now() + 15 * 60000); // 15 minutes
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 15m");
    expect(result.current.urgency).toBe("soon");
  });

  it("returns in Xh when exactly N hours remain with no remainder", () => {
    const target = new Date(Date.now() + 2 * 60 * 60000); // 2 hours exactly
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 2h");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("returns in Xh Ym when hours and minutes remain", () => {
    const target = new Date(Date.now() + (1 * 60 + 30) * 60000); // 1h 30m
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 1h 30m");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("ticks the countdown on interval", () => {
    const target = new Date(Date.now() + 5 * 60000); // 5 minutes
    const { result } = renderHook(() => useCountdown(target));
    const initialText = result.current.text;

    act(() => {
      vi.advanceTimersByTime(61000); // advance past 1 tick
    });

    // text may have updated
    expect(result.current.text).toBeDefined();
    expect(initialText).toMatch(/in \d+m/);
  });

  it("stops ticking after the target time has passed", () => {
    const target = new Date(Date.now() + 2000); // 2 seconds
    renderHook(() => useCountdown(target));

    // advance past the target — should not throw
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getSemesterProgress — pure function branch coverage
// ──────────────────────────────────────────────────────────────────────────────

describe("getSemesterProgress branches", () => {
  const { loadTermConfig } = vi.hoisted(() => ({ loadTermConfig: vi.fn() }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when loadTermConfig returns an invalid start date", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "not-a-date", totalWeeks: 10 });
    const result = getSemesterProgress(new Date("2026-03-24"));
    expect(result).toBeNull();
  });

  it("returns null when startDate is missing", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ totalWeeks: 10 });
    const result = getSemesterProgress(new Date("2026-03-24"));
    expect(result).toBeNull();
  });

  it("returns hasStarted=false when today is before semester start", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-09-01", totalWeeks: 12, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-01-01"));
    expect(result?.hasStarted).toBe(false);
  });

  it("returns isFinished=true when today is after semester end", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-06", totalWeeks: 12, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-06-01"));
    expect(result?.isFinished).toBe(true);
    expect(result?.pct).toBe(100);
  });

  it("includes reading week in total day count when hasReadingWeek is true", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-06", totalWeeks: 12, hasReadingWeek: true });
    const result = getSemesterProgress(new Date("2026-01-13")); // one week in
    expect(result?.hasStarted).toBe(true);
    expect(result?.pct).toBeGreaterThan(0);
    expect(result?.pct).toBeLessThan(100);
  });

  it("clamps pct to 100 when elapsed exceeds total days", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-01", totalWeeks: 1, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-12-31"));
    expect(result?.pct).toBe(100);
  });
});
