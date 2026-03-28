import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const getAuthHeaders = vi.fn(() => ({ Authorization: "Token abc" }));
const calcCompletionSegments = vi.fn(() => ({ complete: 1 }));
const sortTasks = vi.fn((tasks) => [...tasks].sort((a, b) => a.id - b.id));

vi.mock("../../../pages/group_work/hooks/groupWorkHooks", () => ({
  getAuthHeaders: (...args) => getAuthHeaders(...args),
}));

vi.mock("../../../pages/group_work/utils/taskStatsUtils", () => ({
  calcCompletionSegments: (...args) => calcCompletionSegments(...args),
}));

vi.mock("../../../pages/group_work/utils/taskUtils", () => ({
  sortTasks: (...args) => sortTasks(...args),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title}:{hint}</div>,
}));

vi.mock("../../../pages/group_work/components/TaskListRow", () => ({
  default: ({ task }) => <div>{task.title}</div>,
}));

vi.mock("../../../pages/group_work/components/TaskBoardColumn", () => ({
  default: ({ column, adding }) => (
    <div>
      <span>{column.title}</span>
      <button type="button" onClick={(event) => adding.onSubmit(event, column.id)}>submit-{column.id}</button>
      <button type="button" onClick={(event) => adding.onKeyDown({ ...event, key: "Escape" }, column.id)}>escape-{column.id}</button>
    </div>
  ),
}));

vi.mock("../../../pages/group_work/utils/taskBoardUtils", () => ({
  buildBoardColumns: (tasks) => [{ id: "todo", title: `Todo:${tasks.length}` }],
}));

vi.mock("../../../pages/group_work/utils/taskTimelineUtils", () => ({
  DAY_MS: 86400000,
  getTimelineAnchor: () => new Date("2026-03-24T00:00:00.000Z"),
  buildWeeks: () => [
    { id: "w1" },
    { id: "w2" },
    { id: "w3" },
    { id: "w4" },
  ],
  placeTasksIntoWeeks: (tasks) => ({ w1: { 0: tasks } }),
}));

import { useGroupTasksTabState } from "../../../pages/group_work/hooks/useGroupTasksTabState";
import { handleTaskTitleKeyDown, useTaskTitleEdit } from "../../../pages/group_work/components/taskCardEditUtils";
import TaskListView from "../../../pages/group_work/components/TaskListView";
import TaskBoardView from "../../../pages/group_work/components/TaskBoardView";
import { useDragHandlers, useTaskTimelineState } from "../../../pages/group_work/components/useTaskTimelineState";

const defaultTasksResponse = [{ id: 2, title: "B", assignees_info: [{ id: 4 }], status: "todo" }];
const mockJsonResponse = (payload) => ({ ok: true, json: async () => payload });
const mockOkResponse = () => ({ ok: true });

const renderTasksHook = async (extraResponses = []) => {
  global.fetch.mockReset?.();
  [mockJsonResponse(defaultTasksResponse), ...extraResponses].forEach((response) => {
    global.fetch.mockResolvedValueOnce(response);
  });
  const onStatsUpdate = vi.fn();
  const hook = renderHook(() => useGroupTasksTabState(9, [{ id: 4 }], onStatsUpdate));
  await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
  return { hook, onStatsUpdate };
};

const buildDragEvent = () => {
  const target = document.createElement("div");
  return {
    target,
    event: {
      preventDefault: vi.fn(),
      currentTarget: target,
      dataTransfer: { getData: vi.fn(() => "11") },
    },
  };
};

