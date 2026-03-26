import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const buildBoardColumns = vi.fn((tasks) => [
  { id: "todo", title: "To do", tasks: tasks.filter((task) => task.status === "todo"), className: "todo-col", dotClass: "dot", textClass: "text" },
  { id: "done", title: "Done", tasks: tasks.filter((task) => task.status === "done"), className: "done-col", dotClass: "dot", textClass: "text" },
]);

vi.mock("../../../pages/group_work/utils/taskBoardUtils", () => ({
  buildBoardColumns: (...args) => buildBoardColumns(...args),
}));

vi.mock("../../../pages/group_work/components/TaskBoardCard", () => ({
  default: ({ task }) => <div>{task.title}</div>,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("lucide-react", () => ({
  X: () => <span>x-icon</span>,
  Pencil: () => <span>pencil-icon</span>,
}));

import TaskBoardColumn from "../../../pages/group_work/components/TaskBoardColumn";
import TaskBoardView from "../../../pages/group_work/components/TaskBoardView";

describe("GroupWork task component - Board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAdding = (overrides = {}) => ({
    addingToCol: null, setAddingToCol: vi.fn(), newCardTitle: "",
    setNewCardTitle: vi.fn(), onSubmit: vi.fn(), onKeyDown: vi.fn(),
    ...overrides,
  });
  it("renders TaskBoardColumn and handles add card toggle", () => {
    const adding = setupAdding();
    render(<TaskBoardColumn
      column={{ id: "todo", title: "To do", tasks: [], className: "c", dotClass: "d", textClass: "t" }}
      members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} adding={adding}
    />);
    expect(screen.getByText("No tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Add card"));
    expect(adding.setAddingToCol).toHaveBeenCalledWith("todo");
  });
  it("drops a task into a column", () => {
    const onUpdate = vi.fn();
    const { container } = render(<TaskBoardColumn
      column={{ id: "done", title: "Done", tasks: [], className: "c", dotClass: "d", textClass: "t" }}
      members={[]} onUpdate={onUpdate} onDelete={vi.fn()} adding={setupAdding()}
    />);
    fireEvent.drop(container.firstChild, { dataTransfer: { getData: vi.fn(() => "9") } });
    expect(onUpdate).toHaveBeenCalledWith(9, { status: "done" });
  });
  it("ignores drops without a task id", () => {
    const onUpdate = vi.fn();
    const { container } = render(<TaskBoardColumn
      column={{ id: "done", title: "Done", tasks: [], className: "c", dotClass: "d", textClass: "t" }}
      members={[]} onUpdate={onUpdate} onDelete={vi.fn()} adding={setupAdding()}
    />);
    fireEvent.drop(container.firstChild, { dataTransfer: { getData: vi.fn(() => "") } });
    expect(onUpdate).not.toHaveBeenCalled();
  });
  it("renders the add card editor and accepts drops", () => {
    const adding = setupAdding({ addingToCol: "todo", newCardTitle: "Draft" });
    const col = { id: "todo", title: "To do", tasks: [{ id: 1, title: "Card A" }], className: "c", dotClass: "d", textClass: "t" };
    render(<TaskBoardColumn column={col} members={[]} onUpdate={vi.fn()} onDelete={vi.fn()} adding={adding} />);
    expect(screen.getByDisplayValue("Draft")).toBeInTheDocument();
    fireEvent.blur(screen.getByDisplayValue("Draft"));
    expect(adding.onSubmit).toHaveBeenCalled();
    fireEvent.dragOver(screen.getByText("Card A").closest("div").parentElement);
  });

  it("renders TaskBoardView correctly", () => {
    const tasks = [{ id: 1, title: "Card A", status: "todo" }, { id: 2, title: "Card B", status: "done" }];
    const onAdd = vi.fn();
    render(
      <TaskBoardView
        tasks={tasks}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("adds a card from TaskBoardView with Enter and cancels with Escape", () => {
    const onAdd = vi.fn();
    render(
      <TaskBoardView
        tasks={[{ id: 1, title: "Card A", status: "todo" }]}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getAllByText("+ Add card")[0]);
    const input = screen.getByPlaceholderText("Enter title...");
    fireEvent.change(input, { target: { value: "Board task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).toHaveBeenCalledWith("Board task", "todo");
  });

  it("clears the add-card editor when Escape is pressed", () => {
    const onAdd = vi.fn();
    render(
      <TaskBoardView
        tasks={[{ id: 1, title: "Card A", status: "todo" }]}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getAllByText("+ Add card")[0]);
    const input = screen.getByPlaceholderText("Enter title...");
    fireEvent.change(input, { target: { value: "Board task" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue("Board task")).toBeNull();
  });

  it("ignores unrelated add-card key presses", () => {
    const onAdd = vi.fn();
    render(
      <TaskBoardView
        tasks={[{ id: 1, title: "Card A", status: "todo" }]}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getAllByText("+ Add card")[0]);
    const input = screen.getByPlaceholderText("Enter title...");
    fireEvent.change(input, { target: { value: "Board task" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(onAdd).not.toHaveBeenCalled();
  });
});
