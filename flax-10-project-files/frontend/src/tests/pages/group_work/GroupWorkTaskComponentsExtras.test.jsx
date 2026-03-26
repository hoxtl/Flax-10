import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, renderHook } from "@testing-library/react";

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
const useInlineEdit = vi.fn();

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (...args) => createPortal(...args) };
});

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  openMemberProfile: (...args) => openMemberProfile(...args),
  getDisplayName: (...args) => getDisplayName(...args),
}));

vi.mock("../../../pages/group_work/utils/priorityUtils", () => ({
  getUserColor: (...args) => getUserColor(...args),
  getPriorityStyle: (...args) => getPriorityStyle(...args),
}));

vi.mock("../../../pages/group_work/utils/taskAssigneeUtils", () => ({
  shouldShowPopupAbove: (...args) => shouldShowPopupAbove(...args),
  createPopupCoords: (...args) => createPopupCoords(...args),
}));

vi.mock("../../../pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: (...args) => buildToggleAssignee(...args),
  filterVisibleAssignees: (...args) => filterVisibleAssignees(...args),
  getDueDateStr: (...args) => getDueDateStr(...args),
  handleDragStartTask: (...args) => handleDragStartTask(...args),
}));

vi.mock("../../../pages/group_work/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: (...args) => useTaskTitleEdit(...args),
  handleTaskTitleKeyDown: (event, saveEdit, setEditing) => {
    if (event.key === "Enter" && !event.shiftKey) saveEdit();
    if (event.key === "Escape") setEditing(false);
  },
}));

vi.mock("../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
}));

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/common/task_priority_pill/TaskPriorityPill", () => ({
  default: ({ priority }) => <span>{priority}</span>,
}));

vi.mock("../../../components/common/inline_title_field/InlineTitleField", () => ({
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

vi.mock("../../../components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ onCancel, onConfirm, title }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onCancel}>cancel-hold</button>
      <button type="button" onClick={onConfirm}>confirm-hold</button>
    </div>
  ),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title, hint }) => <div>{title} {hint}</div>,
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

vi.mock("../../../pages/group_work/utils/taskTimelineUtils", () => ({
  DAY_MS: 86400000,
  getTimelineAnchor: vi.fn(() => new Date("2026-03-24T00:00:00.000Z")),
  buildWeeks: vi.fn(() => [
    { id: "w1", label: "Week 1 (24-29)", startTs: new Date("2026-03-24T00:00:00.000Z").getTime() },
    { id: "w2", label: "Week 2 (31-05)", startTs: new Date("2026-03-31T00:00:00.000Z").getTime() },
    { id: "w3", label: "Week 3 (07-12)", startTs: new Date("2026-04-07T00:00:00.000Z").getTime() },
    { id: "w4", label: "Week 4 (14-19)", startTs: new Date("2026-04-14T00:00:00.000Z").getTime() },
  ]),
  placeTasksIntoWeeks: vi.fn((tasks, weeks) => Object.fromEntries(
    weeks.map((week) => [week.id, { 0: tasks.filter((task) => task.weekId === week.id) }]),
  )),
}));

import TaskAvatarStack from "../../../pages/group_work/components/TaskAvatarStack";
import TaskAssigneePopup from "../../../pages/group_work/components/TaskAssigneePopup";
import TaskContextMenu from "../../../pages/group_work/components/TaskContextMenu";

describe("GroupWork task component extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskTitleEdit.mockReturnValue({
      editing: false,
      setEditing: vi.fn(),
      editTitle: "Draft outline",
      setEditTitle: vi.fn(),
      saveEdit: vi.fn(),
    });
    useInlineEdit.mockReturnValue({
      isEditing: false,
      draft: "Draft outline",
      setDraft: vi.fn(),
      start: vi.fn(),
      save: vi.fn(),
      cancel: vi.fn(),
    });
  });

  it("renders avatar stack and opens profile", () => {
    render(<TaskAvatarStack assignees={[{ id: 1, name: "Alex" }]} />);
    fireEvent.click(screen.getByLabelText("Open Alex profile"));
    expect(openMemberProfile).toHaveBeenCalled();
  });

  it("renders assignee popup and toggles assignee", () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskAssigneePopup
        isOpen
        onClose={onClose}
        members={[{ id: 1, user: 1, name: "Alex" }, { id: 2, user: 2, name: "Bea" }]}
        assignees={[{ id: 1 }]}
        onToggleAssignee={onToggle}
        triggerRef={{ current: document.createElement("div") }}
      />,
    );
    fireEvent.click(screen.getAllByText("Bea")[0]);
    expect(onToggle).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByText("x-icon"));
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when the assignee popup is closed", () => {
    const { container } = render(
      <TaskAssigneePopup
        isOpen={false}
        onClose={vi.fn()}
        members={[]}
        assignees={[]}
        onToggleAssignee={vi.fn()}
        triggerRef={{ current: null }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("positions the popup above the trigger when needed", () => {
    shouldShowPopupAbove.mockReturnValueOnce(true);
    createPopupCoords.mockReturnValueOnce({ top: 100, left: 40, width: 220 });
    const triggerRef = {
      current: {
        getBoundingClientRect: () => ({ top: 1, bottom: 2, left: 3, right: 4, width: 5, height: 6 }),
        contains: () => false,
      },
    };

    render(
      <TaskAssigneePopup
        isOpen
        onClose={vi.fn()}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        assignees={[]}
        onToggleAssignee={vi.fn()}
        triggerRef={triggerRef}
      />,
    );

    expect(shouldShowPopupAbove).toHaveBeenCalled();
    expect(createPopupCoords).toHaveBeenCalled();
    expect(screen.getByText("Assign Members")).toBeInTheDocument();
  });

  it("renders context menu and handles outside click", () => {
    const onClose = vi.fn();
    render(<TaskContextMenu pos={{ x: 10, y: 20 }} task={{ id: 11 }} onDelete={vi.fn()} onClose={onClose} onEditStart={vi.fn()} />);
    fireEvent.mouseDown(screen.getByText("Edit").closest("div"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
