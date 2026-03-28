import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getNextFreeSlotTodayMock = vi.fn(() => null);
const buildScheduleAutoFormMock = vi.fn();
const overlapsDayMock = vi.fn(() => true);
const isTodayMock = vi.fn(() => false);
const loadScheduleSettingsMock = vi.fn();
const submitAutoScheduleWithPrefsMock = vi.fn();

const conflictMocks = vi.hoisted(() => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(),
  buildConflictResolutionToastMessage: vi.fn(),
}));

vi.mock("../../../../pages/homepage/utils", () => ({
  formatTime: vi.fn((value) => value),
  getNextFreeSlotToday: (...args) => getNextFreeSlotTodayMock(...args),
}));

vi.mock("../../../../pages/homepage/utils/scheduleAutoForm", () => ({
  buildScheduleAutoForm: (...args) => buildScheduleAutoFormMock(...args),
}));

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  overlapsDay: (...args) => overlapsDayMock(...args),
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../../components/calendar/utils/eventUtils", () => ({
  extractBaseEventId: vi.fn((id) => id),
}));

vi.mock("../../../../components/schedules/auto/autoScheduleActions", () => ({
  loadScheduleSettings: (...args) => loadScheduleSettingsMock(...args),
  submitAutoScheduleWithPrefs: (...args) => submitAutoScheduleWithPrefsMock(...args),
}));

vi.mock("../../../../components/common/reschedule_events/rescheduleEventConflicts", () => conflictMocks);
import { useHomepageReschedule } from "../../../../pages/homepage/hooks/useHomepageReschedule";

