import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/pages/group_work/components/TaskBoardCard", () => ({
  default: ({ task }) => <div data-testid="task-card">{task.title}</div>,
}));

const handleDragStartTaskMock = vi.fn();

vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  handleDragStartTask: (...args) => handleDragStartTaskMock(...args),
}));

import TaskBoardColumn from "@/pages/group_work/components/TaskBoardColumn";

const baseColumn = {
  id: "todo",
  title: "To Do",
  tasks: [],
  className: "col-todo",
  dotClass: "dot-todo",
  textClass: "text-todo",
};

const noAdding = {
  addingToCol: null,
  setAddingToCol: vi.fn(),
  newCardTitle: "",
  setNewCardTitle: vi.fn(),
  onSubmit: vi.fn(),
  onKeyDown: vi.fn(),
};

const renderColumn = (columnOverrides = {}, addingOverrides = {}) =>
  render(
    <TaskBoardColumn
      column={{ ...baseColumn, ...columnOverrides }}
      members={[]}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      adding={{ ...noAdding, ...addingOverrides }}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

it("renders column title and task count", () => {
  renderColumn({ tasks: [{ id: 1, title: "Task A" }] });
  expect(screen.getByText("To Do")).toBeTruthy();
  expect(screen.getByText("1")).toBeTruthy();
});

it("renders task cards for each task", () => {
  renderColumn({ tasks: [{ id: 1, title: "A" }, { id: 2, title: "B" }] });
  expect(screen.getAllByTestId("task-card")).toHaveLength(2);
});

it("shows empty state when no tasks and not adding", () => {
  renderColumn({ tasks: [] }, { addingToCol: null });
  expect(screen.getByText("No tasks")).toBeTruthy();
});

it("hides empty state when tasks exist", () => {
  renderColumn({ tasks: [{ id: 1, title: "X" }] });
  expect(screen.queryByText("No tasks")).toBeNull();
});

it("hides empty state while adding to this column", () => {
  renderColumn({ tasks: [] }, { addingToCol: "todo" });
  expect(screen.queryByText("No tasks")).toBeNull();
});

it("renders add card button when not adding to this column", () => {
  renderColumn({}, { addingToCol: null });
  expect(screen.getByRole("button", { name: "+ Add card" })).toBeTruthy();
});

it("clicking add card button calls setAddingToCol", () => {
  const setAddingToCol = vi.fn();
  renderColumn({}, { addingToCol: null, setAddingToCol });
  fireEvent.click(screen.getByRole("button", { name: "+ Add card" }));
  expect(setAddingToCol).toHaveBeenCalledWith("todo");
});

it("renders textarea when addingToCol matches column id", () => {
  renderColumn({}, { addingToCol: "todo", newCardTitle: "Draft" });
  expect(screen.getByDisplayValue("Draft")).toBeTruthy();
});

it("textarea onChange calls setNewCardTitle", () => {
  const setNewCardTitle = vi.fn();
  renderColumn({}, { addingToCol: "todo", newCardTitle: "", setNewCardTitle });
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "New" } });
  expect(setNewCardTitle).toHaveBeenCalledWith("New");
});

it("textarea onBlur calls onSubmit with column id", () => {
  const onSubmit = vi.fn();
  renderColumn({}, { addingToCol: "todo", newCardTitle: "x", onSubmit });
  fireEvent.blur(screen.getByRole("textbox"));
  expect(onSubmit).toHaveBeenCalledWith(expect.anything(), "todo");
});

it("textarea onKeyDown calls onKeyDown prop", () => {
  const onKeyDown = vi.fn();
  renderColumn({}, { addingToCol: "todo", newCardTitle: "x", onKeyDown });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(onKeyDown).toHaveBeenCalledWith(expect.anything(), "todo");
});

it("dragOver on column calls preventDefault", () => {
  const { container } = renderColumn();
  const col = container.firstChild;
  const event = new Event("dragover", { bubbles: true, cancelable: true });
  col.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

it("drop on column calls onUpdate with taskId and columnId", () => {
  const onUpdate = vi.fn();
  render(
    <TaskBoardColumn
      column={baseColumn}
      members={[]}
      onUpdate={onUpdate}
      onDelete={vi.fn()}
      adding={noAdding}
    />,
  );
  const col = document.querySelector("[class*=column]");
  fireEvent.drop(col, { dataTransfer: { getData: () => "42" } });
  expect(onUpdate).toHaveBeenCalledWith(42, { status: "todo" });
});

it("drop on column does not call onUpdate when taskId is missing", () => {
  const onUpdate = vi.fn();
  render(
    <TaskBoardColumn
      column={baseColumn}
      members={[]}
      onUpdate={onUpdate}
      onDelete={vi.fn()}
      adding={noAdding}
    />,
  );
  const col = document.querySelector("[class*=column]");
  fireEvent.drop(col, { dataTransfer: { getData: () => "" } });
  expect(onUpdate).not.toHaveBeenCalled();
});
