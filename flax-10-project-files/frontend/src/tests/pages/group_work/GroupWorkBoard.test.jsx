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

  it("renders TaskBoardColumn and handles add card toggle", () => {
    const adding = {
      addingToCol: null,
      setAddingToCol: vi.fn(),
      newCardTitle: "",
      setNewCardTitle: vi.fn(),
      onSubmit: vi.fn(),
      onKeyDown: vi.fn(),
    };

    render(
      <TaskBoardColumn
        column={{ id: "todo", title: "To do", tasks: [], className: "col", dotClass: "dot", textClass: "text" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        adding={adding}
      />,
    );

    expect(screen.getByText("No tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Add card"));
    expect(adding.setAddingToCol).toHaveBeenCalledWith("todo");
  });

  it("renders TaskBoardView correctly", () => {
    const tasks = [{ id: 1, title: "Card A", status: "todo" }, { id: 2, title: "Card B", status: "done" }];
    render(
      <TaskBoardView
        tasks={tasks}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });
});
