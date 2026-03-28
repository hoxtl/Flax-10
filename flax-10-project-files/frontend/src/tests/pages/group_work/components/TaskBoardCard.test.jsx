import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskBoardCard from "@/pages/group_work/components/TaskBoardCard";
import * as editUtils from "@/pages/group_work/components/taskCardEditUtils";

vi.mock("@/components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange }) => (
    <input 
      data-testid="date-picker" 
      value={value || ""} 
      onChange={(e) => onChange(e.target.value)} 
    />
  ),
}));

vi.mock("@/pages/group_work/components/TaskAssigneePopup", () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="assign-popup">Assign Popup</div> : null,
}));

vi.mock("@/pages/group_work/components/TaskAvatarStack", () => ({
  default: () => <div data-testid="avatar-stack">Avatars</div>,
}));

vi.mock("@/pages/group_work/components/TaskContextMenu", () => ({
  default: ({ onClose, onDelete }) => (
    <div data-testid="ctx-menu">
      <button onClick={onDelete}>Delete</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getPriorityStyle: vi.fn(() => ({ backgroundColor: "red", color: "white" })),
}));

 vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: vi.fn(),
  filterVisibleAssignees: vi.fn(() => []),
  getDueDateStr: vi.fn((d) => d || ""),
}));

vi.mock("@/pages/group_work/components/taskCardEditUtils", () => ({
  handleTaskTitleKeyDown: vi.fn(),
  useTaskTitleEdit: vi.fn(),
}));

describe("TaskBoardCard", () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const onDragStart = vi.fn();
  const task = { id: 1, title: "Initial Title", priority: "medium", due_date: "2023-01-01" };
  const members = [];

  const mockEditState = {
    editing: false,
    setEditing: vi.fn(),
    editTitle: "Initial Title",
    setEditTitle: vi.fn(),
    saveEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    editUtils.useTaskTitleEdit.mockReturnValue(mockEditState);
  });

  it("renders basic info correctly", () => {
    render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} onDelete={onDelete} onDragStart={onDragStart} />);
    expect(screen.getByText("Initial Title")).toBeTruthy();
    expect(screen.getByDisplayValue("MEDIUM")).toBeTruthy();
  });

  it("handles priority change", () => {
    render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "high" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { priority: "high" });
  });

  it("handles title edit mode transition", () => {
    render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Initial Title"));
    expect(mockEditState.setEditing).toHaveBeenCalledWith(true);
    expect(mockEditState.setEditTitle).toHaveBeenCalledWith("Initial Title");
  });

  it("renders textarea when editing", () => {
    editUtils.useTaskTitleEdit.mockReturnValue({ ...mockEditState, editing: true });
    const { container } = render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} />);
    
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    
    fireEvent.change(textarea, { target: { value: "New Title" } });
    expect(mockEditState.setEditTitle).toHaveBeenCalledWith("New Title");
    
    fireEvent.blur(textarea);
    expect(mockEditState.saveEdit).toHaveBeenCalled();
  });

  it("handles due date change", () => {
    render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} />);
    const picker = screen.getByTestId("date-picker");
    fireEvent.change(picker, { target: { value: "2023-02-02" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { due_date: expect.any(String) });
  });

  it("toggles assignee popup", () => {
    render(<TaskBoardCard task={task} members={members} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByTestId("assign-popup")).toBeTruthy();
  });

  it("handles drag start", () => {
    render(<TaskBoardCard task={task} members={members} onDragStart={onDragStart} />);
    fireEvent.dragStart(screen.getByRole("button", { name: /Initial Title/ }).parentElement);
    expect(onDragStart).toHaveBeenCalledWith(expect.anything(), 1);
  });

  it("opens context menu on right click", () => {
    render(<TaskBoardCard task={task} members={members} />);
    fireEvent.contextMenu(screen.getByRole("button", { name: /Initial Title/ }).parentElement);
    expect(screen.getByTestId("ctx-menu")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("ctx-menu")).toBeNull();
  });
});
