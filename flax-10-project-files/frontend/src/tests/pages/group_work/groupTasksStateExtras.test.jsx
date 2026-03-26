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

import { useGroupTasksTabState } from "../../../pages/group_work/useGroupTasksTabState";
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
        mockOkResponse(),
        mockJsonResponse({ id: 3, title: "New", assignees_info: [], status: "todo" }),
      ]);
      await act(async () => {
        await hook.result.current.taskActions.updateTask(2, { completed: true });
        await hook.result.current.taskActions.deleteTask(2);
        await hook.result.current.taskActions.addTask("New", { due_date: "2026-04-01", assigned_to: [4] });
      });
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "PATCH" }));
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/", expect.objectContaining({ method: "POST" }));
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
  });

  describe("task helpers and timeline state", () => {
    it("trims titles before saving from useTaskTitleEdit", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() => useTaskTitleEdit({ id: 8, title: " Draft " }, onUpdate));
      act(() => result.current.setEditTitle(" Polished draft "));
      act(() => result.current.saveEdit());
      expect(onUpdate).toHaveBeenCalledWith(8, { title: "Polished draft" });
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
  });
});
