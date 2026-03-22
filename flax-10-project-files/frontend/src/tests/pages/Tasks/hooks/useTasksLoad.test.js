/* Tests for useTasksLoad hook fetching and loading tasks */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../../api/tasks/taskApi", () => ({ fetchTasks: vi.fn() }));

import useTasksLoad from "../../../../pages/Tasks/hooks/useTasksLoad";
import { fetchTasks } from "../../../../api/tasks/taskApi";

describe("useTasksLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads tasks with filters", async () => {
    fetchTasks.mockResolvedValueOnce([{ id: 1, title: "A" }]);
    const { result } = renderHook(() => useTasksLoad({ task_list: 7 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchTasks).toHaveBeenCalledWith({ task_list: 7 });
    expect(result.current.tasks).toEqual([{ id: 1, title: "A" }]);
    expect(result.current.initialLoading).toBe(false);
  });

  it("handles fetch failure", async () => {
    fetchTasks.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useTasksLoad());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.initialLoading).toBe(false);
  });
});
