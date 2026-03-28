import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskBoardColumn from "@/pages/group_work/components/TaskBoardColumn";

vi.mock("@/pages/group_work/components/TaskBoardCard", () => ({
  default: ({ task }) => <div data-testid={`card-${task.id}`}>{task.title}</div>,
}));

vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  handleDragStartTask: vi.fn(),
}));

describe("TaskBoardColumn", () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const adding = {
    addingToCol: null,
    setAddingToCol: vi.fn(),
    newCardTitle: "",
    setNewCardTitle: vi.fn(),
    onSubmit: vi.fn(),
    onKeyDown: vi.fn(),
  };

  const column = {
    id: "todo",
    title: "To Do",
    dotClass: "dot-todo",
    textClass: "text-todo",
    tasks: [{ id: 1, title: "Task 1" }],
    className: "col-todo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tasks and header correctly", () => {
    render(<TaskBoardColumn column={column} members={[]} onUpdate={onUpdate} onDelete={onDelete} adding={adding} />);
    expect(screen.getByText("To Do")).toBeTruthy();
    expect(screen.getByTestId("card-1")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy(); // task count
  });

  it("handles drag over and drop", () => {
    const { container } = render(<TaskBoardColumn column={column} members={[]} onUpdate={onUpdate} adding={adding} />);
    const colDiv = container.firstChild;
    
    // Drag over
    const dragOverEvt = fireEvent.dragOver(colDiv);
    expect(dragOverEvt).toBe(false); // defaultPrevented usually returns false if prevented

    // Drop
    const dropEvt = {
      preventDefault: vi.fn(),
      dataTransfer: { getData: vi.fn(() => "5") }
    };
    fireEvent.drop(colDiv, dropEvt);
    expect(onUpdate).toHaveBeenCalledWith(5, { status: "todo" });
  });

  it("shows empty state when no tasks", () => {
    const emptyCol = { ...column, tasks: [] };
    render(<TaskBoardColumn column={emptyCol} members={[]} onUpdate={onUpdate} adding={adding} />);
    expect(screen.getByText("No tasks")).toBeTruthy();
  });

  it("toggles and handles Add Card widget", () => {
    const { rerender } = render(<TaskBoardColumn column={column} members={[]} onUpdate={onUpdate} adding={adding} />);
    
    const addBtn = screen.getByText("+ Add card");
    fireEvent.click(addBtn);
    expect(adding.setAddingToCol).toHaveBeenCalledWith("todo");

    // Rerender as if adding is active
    rerender(<TaskBoardColumn column={column} members={[]} onUpdate={onUpdate} adding={{ ...adding, addingToCol: "todo", newCardTitle: "New Task" }} />);
    
    const textarea = screen.getByPlaceholderText("Enter title...");
    expect(textarea.value).toBe("New Task");
    
    fireEvent.change(textarea, { target: { value: "Changed" } });
    expect(adding.setNewCardTitle).toHaveBeenCalledWith("Changed");

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(adding.onKeyDown).toHaveBeenCalled();

    fireEvent.blur(textarea);
    expect(adding.onSubmit).toHaveBeenCalled();
  });
});
