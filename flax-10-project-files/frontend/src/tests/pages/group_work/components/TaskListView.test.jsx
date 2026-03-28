import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TaskListView from "@/pages/group_work/components/TaskListView";

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title }) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@/pages/group_work/components/TaskListRow", () => ({
  default: ({ task }) => <div data-testid={`task-row-${task.id}`}>{task.title}</div>,
}));

describe("TaskListView", () => {
  const onToggle = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  it("renders empty state when no tasks", () => {
    render(<TaskListView tasks={[]} members={[]} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No tasks yet");
  });

  it("renders header and rows when tasks exist", () => {
    const tasks = [{ id: 1, title: "T1" }, { id: 2, title: "T2" }];
    render(<TaskListView tasks={tasks} members={[]} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />);
    
    expect(screen.getByText("Task")).toBeTruthy();
    expect(screen.getByText("Priority")).toBeTruthy();
    expect(screen.getByTestId("task-row-1")).toBeTruthy();
    expect(screen.getByTestId("task-row-2")).toBeTruthy();
  });
});
