import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CompletedTasksSection from "../../../../pages/Tasks/components/CompletedTasksSection";
import SuggestedReadingsSection from "../../../../pages/Tasks/components/SuggestedReadingsSection";

vi.mock("../../../../pages/Tasks/components/TaskCard", () => ({
  default: ({ task, onToggle, onDelete, onEdit, listName }) => (
    <div data-testid={`task-card-${task.id}`}>
      <span>{task.title}</span>
      <span>{listName}</span>
      <button type="button" onClick={onToggle}>
        toggle
      </button>
      <button type="button" onClick={onDelete}>
        delete
      </button>
      {onEdit && (
        <button type="button" onClick={() => onEdit({ title: "Renamed" }, { source: "test" })}>
          edit
        </button>
      )}
    </div>
  ),
}));

vi.mock("../../../../api/readingApi", () => ({
  getSuggestedReadings: vi.fn(),
  getReadingSpeed: vi.fn(),
  convertReadingToTask: vi.fn(),
}));

import { convertReadingToTask, getReadingSpeed, getSuggestedReadings } from "../../../../api/readingApi";

describe("Tasks section coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReadingSpeed.mockResolvedValue({ is_personalised: true, avg_min_per_page: 1.4 });
  });

  it("forwards completed-task actions and disables editing for reading lists", () => {
    const onToggle = vi.fn(); const onDelete = vi.fn(); const onEdit = vi.fn();
    const { unmount } = render(<CompletedTasksSection tasks={[{ id: 1, title: "Essay", task_list: 1, completed: true }]} sortBy="priority" listMap={{ "1": { idx: 0, name: "Inbox" } }} lists={[{ id: 1, name: "Inbox", color: "#fff" }]} onToggleComplete={onToggle} onDeleteTask={onDelete} onEditTask={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));

    expect(onToggle).toHaveBeenCalledWith(1, true);
    expect(onDelete).toHaveBeenCalledWith(1);
    expect(onEdit).toHaveBeenCalledWith(1, { title: "Renamed" }, { source: "test" });

    unmount();
    render(<CompletedTasksSection tasks={[{ id: 2, title: "Reading", task_list: 2, completed: true }]} sortBy="priority" listMap={{ "2": { idx: 1, name: "CS101 - Systems" } }} lists={[{ id: 2, name: "CS101 - Systems", color: "#eee" }]} onToggleComplete={onToggle} onDeleteTask={onDelete} onEditTask={onEdit} />);
    expect(screen.queryByRole("button", { name: "edit" })).not.toBeInTheDocument();
  });

  it("toggles suggested readings and removes added readings even without an onTaskAdded callback", async () => {
    getSuggestedReadings.mockResolvedValue([{ id: 1, title: "Matching reading", module_code: "PH4505", module_name: "Ast", page_count: 12 }]);
    convertReadingToTask.mockResolvedValue({});
    render(<SuggestedReadingsSection activeList={{ id: 7, name: "PH4505 - Astrophysics" }} taskCount={1} pendingTasks={[]} completedTasks={[]} />);

    expect(await screen.findByText("Matching reading")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Suggested reading list/i }));
    await waitFor(() => expect(screen.queryByText("Matching reading")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Suggested reading list/i }));
    expect(await screen.findByText("Matching reading")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ Add as task/i }));
    await waitFor(() => expect(convertReadingToTask).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("Matching reading")).not.toBeInTheDocument());
  });
});
