import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

let currentTasks = [];

vi.mock("../../../../api/taskApi", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("../../../../pages/tasks/utils/readingSpeedUtils", () => ({
  recalculatePendingBlocks: vi.fn((tasks) => tasks.map((task) => ({ ...task, recalculated: true }))),
}));

const loadState = {
  get tasks() {
    return currentTasks;
  },
  setTasks: vi.fn((updater) => {
    currentTasks = typeof updater === "function" ? updater(currentTasks) : updater;
  }),
  loading: false,
  initialLoading: false,
  load: vi.fn(),
};

vi.mock("../../../../pages/tasks/hooks/useTasksLoad", () => ({
  default: vi.fn(() => loadState),
}));

import useTasks from "../../../../pages/tasks/hooks/useTasks";
import { deleteTask, updateTask } from "../../../../api/taskApi";
import { recalculatePendingBlocks } from "../../../../pages/tasks/utils/readingSpeedUtils";

describe("useTasks coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTasks = [
      { id: 1, title: "Read article", completed: false },
      { id: 2, title: "Essay", completed: false },
    ];
  });

  it("recalculates pending blocks after completing a reading task", async () => {
    updateTask.mockResolvedValueOnce({ id: 1, title: "Read article", completed: true, reading_id: 44 });

    const { result } = renderHook(() => useTasks());

    await result.current.toggleComplete(1, false);

    expect(recalculatePendingBlocks).toHaveBeenCalled();
    expect(currentTasks[0]).toMatchObject({ id: 1, recalculated: true });
  });

  it("reverts an optimistic toggle when the update fails", async () => {
    updateTask.mockRejectedValueOnce(new Error("toggle failed"));

    const { result } = renderHook(() => useTasks());

    await expect(result.current.toggleComplete(1, false)).resolves.toBeUndefined();
    expect(currentTasks[0].completed).toBe(false);
  });

  it("restores a removed task when delete fails", async () => {
    deleteTask.mockRejectedValueOnce(new Error("delete failed"));

    const { result } = renderHook(() => useTasks());

    await expect(result.current.removeTask(2)).rejects.toThrow("delete failed");
    expect(currentTasks.map((task) => task.id)).toEqual([1, 2]);
  });

  it("leaves task state untouched when a missing task cannot be deleted", async () => {
    deleteTask.mockRejectedValueOnce(new Error("missing"));

    const { result } = renderHook(() => useTasks());

    await expect(result.current.removeTask(999)).rejects.toThrow("missing");
    expect(currentTasks.map((task) => task.id)).toEqual([1, 2]);
  });
});
