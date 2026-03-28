import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useCalendarMock = vi.fn();
const fetchTasksMock = vi.fn();
const getEventsMock = vi.fn();

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendar: () => useCalendarMock(),
}));

vi.mock("../../../../api/taskApi", () => ({
  fetchTasks: () => fetchTasksMock(),
}));

vi.mock("../../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

import { useHomeData } from "../../../../pages/homepage/hooks/useHomeData.js";

describe("useHomeData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads core task blocks and fetches events spanning the active day", async () => {
    const dt = new Date("2026-03-25T09:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([{ id: 1, title: "Urgent", due_date: "2026-03-25T12:00Z", priority: "urgent", completed: false }]);
    getEventsMock.mockResolvedValue([{ id: "e1", start_time: "2026-03-25T09:00Z", end_time: "2026-03-25T10:00Z" }]);
    const { result } = renderHook(() => useHomeData(dt));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getEventsMock).toHaveBeenCalledWith({ start: "2026-03-25T00:00:00.000Z", end: "2026-03-25T23:59:59.999Z" });
    expect(result.current.dayEvents.map((event) => event.id)).toEqual(["e1"]);
  });

  it("filters remote tasks extracting partial scopes dynamically", async () => {
    const dt = new Date("2026-03-25T09:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([{ id: 1, due_date: "2026-03-25T12:00Z", priority: "urgent", completed: false }, { id: 3, due_date: "2026-03-26T10:00Z", priority: "low", completed: false }]);
    getEventsMock.mockResolvedValue([]);
    const { result } = renderHook(() => useHomeData(dt));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allTasks.map((task) => task.id)).toEqual([1, 3]);
    expect(result.current.dayTasks.map((task) => task.id)).toEqual([1]);
    act(() => result.current.removePendingTask(1));
    expect(result.current.allTasks.map((task) => task.id)).toEqual([3]);
  });

  it("prefers calendar events over fallback data and recovers from failed fetches", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    useCalendarMock.mockReturnValue({
      events: [{ id: "calendar", start_time: "2026-03-25T11:00:00Z", end_time: "2026-03-25T12:00:00Z" }],
      allEvents: [{ id: "all", start_time: "2026-03-25T08:00:00Z", end_time: "2026-03-25T09:00:00Z" }],
    });
    fetchTasksMock.mockRejectedValue(new Error("tasks failed"));
    getEventsMock.mockRejectedValue(new Error("events failed"));

    const { result } = renderHook(() => useHomeData(selectedDate));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.allTasks).toEqual([]);
    expect(result.current.dayEvents.map((event) => event.id)).toEqual(["all"]);

    await act(async () => {
      await result.current.refetchTasks();
    });

    expect(fetchTasksMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to context events when allEvents is empty and normalizes non-array event payloads", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    useCalendarMock.mockReturnValue({
      events: [{ id: "calendar", start_time: "2026-03-25T11:00:00Z", end_time: "2026-03-25T12:00:00Z" }],
      allEvents: [],
    });
    fetchTasksMock.mockResolvedValue([]);
    getEventsMock.mockResolvedValue("bad");

    const { result } = renderHook(() => useHomeData(selectedDate));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dayEvents.map((event) => event.id)).toEqual(["calendar"]);
  });

  it("sorts pending day tasks by priority and excludes completed or undated items", async () => {
    const dt = new Date("2026-03-25T09:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([
      { id: 1, due_date: "2026-03-25T12:00Z", priority: "medium", completed: false },
      { id: 2, due_date: "2026-03-25T08:00Z", priority: "urgent", completed: false },
      { id: 3, due_date: null, priority: "high", completed: false },
      { id: 4, due_date: "2026-03-25T13:00Z", priority: "high", completed: true },
    ]);
    getEventsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useHomeData(dt));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dayTasks.map((task) => task.id)).toEqual([2, 1]);
  });

  it("normalizes null task payloads to an empty list", async () => {
    const dt = new Date("2026-03-25T09:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue(null);
    getEventsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useHomeData(dt));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.allTasks).toEqual([]);
    expect(result.current.dayTasks).toEqual([]);
  });

  it("ignores late day-event updates after the hook unmounts", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    let resolveEvents;

    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([]);
    getEventsMock.mockReturnValue(new Promise((resolve) => {
      resolveEvents = resolve;
    }));

    const { unmount } = renderHook(() => useHomeData(selectedDate));

    unmount();

    await act(async () => {
      resolveEvents([{ id: "late", start_time: "2026-03-25T12:00:00Z", end_time: "2026-03-25T13:00:00Z" }]);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getEventsMock).toHaveBeenCalledWith({
      start: "2026-03-25T00:00:00.000Z",
      end: "2026-03-25T23:59:59.999Z",
    });
  });

  it("uses start times for open-ended events and ranks unknown priorities last", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([
      { id: 1, due_date: "2026-03-25T08:00:00Z", priority: "high", completed: false },
      { id: 2, due_date: "2026-03-25T12:00:00Z", priority: "mystery", completed: false },
    ]);
    getEventsMock.mockResolvedValue([{ id: "no-end", start_time: "2026-03-25T11:00:00Z" }]);

    const { result } = renderHook(() => useHomeData(selectedDate));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dayEvents.map((event) => event.id)).toEqual(["no-end"]);
    expect(result.current.dayTasks.map((task) => task.id)).toEqual([1, 2]);
  });

  it("uses the default priority rank when both compared tasks are unknown", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    useCalendarMock.mockReturnValue({ events: [], allEvents: [] });
    fetchTasksMock.mockResolvedValue([
      { id: 1, due_date: "2026-03-25T08:00:00Z", priority: "mystery", completed: false },
      { id: 2, due_date: "2026-03-25T12:00:00Z", priority: "surprise", completed: false },
    ]);
    getEventsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useHomeData(selectedDate));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dayTasks.map((task) => task.id)).toEqual([1, 2]);
  });
});
