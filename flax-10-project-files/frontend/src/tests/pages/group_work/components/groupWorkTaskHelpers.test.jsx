/*
 * Tests for task title editing, board view interactions,
 * drag handlers, and timeline state helpers.
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title}:{hint}</div>,
}));

vi.mock("@/pages/group_work/components/TaskListRow", () => ({
  default: ({ task }) => <div>{task.title}</div>,
}));

vi.mock("@/pages/group_work/components/TaskBoardColumn", () => ({
  default: ({ column, adding }) => (
    <div>
      <span>{column.title}</span>
      <button type="button" onClick={(event) => adding.onSubmit(event, column.id)}>submit-{column.id}</button>
      <button type="button" onClick={(event) => adding.onKeyDown({ ...event, key: "Escape" }, column.id)}>escape-{column.id}</button>
    </div>
  ),
}));

vi.mock("../../../../pages/group_work/utils/taskBoardUtils", () => ({
  buildBoardColumns: (tasks) => [{ id: "todo", title: `Todo:${tasks.length}` }],
}));

vi.mock("../../../../pages/group_work/utils/taskTimelineUtils", () => ({
  DAY_MS: 86400000,
  getTimelineAnchor: () => new Date("2026-03-24T00:00:00.000Z"),
  buildWeeks: () => [{ id: "w1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }],
  placeTasksIntoWeeks: (tasks) => ({ w1: { 0: tasks } }),
}));

import { handleTaskTitleKeyDown, useTaskTitleEdit } from "@/pages/group_work/components/taskCardEditUtils";
import TaskListView from "@/pages/group_work/components/TaskListView";
import TaskBoardView from "@/pages/group_work/components/TaskBoardView";
import { useDragHandlers, useTaskTimelineState } from "@/pages/group_work/components/useTaskTimelineState";

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
