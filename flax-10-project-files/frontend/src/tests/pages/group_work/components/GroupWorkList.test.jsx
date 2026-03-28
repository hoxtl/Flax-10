import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const getUserColor = vi.fn(() => "#123456");
const buildToggleAssignee = vi.fn(() => vi.fn());
const useInlineEdit = vi.fn();

vi.mock("../../../../pages/group_work/utils/priorityUtils", () => ({
  getUserColor: (...args) => getUserColor(...args),
}));

vi.mock("../../../../pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: (...args) => buildToggleAssignee(...args),
  getDueDateStr: vi.fn((v) => v ? "2026-03-30" : ""),
  filterVisibleAssignees: vi.fn((a) => a),
}));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("@/components/common/task_priority_pill/TaskPriorityPill", () => ({
  default: ({ priority }) => <span>{priority}</span>,
}));

vi.mock("@/components/common/inline_title_field/InlineTitleField", () => ({
  default: ({ value, onStart, onSave, onCancel }) => (
    <div>
      <span>{value}</span>
      <button type="button" onClick={onStart}>start-inline-edit</button>
      <button type="button" onClick={onSave}>save-inline-edit</button>
      <button type="button" onClick={onCancel}>cancel-inline-edit</button>
    </div>
  ),
  useInlineEdit: (...args) => useInlineEdit(...args),
}));

vi.mock("@/components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ onCancel, onConfirm, title }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onCancel}>cancel-hold</button>
      <button type="button" onClick={onConfirm}>confirm-hold</button>
    </div>
  ),
}));

vi.mock("@/components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title} {hint}</div>,
}));

vi.mock("lucide-react", () => ({
  Check: () => <span>check-icon</span>,
  X: () => <span>x-icon</span>,
  Pencil: () => <span>pencil-icon</span>,
  Trash2: () => <span>trash-icon</span>,
  Calendar: () => <span>calendar-icon</span>,
}));

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
}));

import TaskListRow from "@/pages/group_work/components/TaskListRow";
import TaskListView from "@/pages/group_work/components/TaskListView";

describe("GroupWork task component - List", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInlineEdit.mockReturnValue({
      isEditing: false,
      draft: "Draft outline",
      start: vi.fn(),
      save: vi.fn(),
      cancel: vi.fn(),
    });
  });

  it("renders TaskListView headers and rows", () => {
    render(
      <TaskListView
        tasks={[{ id: 1, title: "Draft brief", priority: "high", due_date: "2026-03-30T00:00:00.000Z" }]}
        members={[{ id: 1, name: "Alex" }]}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Draft brief")).toBeInTheDocument();
  });

  it("renders TaskListRow and handles delete and update", () => {
    const onDelete = vi.fn();
    const onUpdate = vi.fn();
    render(
      <TaskListRow
        task={{ id: 5, title: "Write brief", completed: false, priority: "medium", due_date: "2026-03-30T00:00:00.000Z", assignees_info: [] }}
        members={[]}
        onToggle={vi.fn()}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByTitle("Delete task"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("handles inline edit controls", () => {
    const start = vi.fn();
    const save = vi.fn();
    useInlineEdit.mockReturnValueOnce({ isEditing: false, draft: "Review draft", start, save, cancel: vi.fn() });
    render(
      <TaskListRow
        task={{ id: 6, title: "Review draft" }}
        members={[]}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("start-inline-edit"));
    fireEvent.click(screen.getByText("save-inline-edit"));
    expect(start).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });

  it("handles assignee toggles in list row", () => {
    render(
      <TaskListRow
        task={{ id: 6, title: "Review draft", assignees_info: [{ id: 1, name: "Alex" }] }}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByText("Alex")[0]);
    expect(buildToggleAssignee).toHaveBeenCalled();
  });
});
