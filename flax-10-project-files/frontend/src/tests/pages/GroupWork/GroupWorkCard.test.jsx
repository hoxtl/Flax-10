import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const createPortal = vi.fn((node) => node);
const openMemberProfile = vi.fn();
const getDisplayName = vi.fn((member) => member.name || member.username || member.user_name || `User ${member.id}`);
const getUserColor = vi.fn(() => "#123456");
const shouldShowPopupAbove = vi.fn(() => false);
const createPopupCoords = vi.fn(() => ({ top: 100, left: 40, width: 220 }));
const getPriorityStyle = vi.fn(() => ({ bg: "#fff", border: "#ddd", color: "#111", backgroundColor: "#eee" }));
const buildToggleAssignee = vi.fn(() => vi.fn());
const filterVisibleAssignees = vi.fn((assignees) => assignees);
const getDueDateStr = vi.fn((value) => value ? "2026-03-30" : "");
const handleDragStartTask = vi.fn();
const useTaskTitleEdit = vi.fn();

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (...args) => createPortal(...args) };
});

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  openMemberProfile: (...args) => openMemberProfile(...args),
  getDisplayName: (...args) => getDisplayName(...args),
  getPhotoUrl: vi.fn(() => null),
  getInitials: vi.fn((m) => (m?.name || m?.username || m?.user_name || "?").substring(0, 1).toUpperCase()),
}));

vi.mock("../../../pages/GroupWork/utils/priorityUtils", () => ({
  getUserColor: (...args) => getUserColor(...args),
  getPriorityStyle: (...args) => getPriorityStyle(...args),
}));

vi.mock("../../../pages/GroupWork/utils/taskAssigneeUtils", () => ({
  shouldShowPopupAbove: (...args) => shouldShowPopupAbove(...args),
  createPopupCoords: (...args) => createPopupCoords(...args),
}));

vi.mock("../../../pages/GroupWork/utils/taskUtils", () => ({
  buildToggleAssignee: (...args) => buildToggleAssignee(...args),
  filterVisibleAssignees: (...args) => filterVisibleAssignees(...args),
  getDueDateStr: (...args) => getDueDateStr(...args),
  handleDragStartTask: (...args) => handleDragStartTask(...args),
}));

vi.mock("../../../pages/GroupWork/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: (...args) => useTaskTitleEdit(...args),
  handleTaskTitleKeyDown: (event, saveEdit, setEditing) => {
    if (event.key === "Enter" && !event.shiftKey) saveEdit();
    if (event.key === "Escape") setEditing(false);
  },
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/common/TaskPriorityPill/TaskPriorityPill", () => ({
  default: ({ priority }) => <span>{priority}</span>,
}));

vi.mock("lucide-react", () => ({
  Check: () => <span>check-icon</span>,
  X: () => <span>x-icon</span>,
  Pencil: () => <span>pencil-icon</span>,
  Trash2: () => <span>trash-icon</span>,
  Calendar: () => <span>calendar-icon</span>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import TaskBoardCard from "../../../pages/GroupWork/components/TaskBoardCard";
import { TimelineCard, UnscheduledCard } from "../../../pages/GroupWork/components/TaskTimelineCards";

describe("GroupWork task component - Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskTitleEdit.mockReturnValue({
      editing: false,
      setEditing: vi.fn(),
      editTitle: "Draft outline",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
  });

  it("renders task board card and toggles priority/dates", () => {
    const onUpdate = vi.fn();
    render(
      <TaskBoardCard
        task={{ id: 1, title: "Draft outline", priority: "high", due_date: "2026-03-30T00:00:00.000Z", assignees_info: [], status: "todo" }}
        members={[]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "low" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { priority: "low" });
    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-03-31" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { due_date: new Date("2026-03-31").toISOString() });
  });

  it("handles board card assignee click and drag", () => {
    const onDragStart = vi.fn();
    render(
      <TaskBoardCard
        task={{ id: 1, title: "Draft outline", status: "todo" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={onDragStart}
      />,
    );
    fireEvent.click(screen.getByText("+"));
    expect(buildToggleAssignee).toHaveBeenCalled();
    const card = screen.getByText("Draft outline").closest("div");
    fireEvent.dragStart(card, { dataTransfer: {} });
    expect(onDragStart).toHaveBeenCalledWith(expect.anything(), 1);
  });

  it("renders editable title textarea and handles enter shortcut", () => {
    const saveEdit = vi.fn();
    useTaskTitleEdit.mockReturnValueOnce({ editing: true, setEditing: vi.fn(), editTitle: "Draft outline", setEditTitle: vi.fn(), saveEdit });
    render(
      <TaskBoardCard
        task={{ id: 2, title: "Draft outline" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByDisplayValue("Draft outline"), { key: "Enter" });
    expect(saveEdit).toHaveBeenCalled();
  });

  it("handles editable title escape shortcut", () => {
    const setEditing = vi.fn();
    useTaskTitleEdit.mockReturnValueOnce({ editing: true, setEditing, editTitle: "Draft outline", setEditTitle: vi.fn(), saveEdit: vi.fn() });
    render(
      <TaskBoardCard
        task={{ id: 2, title: "Draft outline" }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    fireEvent.keyDown(screen.getByDisplayValue("Draft outline"), { key: "Escape" });
    expect(setEditing).toHaveBeenCalledWith(false);
  });

  it("uses default medium priority and marks status-specific differences", () => {
    const onUpdate = vi.fn();
    render(
      <TaskBoardCard
        task={{ id: 22, title: "Done card", priority: null, due_date: "2026-03-30T00:00:00.000Z", assignees_info: [], status: "done", completed: true }}
        members={[]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("medium");
    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "" } });
    expect(onUpdate).toHaveBeenCalledWith(22, { due_date: null });
  });

  it("renders TimelineCard and handles context menu and delete", () => {
    const onDelete = vi.fn();
    const task = { id: 5, title: "Timeline task", priority: "high", completed: false };

    render(
      <TimelineCard
        task={task}
        members={[{ id: 1, user: 1, name: "Alice" }]}
        assignees={[{ id: 1, name: "Alice" }]}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Timeline task")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("Timeline task").closest("div").parentElement.parentElement);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("renders UnscheduledCard and handles delete", () => {
    const onDelete = vi.fn();
    const task = { id: 8, title: "Unscheduled item", priority: "low", assignees_info: [] };

    render(
      <UnscheduledCard task={task} members={[]} onDelete={onDelete} onUpdate={vi.fn()} />,
    );

    expect(screen.getByText("Unscheduled item")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("Unscheduled item").closest("div"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(8);
  });
});
