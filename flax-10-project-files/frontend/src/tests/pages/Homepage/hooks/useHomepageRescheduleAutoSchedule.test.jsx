import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const formatTimeMock = vi.fn((value) => value);
const getNextFreeSlotTodayMock = vi.fn(() => null);
const buildScheduleAutoFormMock = vi.fn();
const overlapsDayMock = vi.fn(() => true);
const isTodayMock = vi.fn(() => false);
const loadScheduleSettingsMock = vi.fn();
const submitAutoScheduleWithPrefsMock = vi.fn();

vi.mock("../../../../pages/Homepage/utils/index", () => ({
  formatTime: (...args) => formatTimeMock(...args),
  getNextFreeSlotToday: (...args) => getNextFreeSlotTodayMock(...args),
}));

vi.mock("../../../../pages/Homepage/utils/ScheduleAutoForm", () => ({
  buildScheduleAutoForm: (...args) => buildScheduleAutoFormMock(...args),
}));

vi.mock("../../../../components/Calendar/utils/dateUtils", () => ({
  overlapsDay: (...args) => overlapsDayMock(...args),
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../../components/Calendar/utils/eventUtils", () => ({
  extractBaseEventId: vi.fn((id) => id),
}));

vi.mock("../../../../components/Schedules/auto/autoScheduleActions", () => ({
  loadScheduleSettings: (...args) => loadScheduleSettingsMock(...args),
  submitAutoScheduleWithPrefs: (...args) => submitAutoScheduleWithPrefsMock(...args),
}));

vi.mock("../../../../components/common/RescheduleEvents/rescheduleEventConflicts", () => ({
  applyConflictResolutionPlan: vi.fn(),
  buildConflictResolutionPlan: vi.fn(() => ({ operations: [], unresolved: [] })),
  buildConflictResolutionToastMessage: vi.fn(() => "No conflicts."),
}));

import { useHomepageReschedule } from "../../../../pages/Homepage/hooks/useHomepageReschedule";

function buildProps(overrides = {}) {
  return {
    addEvent: vi.fn(),
    deleteTask: vi.fn(),
    editEvent: vi.fn(),
    loadEvents: vi.fn().mockResolvedValue(undefined),
    refetchTasks: vi.fn(),
    removeEvent: vi.fn(),
    selectedDate: new Date("2026-03-24T00:00:00.000Z"),
    showToast: vi.fn(),
    sortedEvents: [],
    upcomingDeadlines: [],
    ...overrides,
  };
}

describe("useHomepageReschedule auto-schedule branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadScheduleSettingsMock.mockResolvedValue({ density: "balanced" });
    submitAutoScheduleWithPrefsMock.mockImplementation(async ({ onDone }) => {
      await onDone?.();
    });
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [],
    });
  });

  it("blocks auto schedule when there are no free windows", async () => {
    const props = buildProps({
      sortedEvents: [
        {
          id: "busy",
          start_time: "2026-03-24T00:00:00.000Z",
          end_time: "2026-03-24T23:59:59.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(props.showToast).toHaveBeenCalledWith("Can't auto schedule today — there are no free windows.");
    expect(loadScheduleSettingsMock).not.toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).not.toHaveBeenCalled();
  });

  it("blocks auto schedule when the available margin is too small", async () => {
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [{ ideal_minutes_per_day: 60 }],
    });

    const props = buildProps({
      sortedEvents: [
        {
          id: "busy",
          start_time: "2026-03-24T01:00:00.000Z",
          end_time: "2026-03-24T23:59:59.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(props.showToast).toHaveBeenCalledWith(
      "Can't auto schedule today — not enough free time to avoid overlaps."
    );
    expect(loadScheduleSettingsMock).not.toHaveBeenCalled();
  });

  it("blocks auto schedule when no single window can fit the required block", async () => {
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [{ ideal_minutes_per_day: 45 }],
    });

    const props = buildProps({
      sortedEvents: [
        {
          id: "morning",
          start_time: "2026-03-24T00:30:00.000Z",
          end_time: "2026-03-24T12:00:00.000Z",
        },
        {
          id: "afternoon",
          start_time: "2026-03-24T12:30:00.000Z",
          end_time: "2026-03-24T23:59:59.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(props.showToast).toHaveBeenCalledWith(
      "Can't auto schedule today — no single window fits the required study blocks."
    );
    expect(loadScheduleSettingsMock).not.toHaveBeenCalled();
  });

  it("loads settings, submits auto schedule, and refreshes state on success", async () => {
    const props = buildProps({
      sortedEvents: [
        {
          id: "class",
          start_time: "2026-03-24T10:00:00.000Z",
          end_time: "2026-03-24T11:00:00.000Z",
        },
      ],
      upcomingDeadlines: [{ id: 1, title: "Essay" }],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalledWith(props.showToast);
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        deadlines: props.upcomingDeadlines,
        settings: { density: "balanced" },
        showToast: props.showToast,
        onDone: expect.any(Function),
      })
    );
    expect(props.loadEvents).toHaveBeenCalled();
    expect(props.refetchTasks).toHaveBeenCalled();
    expect(result.current.autoScheduleLoading).toBe(false);
  });

  it("clears loading when auto schedule submission fails after validation passes", async () => {
    submitAutoScheduleWithPrefsMock.mockRejectedValueOnce(new Error("nope"));
    const props = buildProps({
      sortedEvents: [
        {
          id: "class",
          start_time: "2026-03-24T10:00:00.000Z",
          end_time: "2026-03-24T11:00:00.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await expect(act(async () => {
      await result.current.handleAutoSchedule();
    })).rejects.toThrow("nope");

    expect(result.current.autoScheduleLoading).toBe(false);
  });

  it("allows auto schedule to proceed when deadline prefs are empty or zero", async () => {
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [{ ideal_minutes_per_day: 0 }, {}],
    });
    const props = buildProps({
      sortedEvents: [
        {
          id: "class",
          start_time: "2026-03-24T10:00:00.000Z",
          end_time: "2026-03-24T11:00:00.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalled();
    expect(result.current.autoScheduleLoading).toBe(false);
  });

  it("allows a positive study block to fit into an available window", async () => {
    buildScheduleAutoFormMock.mockReturnValue({
      deadline_preferences: [{ ideal_minutes_per_day: 30 }],
    });
    const props = buildProps({
      sortedEvents: [
        {
          id: "class",
          start_time: "2026-03-24T10:00:00.000Z",
          end_time: "2026-03-24T11:00:00.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useHomepageReschedule(props));

    await act(async () => {
      await result.current.handleAutoSchedule();
    });

    expect(loadScheduleSettingsMock).toHaveBeenCalled();
    expect(submitAutoScheduleWithPrefsMock).toHaveBeenCalled();
  });
});
