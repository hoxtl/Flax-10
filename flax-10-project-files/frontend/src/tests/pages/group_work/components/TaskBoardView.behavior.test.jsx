import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/pages/group_work/components/TaskBoardColumn", () => ({
  default: ({ column, adding }) => (
    <div data-testid={`col-${column.id}`}>
      <button type="button" onClick={() => adding.setAddingToCol(column.id)}>
        + Add card
      </button>
      {adding.addingToCol === column.id && (
        <textarea
          data-testid="add-input"
          value={adding.newCardTitle}
          onChange={(e) => adding.setNewCardTitle(e.target.value)}
          onBlur={(e) => adding.onSubmit(e, column.id)}
          onKeyDown={(e) => adding.onKeyDown(e, column.id)}
        />
      )}
    </div>
  ),
}));

const buildBoardColumnsMock = vi.fn(() => [{ id: "todo", tasks: [] }]);

vi.mock("@/pages/group_work/utils/taskBoardUtils", () => ({
  buildBoardColumns: (...args) => buildBoardColumnsMock(...args),
}));

import TaskBoardView from "@/pages/group_work/components/TaskBoardView";

const renderView = (onAdd = vi.fn()) =>
  render(
    <TaskBoardView
      tasks={[]}
      members={[]}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      onAdd={onAdd}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  buildBoardColumnsMock.mockReturnValue([{ id: "todo", tasks: [] }]);
});

it("renders columns from buildBoardColumns", () => {
  renderView();
  expect(screen.getByTestId("col-todo")).toBeTruthy();
});

it("clicking add card opens textarea", () => {
  renderView();
  fireEvent.click(screen.getByText("+ Add card"));
  expect(screen.getByTestId("add-input")).toBeTruthy();
});

it("blur submits non-empty title and calls onAdd", () => {
  const onAdd = vi.fn();
  renderView(onAdd);
  fireEvent.click(screen.getByText("+ Add card"));
  fireEvent.change(screen.getByTestId("add-input"), { target: { value: "New task" } });
  fireEvent.blur(screen.getByTestId("add-input"));
  expect(onAdd).toHaveBeenCalledWith("New task", "todo");
});

it("blur with empty title does not call onAdd", () => {
  const onAdd = vi.fn();
  renderView(onAdd);
  fireEvent.click(screen.getByText("+ Add card"));
  fireEvent.blur(screen.getByTestId("add-input"));
  expect(onAdd).not.toHaveBeenCalled();
});

it("Enter key submits and calls onAdd", () => {
  const onAdd = vi.fn();
  renderView(onAdd);
  fireEvent.click(screen.getByText("+ Add card"));
  fireEvent.change(screen.getByTestId("add-input"), { target: { value: "Task B" } });
  fireEvent.keyDown(screen.getByTestId("add-input"), { key: "Enter" });
  expect(onAdd).toHaveBeenCalledWith("Task B", "todo");
});

it("Escape key closes input without submitting", () => {
  const onAdd = vi.fn();
  renderView(onAdd);
  fireEvent.click(screen.getByText("+ Add card"));
  fireEvent.change(screen.getByTestId("add-input"), { target: { value: "Draft" } });
  fireEvent.keyDown(screen.getByTestId("add-input"), { key: "Escape" });
  expect(onAdd).not.toHaveBeenCalled();
  expect(screen.queryByTestId("add-input")).toBeNull();
});

it("Shift+Enter does not submit", () => {
  const onAdd = vi.fn();
  renderView(onAdd);
  fireEvent.click(screen.getByText("+ Add card"));
  fireEvent.change(screen.getByTestId("add-input"), { target: { value: "Task" } });
  fireEvent.keyDown(screen.getByTestId("add-input"), { key: "Enter", shiftKey: true });
  expect(onAdd).not.toHaveBeenCalled();
});
