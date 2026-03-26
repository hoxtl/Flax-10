/* Tests for TaskSection component rendering, collapsing, and empty state */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskSection from "../../../../pages/tasks/components/TaskSection";

vi.mock("../../../../pages/tasks/components/TaskCard", () => ({
  default: ({ task, onEdit }) => (
    <div data-testid="task-card">
      <span>{task.title}</span>
      {onEdit && (
        <button type="button" onClick={() => onEdit({ title: "Updated" }, { source: "test" })}>
          Edit row
        </button>
      )}
    </div>
  ),
}));
vi.mock("../../../../pages/tasks/components/AllTasksCompleteCard", () => ({
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

  it("calls row edit handlers for non-reading lists and renders muted completed counts when collapsed", () => {
    render(
      <TaskSection
        title="Today"
        emoji="📅"
        tasks={[{ id: 1, title: "Edit me", task_list: 1 }]}
        completedCount={2}
        sortBy="priority"
        listMap={{ 1: { id: 1, name: "Inbox", idx: 0 } }}
        lists={[{ id: 1, name: "Inbox" }]}
        sectionType="today"
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit row" }));
    expect(handlers.onEditTask).toHaveBeenCalledWith(1, { title: "Updated" }, { source: "test" });

    fireEvent.click(screen.getByRole("button", { name: /Today/i }));
    expect(screen.getByText(/2 done/i)).toBeInTheDocument();
  });
});
