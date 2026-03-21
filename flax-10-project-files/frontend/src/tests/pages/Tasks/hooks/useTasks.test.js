/* Tests for useTasks hook task CRUD operations and state management */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../../../../api/taskApi", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const loadState = {
  tasks: [{ id: 1, title: "Old", completed: false }],
  loading: false,
  initialLoading: false,
  load: vi.fn(),
  setTasks: vi.fn(),
};

vi.mock("../../../../pages/Tasks/hooks/useTasksLoad", () => ({
  default: vi.fn(() => loadState),
}));

import useTasks from "../../../../pages/Tasks/hooks/useTasks";
import { createTask, updateTask, deleteTask } from "../../../../api/taskApi";

describe("useTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds task and preserves fallback list", async () => {
    createTask.mockResolvedValueOnce({ id: 2, title: "New" });
    const { result } = renderHook(() => useTasks());
    const created = await result.current.addTask({ title: "New", task_list: 9 });
    expect(created.task_list).toBe(9);
    expect(loadState.setTasks).toHaveBeenCalled();
  });

  it("edits task", async () => {
    updateTask.mockResolvedValueOnce({ id: 1, title: "Edited" });
    const { result } = renderHook(() => useTasks());
    const out = await result.current.editTask(1, { title: "Edited" });
    expect(out.title).toBe("Edited");
    expect(loadState.setTasks).toHaveBeenCalled();
  });

  it("removes and toggles tasks", async () => {
    updateTask.mockResolvedValueOnce({ id: 1, completed: true });
    const { result } = renderHook(() => useTasks());
    await result.current.toggleComplete(1, false);
    await result.current.removeTask(1);
    expect(updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(deleteTask).toHaveBeenCalledWith(1);
  });
});
