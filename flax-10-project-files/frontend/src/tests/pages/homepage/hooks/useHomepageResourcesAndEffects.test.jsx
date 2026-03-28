import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getModulesMock = vi.fn();
const getEnrollmentsMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();
const fetchTaskListsMock = vi.fn();
const playCompletionChimeMock = vi.fn();

vi.mock("../../../../api/moduleApi", () => ({
  getModules: (...args) => getModulesMock(...args),
  getEnrollments: (...args) => getEnrollmentsMock(...args),
}));

vi.mock("../../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlinesMock(...args),
}));

vi.mock("../../../../api/taskApi", () => ({
  fetchTaskLists: (...args) => fetchTaskListsMock(...args),
}));

vi.mock("../../../../lib/sounds", () => ({
  playCompletionChime: (...args) => playCompletionChimeMock(...args),
}));

import { useHomepageResources } from "../../../../pages/homepage/hooks/useHomepageResources";
import {
  useHomepageNow,
  useHomepageSelection,
  useHomepageEventBootstrap,
  useTimerCompletionSound,
} from "../../../../pages/homepage/hooks/useHomepagePageEffects";

describe("Homepage hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModulesMock.mockResolvedValue([{ id: 1, module_code: "CS101" }]);
    getEnrollmentsMock.mockResolvedValue([{ module: 1 }]);
    getUpcomingDeadlinesMock.mockResolvedValue([{ id: 2, title: "Essay" }]);
    fetchTaskListsMock.mockResolvedValue([{ id: 3, name: "Inbox" }]);
  });

  it("loads homepage resources and lets task lists be refreshed or updated", async () => {
    const { result } = renderHook(() => useHomepageResources());

    await waitFor(() => expect(result.current.modulesList).toEqual([{ id: 1, module_code: "CS101" }]));
    expect(result.current.enrollments).toEqual([{ module: 1 }]);
    expect(result.current.upcomingDeadlines).toEqual([{ id: 2, title: "Essay" }]);
    expect(result.current.taskLists).toEqual([{ id: 3, name: "Inbox" }]);

    fetchTaskListsMock.mockResolvedValueOnce([{ id: 4, name: "Reading list" }]);
    await act(async () => {
      await result.current.refreshTaskLists();
    });
    expect(result.current.taskLists).toEqual([{ id: 4, name: "Reading list" }]);

    act(() => {
      result.current.setTaskLists([{ id: 5, name: "Custom" }]);
    });
    expect(result.current.taskLists).toEqual([{ id: 5, name: "Custom" }]);
  });

  it("recovers task lists from a failed refresh and normalizes non-arrays on refresh", async () => {
    const { result } = renderHook(() => useHomepageResources());
    await waitFor(() => expect(result.current.taskLists).toEqual([{ id: 3, name: "Inbox" }]));

    fetchTaskListsMock.mockRejectedValueOnce(new Error("refresh failed"));
    await act(async () => {
      await result.current.refreshTaskLists();
    });
    expect(result.current.taskLists).toEqual([]);

    fetchTaskListsMock.mockResolvedValueOnce("bad-refresh");
    await act(async () => {
      await result.current.refreshTaskLists();
    });
    expect(result.current.taskLists).toEqual([]);
  });

  it("normalizes failed or non-array homepage resources to empty lists", async () => {
    getModulesMock.mockResolvedValueOnce(null);
    getEnrollmentsMock.mockRejectedValueOnce(new Error("down"));
    getUpcomingDeadlinesMock.mockResolvedValueOnce("bad");
    fetchTaskListsMock.mockRejectedValueOnce(new Error("nope"));

    const { result } = renderHook(() => useHomepageResources());

    await waitFor(() => {
      expect(result.current.modulesList).toEqual([]);
      expect(result.current.enrollments).toEqual([]);
      expect(result.current.upcomingDeadlines).toEqual([]);
      expect(result.current.taskLists).toEqual([]);
    });
  });

  it("updates the current time on an interval", () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    vi.setSystemTime(new Date("2026-03-24T10:00:00Z"));

    const { result, unmount } = renderHook(() => useHomepageNow());
    const firstTime = result.current.getTime();

    vi.setSystemTime(new Date("2026-03-24T10:00:10Z"));
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.getTime()).not.toBe(firstTime);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("dispatches selected-date setup and boots empty calendars after a delay", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();
    const loadEvents = vi.fn();

    renderHook(() => useHomepageSelection(dispatch));
    renderHook(() => useHomepageEventBootstrap([], loadEvents, new Date("2026-03-24T00:00:00Z")));

    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_SELECTED_DATE",
      payload: expect.any(Date),
    });

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(loadEvents).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("skips calendar bootstrap when events already exist", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const loadEvents = vi.fn();

    const { unmount } = renderHook(() =>
      useHomepageEventBootstrap([{ id: 1, title: "Lecture" }], loadEvents, new Date("2026-03-24T00:00:00Z"))
    );

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(loadEvents).not.toHaveBeenCalled();
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not load empty calendars after unmount", () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn();
    const { unmount } = renderHook(() =>
      useHomepageEventBootstrap([], loadEvents, new Date("2026-03-24T00:00:00Z"))
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(loadEvents).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("treats missing calendar events like an empty calendar during bootstrap", () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn();

    renderHook(() =>
      useHomepageEventBootstrap(undefined, loadEvents, new Date("2026-03-24T00:00:00Z"))
    );

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(loadEvents).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("plays the completion chime only when a work timer reaches zero", () => {
    const { rerender } = renderHook(
      ({ hasTimerSession, timeLeft, timerMode }) =>
        useTimerCompletionSound(hasTimerSession, timeLeft, timerMode),
      {
        initialProps: { hasTimerSession: true, timeLeft: 120, timerMode: "work" },
      }
    );

    rerender({ hasTimerSession: true, timeLeft: 0, timerMode: "work" });
    expect(playCompletionChimeMock).toHaveBeenCalledWith(0.35);

    playCompletionChimeMock.mockClear();
    rerender({ hasTimerSession: true, timeLeft: 30, timerMode: "break" });
    rerender({ hasTimerSession: true, timeLeft: 0, timerMode: "break" });
    expect(playCompletionChimeMock).not.toHaveBeenCalled();
  });

  it("does not play the chime when there is no prior active countdown or when the timer is off", () => {
    const { rerender } = renderHook(
      ({ hasTimerSession, timeLeft, timerMode }) =>
        useTimerCompletionSound(hasTimerSession, timeLeft, timerMode),
      {
        initialProps: { hasTimerSession: false, timeLeft: 0, timerMode: "work" },
      }
    );

    rerender({ hasTimerSession: false, timeLeft: 0, timerMode: "work" });
    rerender({ hasTimerSession: true, timeLeft: 0, timerMode: "break" });
    expect(playCompletionChimeMock).not.toHaveBeenCalled();
  });
});
