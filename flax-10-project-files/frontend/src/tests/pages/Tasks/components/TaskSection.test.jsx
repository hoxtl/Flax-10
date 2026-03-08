import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskSection from "../../../../pages/Tasks/components/TaskSection";

vi.mock("../../../../pages/Tasks/components/TaskCard", () => ({
  default: ({ task }) => <div data-testid="task-card">{task.title}</div>,
}));
vi.mock("../../../../pages/Tasks/components/AllTasksCompleteCard", () => ({
  default: ({ message }) => <div data-testid="all-complete">{message}</div>,
}));

const handlers = { onToggleComplete: vi.fn(), onDeleteTask: vi.fn(), onEditTask: vi.fn() };

function makeTasks(size) {
  return Array.from({ length: size }, (_, i) => ({ id: i + 1, title: `T${i + 1}`, task_list: 1 }));
}

describe("TaskSection", () => {
  it("returns null when empty and no completed count", () => {
    const { container } = render(<TaskSection title="Today" emoji="📅" tasks={[]} completedCount={0} sortBy="priority" listMap={{}} lists={[]} sectionType="today" {...handlers} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders empty message state", () => {
    render(<TaskSection title="Later" emoji="⏳" tasks={[]} completedCount={1} sortBy="priority" listMap={{}} lists={[]} sectionType="later" emptyMessage="No tasks" {...handlers} />);
    expect(screen.getByText("No tasks")).toBeInTheDocument();
  });

  it("shows limited tasks and toggles show all", () => {
    render(<TaskSection title="All" emoji="📋" tasks={makeTasks(10)} completedCount={0} sortBy="priority" listMap={{}} lists={[]} sectionType="all" applyLimit {...handlers} />);
    expect(screen.getAllByTestId("task-card").length).toBe(8);
    fireEvent.click(screen.getByRole("button", { name: /Show all/i }));
    expect(screen.getAllByTestId("task-card").length).toBe(10);
  });

  it("collapses and expands body", () => {
    render(<TaskSection title="Today" emoji="📅" tasks={makeTasks(1)} completedCount={0} sortBy="priority" listMap={{}} lists={[]} sectionType="today" {...handlers} />);
    const toggle = screen.getByRole("button", { name: /Today/i });
    expect(screen.getByTestId("task-card")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
