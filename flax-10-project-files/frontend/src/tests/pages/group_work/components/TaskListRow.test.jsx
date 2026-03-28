import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskListRow from "@/pages/group_work/components/TaskListRow";
import * as editUtils from "@/components/common/inline_title_field/InlineTitleField";

vi.mock("@/components/common/task_priority_pill/TaskPriorityPill", () => ({
  default: ({ priority }) => <div data-testid="priority-pill">{priority}</div>,
}));

vi.mock("@/components/common/inline_title_field/InlineTitleField", () => {
  const actual = vi.importActual("@/components/common/inline_title_field/InlineTitleField");
  return {
    ...actual,
    default: ({ value }) => <div data-testid="inline-title">{value}</div>,
    useInlineEdit: vi.fn(() => ({
      isEditing: false,
      draft: "",
      setDraft: vi.fn(),
      start: vi.fn(),
      save: vi.fn(),
      cancel: vi.fn(),
    })),
  };
});

vi.mock("@/pages/group_work/components/TaskAssigneePopup", () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="assign-popup">Popup</div> : null),
}));

vi.mock("@/pages/group_work/components/TaskAvatarStack", () => ({
  default: () => <div data-testid="avatar-stack">Avatars</div>,
}));

vi.mock("@/components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange }) => (
    <input 
      data-testid="date-picker" 
      value={value || ""} 
      onChange={(e) => onChange(e.target.value)} 
    />
  ),
}));

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "blue"),
}));

vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: vi.fn(),
  filterVisibleAssignees: vi.fn((info) => info || []),
  getDueDateStr: vi.fn((d) => d || ""),
}));

describe("TaskListRow", () => {
  const onToggle = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const task = { id: 1, title: "Test Task", completed: false, priority: "high", due_date: "2023-01-01", assignees_info: [] };
  const members = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and handles toggle", () => {
    render(<TaskListRow task={task} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />);
    
    expect(screen.getByTestId("inline-title")).toHaveTextContent("Test Task");
    expect(screen.getByTestId("priority-pill")).toHaveTextContent("high");
    expect(screen.getByText("Unassigned")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "" })); // The checkbox button
    expect(onToggle).toHaveBeenCalledWith(1, true);
  });

  it("shows completed state", () => {
    const doneTask = { ...task, completed: true };
    render(<TaskListRow task={doneTask} members={members} onToggle={onToggle} />);
    
    // Checkbox should now have 'checkboxDone' class and Lucide icon
    const checkbox = screen.getAllByRole("button")[0];
    expect(checkbox.className).toContain("checkboxDone");
    
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(1, false);
  });

  it("renders avatars when assigned", () => {
    const assignedTask = { ...task, assignees_info: [{ id: 101, name: "Alice" }] };
    render(<TaskListRow task={assignedTask} members={members} onUpdate={onUpdate} />);
    
    expect(screen.getByTestId("avatar-stack")).toBeTruthy();
    expect(screen.queryByText("Unassigned")).toBeNull();
  });

  it("handles delete action", () => {
    render(<TaskListRow task={task} members={members} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle("Delete task"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("toggles assignee popup on click", () => {
    render(<TaskListRow task={task} members={members} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByText("Unassigned"));
    expect(screen.getByTestId("assign-popup")).toBeTruthy();
  });

  it("handles date change", () => {
    render(<TaskListRow task={task} members={members} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByTestId("date-picker"), { target: { value: "2023-05-05" } });
    expect(onUpdate).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