describe("group tasks state extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("useGroupTasksTabState", () => {
    it("loads tasks and updates completion stats", async () => {
      const { hook, onStatsUpdate } = await renderTasksHook();
      expect(onStatsUpdate).toHaveBeenCalledWith({ complete: 1 });
      expect(hook.result.current.sortedTasks).toHaveLength(1);
    });

    it("performs update, delete, and add actions", async () => {
      const { hook } = await renderTasksHook([
        mockJsonResponse({ id: 2, title: "Updated", assignees_info: [{ id: 4 }], status: "todo" }),
        mockJsonResponse({ id: 3, title: "New", assignees_info: [], status: "todo" }),
        mockOkResponse(),
      ]);
      vi.useFakeTimers();
      try {
        await act(async () => {
          await hook.result.current.taskActions.updateTask(2, { completed: true });
          hook.result.current.taskActions.deleteTask(2);
          await hook.result.current.taskActions.addTask("New", { due_date: "2026-04-01", assigned_to: [4] });
        });
        expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "PATCH" }));
        expect(global.fetch).toHaveBeenCalledWith("/api/tasks/", expect.objectContaining({ method: "POST" }));
        await act(async () => {
          vi.advanceTimersByTime(3200);
          await Promise.resolve();
        });
        expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
      } finally {
        vi.useRealTimers();
      }
    });

    it("toggles filters, view, and modal state", async () => {
      const { hook } = await renderTasksHook();
      act(() => {
        hook.result.current.setFilterUsers(["4"]);
        hook.result.current.setTaskView("board");
        hook.result.current.setShowAddModal(true);
      });
      expect(hook.result.current.taskView).toBe("board");
      expect(hook.result.current.showAddModal).toBe(true);
    });

    it("filters tasks by assignee when filterUsers is set", async () => {
      const { hook } = await renderTasksHook([
        mockJsonResponse([
          { id: 1, title: "A", assignees_info: [{ id: 5 }], status: "todo" },
          { id: 2, title: "B", assignees_info: [{ id: 4 }], status: "todo" },
        ]),
      ]);
      act(() => {
        hook.result.current.setFilterUsers(["4"]);
      });
      expect(hook.result.current.sortedTasks).toHaveLength(1);
    });

    it("ignores blank task titles when adding a task", async () => {
      const { hook } = await renderTasksHook();
      await act(async () => {
        await hook.result.current.taskActions.addTask("", { due_date: "2026-03-30" });
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("undoDelete restores the task and clears the pending timer", async () => {
      const { hook } = await renderTasksHook();
      vi.useFakeTimers();
      try {
        // Delete task 2, then undo before the timer fires
        act(() => {
          hook.result.current.taskActions.deleteTask(2);
        });
        // Task should be removed
        expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2)).toBeUndefined();

        // Undo the delete
        act(() => {
          hook.result.current.taskActions.undoDelete(2);
        });
        // Task should be restored
        expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2)).toBeDefined();

        // Advancing timer should NOT fire the DELETE fetch (it was cleared)
        await act(async () => {
          vi.advanceTimersByTime(3200);
          await Promise.resolve();
        });
        // Only the initial GET fetch should have been called
        expect(global.fetch).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("executeStartDelete clears existing timer when deleting same task twice", async () => {
      const { hook } = await renderTasksHook();
      vi.useFakeTimers();
      try {
        act(() => {
          hook.result.current.taskActions.deleteTask(2);
          hook.result.current.taskActions.deleteTask(2);
        });

        expect(hook.result.current.taskActions.tasks).toEqual([]);

        await act(async () => {
          vi.advanceTimersByTime(3200);
          await Promise.resolve();
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
      } finally {
        vi.useRealTimers();
      }
    });

    it("returns [] from useFetchTasks when response.ok is false", async () => {
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({ ok: false });
      const onStatsUpdate = vi.fn();
      const hook = renderHook(() => useGroupTasksTabState(9, [{ id: 4 }], onStatsUpdate));
      await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));
      expect(hook.result.current.taskActions.tasks).toEqual([]);
    });

    it("updateTask updates tasks list when response.ok is true", async () => {
      const updatedTask = { id: 2, title: "Updated Title", assignees_info: [{ id: 4 }], status: "done" };
      const { hook } = await renderTasksHook([
        mockJsonResponse(updatedTask),
      ]);
      await act(async () => {
        await hook.result.current.taskActions.updateTask(2, { title: "Updated Title" });
      });
      expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2).title).toBe("Updated Title");
    });

    it("updateTask does nothing when response.ok is false", async () => {
      const { hook } = await renderTasksHook();
      global.fetch.mockResolvedValueOnce({ ok: false });
      await act(async () => {
        await hook.result.current.taskActions.updateTask(2, { title: "Nope" });
      });
      // Title should remain unchanged
      expect(hook.result.current.taskActions.tasks.find((t) => t.id === 2).title).toBe("B");
    });

    it("createTask succeeds when response.ok is true", async () => {
      const newTask = { id: 10, title: "Brand New", assignees_info: [], status: "todo" };
      const { hook } = await renderTasksHook([mockJsonResponse(newTask)]);
      await act(async () => {
        await hook.result.current.taskActions.addTask("Brand New", {});
      });
      expect(hook.result.current.taskActions.tasks.find((t) => t.id === 10)).toBeDefined();
    });

    it("createTask does nothing when response.ok is false", async () => {
      const { hook } = await renderTasksHook();
      global.fetch.mockResolvedValueOnce({ ok: false });
      await act(async () => {
        await hook.result.current.taskActions.addTask("Fail", {});
      });
      // Should still only have the original task
      expect(hook.result.current.taskActions.tasks).toHaveLength(1);
    });

    it("buildTaskBody includes due_date and assigned_to when provided", async () => {
      const newTask = { id: 11, title: "With Options", assignees_info: [], status: "todo" };
      const { hook } = await renderTasksHook([mockJsonResponse(newTask)]);
      await act(async () => {
        await hook.result.current.taskActions.addTask("With Options", {
          due_date: "2026-05-01",
          assigned_to: [1, 2],
          status: "in_progress",
        });
      });
      const postCall = global.fetch.mock.calls.find((c) => c[1]?.method === "POST");
      const body = JSON.parse(postCall[1].body);
      expect(body.due_date).toBe("2026-05-01");
      expect(body.assigned_to).toEqual([1, 2]);
      expect(body.status).toBe("in_progress");
    });

    it("buildTaskBody omits due_date and assigned_to when not provided", async () => {
      const newTask = { id: 12, title: "Minimal", assignees_info: [], status: "todo" };
      const { hook } = await renderTasksHook([mockJsonResponse(newTask)]);
      await act(async () => {
        await hook.result.current.taskActions.addTask("Minimal", {});
      });
      const postCall = global.fetch.mock.calls.find((c) => c[1]?.method === "POST");
      const body = JSON.parse(postCall[1].body);
      expect(body.due_date).toBeUndefined();
      expect(body.assigned_to).toBeUndefined();
      expect(body.status).toBe("todo");
    });

    it("useSearchFilteredTasks filters tasks by searchTerm", async () => {
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce(mockJsonResponse([
        { id: 1, title: "Alpha task", assignees_info: [], status: "todo" },
        { id: 2, title: "Beta work", assignees_info: [], status: "todo" },
        { id: 3, title: "ALPHA upper", assignees_info: [], status: "todo" },
      ]));
      const onStatsUpdate = vi.fn();
      const hook = renderHook(() => useGroupTasksTabState(9, [], onStatsUpdate));
      await waitFor(() => expect(hook.result.current.taskActions.loading).toBe(false));

      act(() => {
        hook.result.current.setSearchTerm("alpha");
      });
      // Should match "Alpha task" and "ALPHA upper" (case-insensitive)
      expect(hook.result.current.sortedTasks).toHaveLength(2);
      expect(hook.result.current.sortedTasks.every((t) => t.title.toLowerCase().includes("alpha"))).toBe(true);
    });

    it("onStatsUpdate callback is invoked with calcCompletionSegments result", async () => {
      const { onStatsUpdate } = await renderTasksHook();
      expect(calcCompletionSegments).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 2 })]),
        [{ id: 4 }],
      );
      expect(onStatsUpdate).toHaveBeenCalledWith({ complete: 1 });
    });
  });

  describe("task helpers and timeline state", () => {
    it("trims titles before saving from useTaskTitleEdit", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useTaskTitleEdit({ id: 8, title: " Draft " }, onUpdate));
      act(() => result.current.setEditTitle(" Polished draft "));
      act(() => result.current.saveEdit());
      expect(onUpdate).toHaveBeenCalledWith(8, { title: "Polished draft" });
    });

    it("does not call onUpdate for blank or unchanged inline titles", () => {
      const onUpdate = vi.fn();
      const { result, rerender } = renderHook(
        ({ task }) => useTaskTitleEdit(task, onUpdate),
        { initialProps: { task: { id: 8, title: "Same title" } } },
      );

      act(() => result.current.setEditing(true));
      act(() => result.current.setEditTitle("   "));
      act(() => result.current.saveEdit());
      expect(onUpdate).not.toHaveBeenCalled();
      expect(result.current.editing).toBe(false);

      rerender({ task: { id: 8, title: "Same title" } });
      act(() => result.current.setEditing(true));
      act(() => result.current.setEditTitle("Same title"));
      act(() => result.current.saveEdit());
      expect(onUpdate).not.toHaveBeenCalled();
      expect(result.current.editing).toBe(false);
    });

    it("handles Enter and Escape shortcuts for inline titles", () => {
      const saveEdit = vi.fn();
      const setEditing = vi.fn();
      const preventDefault = vi.fn();
      handleTaskTitleKeyDown({ key: "Enter", shiftKey: false, preventDefault }, saveEdit, setEditing);
      handleTaskTitleKeyDown({ key: "Escape", preventDefault }, saveEdit, setEditing);
      expect(saveEdit).toHaveBeenCalled();
      expect(setEditing).toHaveBeenCalledWith(false);
    });

    it("renders the empty list state", () => {
      render(<TaskListView tasks={[]} members={[]} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
    });

    it("ignores board submissions without a title", () => {
      const onAdd = vi.fn();
      render(<TaskBoardView tasks={[{ id: 1 }]} members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} onAdd={onAdd} />);
      fireEvent.click(screen.getByText("submit-todo"));
      fireEvent.click(screen.getByText("escape-todo"));
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("updates tasks through drag handlers", () => {
      const onUpdate = vi.fn();
      const styles = { timelineCellDropTarget: "drop", widgetListDropTarget: "widget" };
      const { result } = renderHook(() => useDragHandlers(onUpdate, styles));
      const { target, event } = buildDragEvent();
      act(() => result.current.onDragOver(event));
      expect(target.classList.contains("drop")).toBe(true);
      act(() => result.current.onDrop(event, new Date("2026-03-29T00:00:00.000Z").getTime()));
      expect(onUpdate).toHaveBeenCalledWith(11, expect.objectContaining({ due_date: expect.stringContaining("2026-03-29") }));
      act(() => result.current.onDropWidget({ ...event, currentTarget: target }));
      expect(onUpdate).toHaveBeenCalledWith(11, { due_date: null });
    });

    it("removes drag classes and ignores drops without task ids", () => {
      const onUpdate = vi.fn();
      const styles = { timelineCellDropTarget: "drop", widgetListDropTarget: "widget" };
      const { result } = renderHook(() => useDragHandlers(onUpdate, styles));
      const { target, event } = buildDragEvent();

      target.classList.add("drop");
      target.classList.add("widget");
      const emptyTransfer = { getData: vi.fn(() => "") };

      act(() => result.current.onDragLeave({ currentTarget: target }));
      expect(target.classList.contains("drop")).toBe(false);

      act(() => result.current.onDrop({ ...event, currentTarget: target, dataTransfer: emptyTransfer }, Date.now()));
      act(() => result.current.onDropWidget({ ...event, currentTarget: target, dataTransfer: emptyTransfer }));
      expect(target.classList.contains("widget")).toBe(false);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("builds task timeline state with unscheduled tasks", () => {
      const { result } = renderHook(() => useTaskTimelineState([
        { id: 1, title: "A", due_date: null, completed: false, status: "todo" },
        { id: 2, title: "B", due_date: "2026-03-30", completed: false, status: "todo" },
        { id: 3, title: "C", due_date: null, completed: true, status: "done" },
      ], 0));
      expect(result.current.unscheduled).toHaveLength(1);
      expect(result.current.visible).toHaveLength(3);
      expect(result.current.dayMs).toBe(86400000);
    });

    it("paginates timeline weeks after the first page", () => {
      const { result } = renderHook(() => useTaskTimelineState([], 1));
      expect(result.current.weeks).toHaveLength(4);
      expect(result.current.visible).toEqual([{ id: "w4" }]);
    });
  });
});
