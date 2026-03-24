import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const getAuthHeaders = vi.fn(() => ({ Authorization: "Token abc" }));
const calcCompletionSegments = vi.fn(() => ({ complete: 1 }));
const sortTasks = vi.fn((tasks) => [...tasks].sort((a, b) => a.id - b.id));

vi.mock("../../../pages/GroupWork/hooks/groupWorkHooks", () => ({
  getAuthHeaders: (...args) => getAuthHeaders(...args),
}));

vi.mock("../../../pages/GroupWork/utils/taskStatsUtils", () => ({
  calcCompletionSegments: (...args) => calcCompletionSegments(...args),
}));

vi.mock("../../../pages/GroupWork/utils/taskUtils", () => ({
  sortTasks: (...args) => sortTasks(...args),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title}:{hint}</div>,
}));

vi.mock("../../../pages/GroupWork/components/TaskListRow", () => ({
  default: ({ task }) => <div>{task.title}</div>,
}));

vi.mock("../../../pages/GroupWork/components/TaskBoardColumn", () => ({
  default: ({ column, adding }) => (
    <div>
      <span>{column.title}</span>
      <button type="button" onClick={(event) => adding.onSubmit(event, column.id)}>submit-{column.id}</button>
      <button type="button" onClick={(event) => adding.onKeyDown({ ...event, key: "Escape" }, column.id)}>escape-{column.id}</button>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/utils/taskBoardUtils", () => ({
  buildBoardColumns: (tasks) => [{ id: "todo", title: `Todo:${tasks.length}` }],
}));

vi.mock("../../../pages/GroupWork/utils/taskTimelineUtils", () => ({
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

import { useGroupTasksTabState } from "../../../pages/GroupWork/useGroupTasksTabState";
import { handleTaskTitleKeyDown, useTaskTitleEdit } from "../../../pages/GroupWork/components/taskCardEditUtils";
import TaskListView from "../../../pages/GroupWork/components/TaskListView";
import TaskBoardView from "../../../pages/GroupWork/components/TaskBoardView";
import { useDragHandlers, useTaskTimelineState } from "../../../pages/GroupWork/components/useTaskTimelineState";

describe("group tasks state extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("loads, filters, updates, adds, and deletes group tasks", async () => {
    const members = [{ id: 4 }];
    const onStatsUpdate = vi.fn();
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 2, title: "B", assignees_info: [{ id: 4 }], status: "todo" }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, title: "Updated", assignees_info: [{ id: 4 }], status: "todo" }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3, title: "New", assignees_info: [], status: "todo" }) });

    const { result } = renderHook(() => useGroupTasksTabState(9, members, onStatsUpdate));
    await waitFor(() => expect(result.current.taskActions.loading).toBe(false));
    expect(onStatsUpdate).toHaveBeenCalledWith({ complete: 1 });
    expect(result.current.sortedTasks).toHaveLength(1);

    await act(async () => {
      await result.current.taskActions.updateTask(2, { completed: true });
      await result.current.taskActions.deleteTask(2);
      await result.current.taskActions.addTask("New", { due_date: "2026-04-01", assigned_to: [4] });
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "PATCH" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/tasks/2/", expect.objectContaining({ method: "DELETE" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/tasks/", expect.objectContaining({ method: "POST" }));

    act(() => {
      result.current.setFilterUsers(["4"]);
      result.current.setTaskView("board");
      result.current.setShowAddModal(true);
    });
    expect(result.current.taskView).toBe("board");
    expect(result.current.showAddModal).toBe(true);
  });

  it("covers task title edit helpers, list empty state, board actions, and timeline drag state", async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useTaskTitleEdit({ id: 8, title: " Draft " }, onUpdate));
    act(() => result.current.setEditTitle(" Polished draft "));
    act(() => result.current.saveEdit());
    expect(onUpdate).toHaveBeenCalledWith(8, { title: "Polished draft" });

    const saveEdit = vi.fn();
    const setEditing = vi.fn();
    const preventDefault = vi.fn();
    handleTaskTitleKeyDown({ key: "Enter", shiftKey: false, preventDefault }, saveEdit, setEditing);
    handleTaskTitleKeyDown({ key: "Escape", preventDefault }, saveEdit, setEditing);
    expect(saveEdit).toHaveBeenCalled();
    expect(setEditing).toHaveBeenCalledWith(false);

    render(<TaskListView tasks={[]} members={[]} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();

    const onAdd = vi.fn();
    render(<TaskBoardView tasks={[{ id: 1 }]} members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("submit-todo"));
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("escape-todo"));

    const styles = { timelineCellDropTarget: "drop", widgetListDropTarget: "widget" };
    const drag = renderHook(() => useDragHandlers(onUpdate, styles));
    const target = document.createElement("div");
    const event = {
      preventDefault: vi.fn(),
      currentTarget: target,
      dataTransfer: { getData: vi.fn(() => "11") },
    };
    act(() => drag.result.current.onDragOver(event));
    expect(target.classList.contains("drop")).toBe(true);
    act(() => drag.result.current.onDrop(event, new Date("2026-03-29T00:00:00.000Z").getTime()));
    expect(onUpdate).toHaveBeenCalledWith(11, expect.objectContaining({ due_date: expect.stringContaining("2026-03-29") }));
    act(() => drag.result.current.onDropWidget({ ...event, currentTarget: target }));
    expect(onUpdate).toHaveBeenCalledWith(11, { due_date: null });

    const timeline = renderHook(() => useTaskTimelineState([
      { id: 1, title: "A", due_date: null, completed: false, status: "todo" },
      { id: 2, title: "B", due_date: "2026-03-30", completed: false, status: "todo" },
      { id: 3, title: "C", due_date: null, completed: true, status: "done" },
    ], 0));
    expect(timeline.result.current.unscheduled).toHaveLength(1);
    expect(timeline.result.current.visible).toHaveLength(3);
    expect(timeline.result.current.dayMs).toBe(86400000);
  });
});
