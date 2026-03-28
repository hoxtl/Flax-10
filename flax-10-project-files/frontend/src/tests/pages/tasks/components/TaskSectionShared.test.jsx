import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <div data-testid="animate">{children}</div>,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../pages/tasks/components/TaskCard", () => ({
  default: ({ task, listColor, listName, onDelete, onEdit, onToggle }) => (
    <div data-testid={`task-card-${task.id}`}>
      <span>{listColor ?? "no-color"}</span>
      <span>{listName ?? "no-list"}</span>
      <button type="button" onClick={onDelete}>delete</button>
      {onEdit ? <button type="button" onClick={() => onEdit({ title: "Updated" }, { source: "test" })}>edit</button> : null}
      <button type="button" onClick={onToggle}>toggle</button>
    </div>
  ),
}));

import {
  CollapsibleCountChip,
  CollapsibleSectionBody,
  TaskCardRow,
} from "../../../../pages/tasks/components/TaskSectionShared";

describe("TaskSectionShared", () => {
  it("shows extra chip content only when expanded", () => {
    const { rerender } = render(<CollapsibleCountChip count={3} collapsed={false} extraContent="2 done" />);

    expect(screen.getByText("2 done")).toBeInTheDocument();

    rerender(<CollapsibleCountChip count={3} collapsed extraContent="2 done" />);

    expect(screen.queryByText("2 done")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders and hides the collapsible section body", () => {
    const { rerender } = render(
      <CollapsibleSectionBody collapsed={false} bodyKey="today">
        <div>Body content</div>
      </CollapsibleSectionBody>,
    );

    expect(screen.getByText("Body content")).toBeInTheDocument();

    rerender(
      <CollapsibleSectionBody collapsed bodyKey="today">
        <div>Body content</div>
      </CollapsibleSectionBody>,
    );

    expect(screen.queryByText("Body content")).not.toBeInTheDocument();
  });

  function renderNormalTaskCardRow(overrides = {}) {
    return render(
      <TaskCardRow
        task={{ id: 4, title: "Essay", task_list: 1 }}
        listMap={{ 1: { id: 1, name: "Inbox", color: "#abc" } }}
        lists={[{ id: 1, name: "Inbox" }]}
        onDeleteTask={vi.fn()}
        onEditTask={vi.fn()}
        onToggleComplete={vi.fn()}
        {...overrides}
      />,
    );
  }

  it("resolves list metadata for normal lists", () => {
    renderNormalTaskCardRow();
    expect(screen.getByTestId("task-card-4")).toHaveTextContent("#abc");
    expect(screen.getByTestId("task-card-4")).toHaveTextContent("Inbox");
  });

  it("forwards card handlers for normal lists", () => {
    const onDeleteTask = vi.fn();
    const onEditTask = vi.fn();
    const onToggleComplete = vi.fn();
    renderNormalTaskCardRow({ onDeleteTask, onEditTask, onToggleComplete });
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(onDeleteTask).toHaveBeenCalledWith(4);
    expect(onEditTask).toHaveBeenCalledWith(4, { title: "Updated" }, { source: "test" });
    expect(onToggleComplete).toHaveBeenCalledWith(4);
  });

  it("falls back to task list_name and suppresses edit for reading lists or missing handlers", () => {
    const onToggleComplete = vi.fn();

    render(
      <TaskCardRow
        task={{ id: 8, title: "Read", list_id: 2, list_name: "CS101 - Systems" }}
        listMap={{ 2: { id: 2, name: "CS101 - Systems" } }}
        lists={[{ id: 2, name: "CS101 - Systems" }]}
        onToggleComplete={onToggleComplete}
      />,
    );

    expect(screen.getByTestId("task-card-8")).toHaveTextContent("no-color");
    expect(screen.getByTestId("task-card-8")).toHaveTextContent("CS101 - Systems");
    expect(screen.queryByRole("button", { name: "edit" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(onToggleComplete).toHaveBeenCalledWith(8);
  });

  it("handles tasks without any list key", () => {
    render(
      <TaskCardRow
        task={{ id: 12, title: "Loose task" }}
        listMap={{}}
        lists={[]}
      />,
    );

    expect(screen.getByTestId("task-card-12")).toHaveTextContent("no-list");
    expect(screen.getByTestId("task-card-12")).toHaveTextContent("no-color");
  });
});
