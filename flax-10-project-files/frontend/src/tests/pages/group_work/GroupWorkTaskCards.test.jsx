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

import TaskAvatarStack from "../../../pages/group_work/components/TaskAvatarStack";
import TaskAssigneePopup from "../../../pages/group_work/components/TaskAssigneePopup";
import TaskContextMenu from "../../../pages/group_work/components/TaskContextMenu";
import TaskBoardCard from "../../../pages/group_work/components/TaskBoardCard";
import TaskBoardColumn from "../../../pages/group_work/components/TaskBoardColumn";

const defaultMembers = [
  { id: 1, user: 1, name: "Alex" },
  { id: 2, user: 2, name: "Bea" },
];

const renderAvatarStackAndPopup = () => {
  const onClose = vi.fn();
  const onToggleAssignee = vi.fn();
  const triggerRef = { current: document.createElement("div") };
  document.body.appendChild(triggerRef.current);
  render(
    <>
      <TaskAvatarStack assignees={[{ id: 1, name: "Alex" }, { id: 2, name: "Bea" }, { id: 3, name: "Cara" }, { id: 4, name: "Drew" }]} />
      <TaskAssigneePopup
        isOpen
        onClose={onClose}
        members={defaultMembers}
        assignees={[{ id: 1 }]}
        onToggleAssignee={onToggleAssignee}
        triggerRef={triggerRef}
      />
    </>,
  );
  return { onClose, onToggleAssignee };
};

const renderTaskBoardCard = (overrides = {}) => {
  const props = {
    task: {
      id: 1,
      title: "Draft outline",
      priority: "high",
      due_date: "2026-03-30T00:00:00.000Z",
      assignees_info: [{ id: 1, name: "Alex" }],
      status: "todo",
      ...overrides.task,
    },
    members: overrides.members ?? defaultMembers,
    onUpdate: overrides.onUpdate ?? vi.fn(),
    onDelete: overrides.onDelete ?? vi.fn(),
    onDragStart: overrides.onDragStart ?? vi.fn(),
  };
  render(<TaskBoardCard {...props} />);
  return props;
};

describe("GroupWork task cards", () => {
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

  it("shows overflow counts and opens member profiles", () => {
    renderAvatarStackAndPopup();
    expect(screen.getByText("+1")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Open Alex profile"));
    expect(openMemberProfile).toHaveBeenCalled();
  });

  it("toggles assignees and dismisses the popup", () => {
    const { onClose, onToggleAssignee } = renderAvatarStackAndPopup();
    fireEvent.click(screen.getAllByText("Bea")[1]);
    expect(onToggleAssignee).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByText("x-icon"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes the task context menu on outside click", () => {
    const onClose = vi.fn();
    render(<TaskContextMenu pos={{ x: 10, y: 20 }} task={{ id: 11 }} onDelete={vi.fn()} onClose={onClose} onEditStart={vi.fn()} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("updates priority and due date on board cards", () => {
    const { onUpdate } = renderTaskBoardCard();
    fireEvent.change(screen.getByDisplayValue("HIGH"), { target: { value: "low" } });
    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-03-31" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { priority: "low" });
    expect(onUpdate).toHaveBeenCalledWith(1, { due_date: new Date("2026-03-31").toISOString() });
  });

  it("opens the editable title textarea and handles enter/escape shortcuts", () => {
    const saveEdit = vi.fn();
    const setEditing = vi.fn();
    useTaskTitleEdit.mockReturnValueOnce({
      editing: true,
      setEditing,
      editTitle: "Draft outline",
      setEditTitle: vi.fn(),
      saveEdit,
    });

    renderTaskBoardCard();
    const textarea = screen.getByDisplayValue("Draft outline");
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(saveEdit).toHaveBeenCalled();
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(setEditing).toHaveBeenCalledWith(false);
  });

  it("renders board columns and handles drops", () => {
    const onUpdate = vi.fn();
    render(
      <TaskBoardColumn
        column={{ id: "todo", title: "To do", tasks: [], className: "col", dotClass: "dot", textClass: "text" }}
        members={[]}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        adding={{ addingToCol: null, setAddingToCol: vi.fn(), newCardTitle: "", setNewCardTitle: vi.fn(), onSubmit: vi.fn(), onKeyDown: vi.fn() }}
      />
    );
    expect(screen.getByText("No tasks")).toBeInTheDocument();
    fireEvent.drop(screen.getByText("To do").closest("div").parentElement, { dataTransfer: { getData: () => "12" } });
    expect(onUpdate).toHaveBeenCalledWith(12, { status: "todo" });
  });
});
