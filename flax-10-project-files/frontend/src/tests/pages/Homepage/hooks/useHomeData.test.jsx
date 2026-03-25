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

import { useHomeData } from "../../../../pages/Homepage/hooks/useHomeData.js";

describe("useHomeData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads tasks and fallback events, filters day items, and removes pending tasks", async () => {
    const selectedDate = new Date("2026-03-25T09:00:00Z");
    useCalendarMock.mockReturnValue({
      events: [],
      allEvents: [],
    });
    fetchTasksMock.mockResolvedValue([
      { id: 1, title: "Urgent", due_date: "2026-03-25T12:00:00Z", priority: "urgent", completed: false },
      { id: 2, title: "Done", due_date: "2026-03-25T10:00:00Z", priority: "high", completed: true },
      { id: 3, title: "Later", due_date: "2026-03-26T10:00:00Z", priority: "low", completed: false },
      { id: 4, title: "High", due_date: "2026-03-25T14:00:00Z", priority: "high", completed: false },
    ]);
    getEventsMock.mockResolvedValue([
      { id: "e1", start_time: "2026-03-25T09:00:00Z", end_time: "2026-03-25T10:00:00Z" },
      { id: "e2", start_time: "2026-03-26T09:00:00Z", end_time: "2026-03-26T10:00:00Z" },
    ]);

    const { result } = renderHook(() => useHomeData(selectedDate));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getEventsMock).toHaveBeenCalledWith({
      start: "2026-03-25T00:00:00.000Z",
      end: "2026-03-25T23:59:59.999Z",
    });
    expect(result.current.allTasks.map((task) => task.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.dayEvents.map((event) => event.id)).toEqual(["e1"]);
    expect(result.current.dayTasks.map((task) => task.id)).toEqual([1, 4]);

    act(() => {
      result.current.removePendingTask(1);
    });

    expect(result.current.allTasks.map((task) => task.id)).toEqual([2, 3, 4]);
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
});
