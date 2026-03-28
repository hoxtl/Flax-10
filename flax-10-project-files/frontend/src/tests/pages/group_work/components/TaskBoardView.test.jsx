import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskBoardView from "@/pages/group_work/components/TaskBoardView";
import * as boardUtils from "@/pages/group_work/utils/taskBoardUtils";

vi.mock("@/pages/group_work/components/TaskBoardColumn", () => ({
  default: ({ column, adding }) => (
    <div data-testid={`column-${column.id}`}>
      {column.title}
      <button onClick={(e) => adding.onSubmit(e, column.id)}>Submit {column.id}</button>
      <button onClick={(e) => adding.onKeyDown({ key: "Enter", shiftKey: false }, column.id)}>Enter {column.id}</button>
      <button onClick={(e) => adding.onKeyDown({ key: "Escape" }, column.id)}>Esc {column.id}</button>
      <input 
        data-testid={`input-${column.id}`} 
        value={adding.newCardTitle} 
        onChange={(e) => adding.setNewCardTitle(e.target.value)} 
      />
    </div>
  ),
}));

vi.mock("@/pages/group_work/utils/taskBoardUtils", () => ({
  buildBoardColumns: vi.fn(() => [
    { id: "todo", title: "To Do", tasks: [] },
    { id: "progress", title: "In Progress", tasks: [] }
  ]),
}));

describe("TaskBoardView", () => {
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders columns correctly", () => {
    render(<TaskBoardView tasks={[]} members={[]} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} />);
    expect(screen.getByTestId("column-todo")).toBeTruthy();
    expect(screen.getByTestId("column-progress")).toBeTruthy();
  });

  it("handles adding a new card via onSubmit", () => {
    render(<TaskBoardView tasks={[]} onAdd={onAdd} />);
    
    // Type something
    const input = screen.getByTestId("input-todo");
    fireEvent.change(input, { target: { value: "New Task" } });
    
    // Submit
    fireEvent.click(screen.getByText("Submit todo"));
    expect(onAdd).toHaveBeenCalledWith("New Task", "todo");
    expect(input.value).toBe("");
  });

  it("handles adding a new card via Enter key", () => {
    render(<TaskBoardView tasks={[]} onAdd={onAdd} />);
    
    const input = screen.getByTestId("input-todo");
    fireEvent.change(input, { target: { value: "Enter Task" } });
    
    fireEvent.click(screen.getByText("Enter todo"));
    expect(onAdd).toHaveBeenCalledWith("Enter Task", "todo");
  });

  it("handles cancelling via Escape key", () => {
    render(<TaskBoardView tasks={[]} onAdd={onAdd} />);
    
    const input = screen.getByTestId("input-todo");
    fireEvent.change(input, { target: { value: "Don't Save" } });
    
    fireEvent.click(screen.getByText("Esc todo"));
    expect(onAdd).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("does not call onAdd for empty titles", () => {
    render(<TaskBoardView tasks={[]} onAdd={onAdd} />);
    fireEvent.change(screen.getByTestId("input-todo"), { target: { value: "  " } });
    fireEvent.click(screen.getByText("Submit todo"));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
