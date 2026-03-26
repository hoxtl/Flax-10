/* Tests for CompletedTasksSection component rendering and visibility toggling */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CompletedTasksSection from "../../../../pages/Tasks/components/CompletedTasksSection";

vi.mock("../../../../pages/Tasks/components/TaskCard", () => ({
  default: ({ task }) => <div data-testid="task-card">{task.title}</div>,
}));

describe("CompletedTasksSection", () => {
  it("returns null when no tasks", () => {
    const { container } = render(<CompletedTasksSection tasks={[]} sortBy="priority" listMap={{}} lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders completed tasks and toggles section", () => {
    const tasks = [{ id: 1, title: "Done", task_list: 1, completed: true }];
    render(<CompletedTasksSection tasks={tasks} sortBy="priority" listMap={{ "1": { idx: 0, name: "Inbox" } }} lists={[{ id: 1, color: "#fff" }]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    expect(screen.getByTestId("task-card")).toHaveTextContent("Done");
    const toggle = screen.getByRole("button", { name: /Completed/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