function buildProps(overrides = {}) {
  return {
    addEvent: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    editEvent: vi.fn().mockResolvedValue(undefined),
    loadEvents: vi.fn().mockResolvedValue(undefined),
    refetchTasks: vi.fn().mockResolvedValue(undefined),
    removeEvent: vi.fn().mockResolvedValue(undefined),
    selectedDate: new Date("2026-03-24T00:00:00.000Z"),
    showToast: vi.fn(),
    sortedEvents: [],
    upcomingDeadlines: [],
    ...overrides,
  };
}
describe("useHomepageReschedule edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    buildScheduleAutoFormMock.mockReturnValue({ deadline_preferences: [] });
    overlapsDayMock.mockReturnValue(true);
    isTodayMock.mockReturnValue(false);
    loadScheduleSettingsMock.mockResolvedValue({ density: "balanced" });
    submitAutoScheduleWithPrefsMock.mockResolvedValue(undefined);
    conflictMocks.buildConflictResolutionPlan.mockReturnValue({
      operations: [{ event: { id: "event-1" } }, { event: { id: "event-2" } }],
      unresolved: [],
    });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValue("Cleared 2 conflicts.");
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue({ failures: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats missing events and deadline prefs as empty during auto schedule", async () => {
    buildScheduleAutoFormMock.mockReturnValue(undefined);
    const props = buildProps({ sortedEvents: undefined, upcomingDeadlines: undefined });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(buildScheduleAutoFormMock).toHaveBeenCalledWith({ deadlines: [] });
    expect(loadScheduleSettingsMock).toHaveBeenCalledWith(props.showToast);
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalledWith(expect.objectContaining({
      deadlines: undefined,
      settings: { density: "balanced" },
    }));
  });

  it("treats the rest of today as unavailable once the day has ended", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T23:59:59.999Z"));
    isTodayMock.mockReturnValue(true);
    const props = buildProps({ sortedEvents: undefined });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(props.showToast).toHaveBeenCalledWith("Can't auto schedule today — there are no free windows.");
    expect(loadScheduleSettingsMock).not.toHaveBeenCalled();
  });

  it("ignores events that already ended before the current cursor", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T13:00:00.000Z"));
    isTodayMock.mockReturnValue(true);
    const props = buildProps({
      selectedDate: new Date("2026-03-24T09:00:00.000Z"),
      sortedEvents: [
        { id: "past", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T10:00:00.000Z" },
        { id: "future", start_time: "2026-03-24T15:00:00.000Z", end_time: "2026-03-24T16:00:00.000Z" },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalled();
  });

  it("supports open-ended events when building auto-schedule windows", async () => {
    const props = buildProps({
      sortedEvents: [{ id: "open-ended", start_time: "2026-03-24T10:00:00.000Z" }],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalled();
  });

  it("sorts multiple study blocks before fitting them into free windows", async () => {
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [
        { ideal_minutes_per_day: 30 },
        { ideal_minutes_per_day: 45 },
      ],
    });
    const props = buildProps({
      sortedEvents: [{ id: "class", start_time: "2026-03-24T12:00:00.000Z", end_time: "2026-03-24T13:00:00.000Z" }],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalled();
  });

  it("does not append a trailing free window when an event reaches the end of the day", async () => {
    const props = buildProps({
      sortedEvents: [
        {
          id: "all-day",
          start_time: "2026-03-24T00:00:00.000Z",
          end_time: "2026-03-24T23:59:59.999Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(props.showToast).toHaveBeenCalledWith("Can't auto schedule today — there are no free windows.");
  });

  it("uses a 25 minute fallback when pushing events without an end time to tomorrow", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "evt-1",
        title: "Read chapter",
        start_time: "2026-03-24T10:00:00.000Z",
      });
    });

    const movedEvent = props.editEvent.mock.calls[0][1];
    const diffMs = new Date(movedEvent.end_time).getTime() - new Date(movedEvent.start_time).getTime();

    expect(diffMs).toBe(25 * 60000);
  });

  it("falls back to a 25 minute duration when the saved end time is invalid", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "evt-2",
        title: "Broken event",
        start_time: "2026-03-24T10:00:00.000Z",
        end_time: "not-a-date",
      });
    });

    const movedEvent = props.editEvent.mock.calls[0][1];
    const diffMs = new Date(movedEvent.end_time).getTime() - new Date(movedEvent.start_time).getTime();

    expect(diffMs).toBe(25 * 60000);
  });

  it("does nothing when push-tomorrow is called without a start time", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({ id: "evt-no-start", title: "Missing start" });
    });

    expect(props.editEvent).not.toHaveBeenCalled();
    expect(props.showToast).not.toHaveBeenCalled();
  });

  it("shows an undo failure toast when restoring a moved event fails", async () => {
    const props = buildProps({
      editEvent: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("undo failed")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "evt-3",
        title: "Seminar",
        start_time: "2026-03-24T14:00:00.000Z",
        end_time: "2026-03-24T15:00:00.000Z",
      });
    });

    const undoOptions = props.showToast.mock.calls.at(-1)[1];

    await act(async () => {
      await undoOptions.onAction();
    });

    expect(props.showToast).toHaveBeenLastCalledWith("Undo failed.");
  });

  it("appends partial failure counts to the conflict resolution toast", async () => {
    const props = buildProps();
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue({ failures: [{ id: "event-1" }] });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(props.showToast).toHaveBeenCalledWith("Cleared 2 conflicts. 1 couldn't be moved.", { durationMs: 8500 });
  });

  it("shows the read-only toast when every conflict move fails", async () => {
    const props = buildProps();
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue({
      failures: [{ id: "event-1" }, { id: "event-2" }],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleResolveTimelineConflicts();
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't reschedule your events. Some conflicts are read-only.");
  });

  it("shows the quick-start error toast when adding a gap event fails", async () => {
    const props = buildProps({
      addEvent: vi.fn().mockRejectedValue(new Error("add failed")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleQuickStartGap(new Date("2026-03-24T11:00:00.000Z"), 25, { title: "Essay plan" });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't add to schedule. Try again.");
  });

  it("shows the move failure toast when conflict auto-move fails", async () => {
    const props = buildProps({
      editEvent: vi.fn().mockRejectedValue(new Error("edit failed")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictAutoMove(
        { id: "evt-4", title: "Lecture" },
        new Date("2026-03-24T12:00:00.000Z"),
        new Date("2026-03-24T13:00:00.000Z"),
      );
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't move event. Try again.");
  });

  it("shows the move-to-tomorrow error toast when the update fails", async () => {
    const props = buildProps({
      editEvent: vi.fn().mockRejectedValue(new Error("edit failed")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleConflictPushTomorrow({
        id: "evt-5",
        title: "Tutorial",
        start_time: "2026-03-24T12:00:00.000Z",
      });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't move to tomorrow.");
  });

  it("shows the delete error toast when removing a timeline item fails", async () => {
    const props = buildProps({
      removeEvent: vi.fn().mockRejectedValue(new Error("remove failed")),
    });
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleTimelineDelete({ id: "evt-6", title: "Meeting" });
    });

    expect(props.showToast).toHaveBeenCalledWith("Couldn't delete item.");
  });

  it("restores the original event when a same-day reschedule update fails", async () => {
    getNextFreeSlotTodayMock.mockReturnValue({
      start: new Date("2026-03-24T12:00:00.000Z"),
      end: new Date("2026-03-24T12:45:00.000Z"),
    });
    const props = buildProps({
      editEvent: vi.fn().mockRejectedValue(new Error("edit failed")),
    });
    const originalEvent = {
      id: "evt-7",
      title: "Workshop",
      start_time: "2026-03-24T09:00:00.000Z",
      end_time: "2026-03-24T09:45:00.000Z",
    };
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleReschedule(originalEvent);
    });

    expect(props.removeEvent).toHaveBeenCalledTimes(2);
    expect(props.removeEvent).toHaveBeenNthCalledWith(1, "evt-7");
    expect(props.removeEvent).toHaveBeenNthCalledWith(2, "evt-7");
    expect(props.addEvent).toHaveBeenNthCalledWith(2, originalEvent);
    expect(props.showToast).toHaveBeenLastCalledWith("Couldn't reschedule. Try again.");
  });

  it("uses a 25 minute fallback for zero-duration tomorrow reschedules", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleRescheduleTomorrow({
        id: "evt-zero",
        title: "Zero duration",
        start_time: "2026-03-24T10:00:00.000Z",
        end_time: "2026-03-24T10:00:00.000Z",
      });
    });

    const tomorrowEvent = props.addEvent.mock.calls[0][0];
    const diffMs = new Date(tomorrowEvent.end_time).getTime() - new Date(tomorrowEvent.start_time).getTime();

    expect(diffMs).toBe(25 * 60000);
  });
});
