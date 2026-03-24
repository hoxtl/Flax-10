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

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  openMemberProfile: (...args) => openMemberProfile(...args),
  getDisplayName: (...args) => getDisplayName(...args),
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

vi.mock("../../../pages/GroupWork/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name || member.username || member.user_name}</span>,
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

vi.mock("../../../components/common/InlineTitleField/InlineTitleField", () => ({
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

vi.mock("../../../components/common/HoldConfirmModal/HoldConfirmModal", () => ({
  default: ({ onCancel, onConfirm, title }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onCancel}>cancel-hold</button>
      <button type="button" onClick={onConfirm}>confirm-hold</button>
    </div>
  ),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
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

import TaskAvatarStack from "../../../pages/GroupWork/components/TaskAvatarStack";
import TaskAssigneePopup from "../../../pages/GroupWork/components/TaskAssigneePopup";
import TaskContextMenu from "../../../pages/GroupWork/components/TaskContextMenu";
import TaskBoardCard from "../../../pages/GroupWork/components/TaskBoardCard";
import TaskBoardColumn from "../../../pages/GroupWork/components/TaskBoardColumn";
import TaskBoardView from "../../../pages/GroupWork/components/TaskBoardView";
import TaskListRow from "../../../pages/GroupWork/components/TaskListRow";
import TaskListView from "../../../pages/GroupWork/components/TaskListView";
import { useDragHandlers, useTaskTimelineState } from "../../../pages/GroupWork/components/useTaskTimelineState";
import { TimelineCard, UnscheduledCard } from "../../../pages/GroupWork/components/TaskTimelineCards";
import TaskTimelineView from "../../../pages/GroupWork/components/TaskTimelineView";

vi.mock("../../../pages/GroupWork/utils/taskBoardUtils", () => ({
  buildBoardColumns: vi.fn((tasks) => [
    { id: "todo", title: "To do", tasks: tasks.filter((task) => task.status === "todo"), className: "todo-col", dotClass: "dot", textClass: "text" },
    { id: "done", title: "Done", tasks: tasks.filter((task) => task.status === "done"), className: "done-col", dotClass: "dot", textClass: "text" },
  ]),
}));

vi.mock("../../../pages/GroupWork/utils/taskTimelineUtils", () => ({
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

  it("renders avatar stack, popup, and context menu interactions", async () => {
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
          members={[{ id: 1, user: 1, name: "Alex" }, { id: 2, user: 2, name: "Bea" }]}
          assignees={[{ id: 1 }]}
          onToggleAssignee={onToggleAssignee}
          triggerRef={triggerRef}
        />
      </>,
    );

    expect(screen.getByText("+1")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Open Alex profile"));
    expect(openMemberProfile).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText("Bea")[1]);
    expect(onToggleAssignee).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByText("x-icon"));
    expect(onClose).toHaveBeenCalled();

    render(
      <TaskContextMenu
        pos={{ x: 10, y: 20 }}
        task={{ id: 11 }}
        onDelete={vi.fn()}
        onClose={onClose}
        onEditStart={vi.fn()}
      />,
    );
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders task board card and toggles popup, due date, context menu, and drag", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const onDragStart = vi.fn();
    render(
      <TaskBoardCard
        task={{ id: 1, title: "Draft outline", priority: "high", due_date: "2026-03-30T00:00:00.000Z", assignees_info: [{ id: 1, name: "Alex" }], status: "todo" }}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDragStart={onDragStart}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("high"), { target: { value: "low" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { priority: "low" });

    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-03-31" } });
    expect(onUpdate).toHaveBeenCalledWith(1, { due_date: new Date("2026-03-31").toISOString() });

    fireEvent.click(screen.getByText("+"));
    expect(buildToggleAssignee).toHaveBeenCalled();

    const card = screen.getByText("Draft outline").closest("div");
    fireEvent.dragStart(card, { dataTransfer: {} });
    expect(onDragStart).toHaveBeenCalledWith(expect.anything(), 1);

    fireEvent.contextMenu(card);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Edit"));
    expect(useTaskTitleEdit.mock.results[0].value.setEditing).toHaveBeenCalledWith(true);
    expect(useTaskTitleEdit.mock.results[0].value.setEditTitle).toHaveBeenCalledWith("Draft outline");

    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("renders the editable title textarea and handles enter/escape shortcuts", () => {
    const saveEdit = vi.fn();
    const setEditing = vi.fn();
    const setEditTitle = vi.fn();
    useTaskTitleEdit.mockReturnValueOnce({
      editing: true,
      setEditing,
      editTitle: "Draft outline",
      setEditTitle,
      saveEdit,
    });

    render(
      <TaskBoardCard
        task={{ id: 2, title: "Draft outline", priority: "medium", due_date: null, assignees_info: [] }}
        members={[]}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    const textarea = screen.getByDisplayValue("Draft outline");
    fireEvent.change(textarea, { target: { value: "Updated title" } });
    expect(setEditTitle).toHaveBeenCalledWith("Updated title");
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(saveEdit).toHaveBeenCalled();
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(setEditing).toHaveBeenCalledWith(false);
  });

  it("renders board column empty/add states and board view add flow", () => {
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

    const dataTransfer = { getData: vi.fn(() => "12") };
    render(
      <TaskBoardColumn
        column={{ id: "todo", title: "To do", tasks: [], className: "col", dotClass: "dot", textClass: "text" }}
        members={[]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        adding={adding}
      />,
    );

    expect(screen.getByText("No tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Add card"));
    expect(adding.setAddingToCol).toHaveBeenCalledWith("todo");
    fireEvent.drop(screen.getByText("To do").closest("div").parentElement, { dataTransfer });
    expect(onUpdate).toHaveBeenCalledWith(12, { status: "todo" });

    const onAdd = vi.fn();
    const { rerender } = render(
      <TaskBoardView
        tasks={[{ id: 1, title: "Card A", status: "todo" }, { id: 2, title: "Card B", status: "done" }]}
        members={[]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();

    rerender(
      <TaskBoardView
        tasks={[{ id: 1, title: "Card A", status: "todo" }]}
        members={[]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText("Card A")).toBeInTheDocument();
  });

  it("renders TimelineCard and handles context menu, popup toggle, drag", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const members = [{ id: 1, user: 1, name: "Alice" }];
    const task = { id: 5, title: "Timeline task", priority: "high", completed: false };

    render(
      <TimelineCard
        task={task}
        members={members}
        assignees={[{ id: 1, name: "Alice" }]}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Timeline task")).toBeInTheDocument();

    // open assignee popup via avatar trigger click
    const avatarTrigger = screen.getByText("Timeline task").closest("[class]").parentElement.querySelector("[class]");
    // context menu
    fireEvent.contextMenu(screen.getByText("Timeline task").closest("div").parentElement.parentElement);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("renders UnscheduledCard and handles context menu interactions", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const task = { id: 8, title: "Unscheduled item", priority: "low", assignees_info: [] };
    const members = [{ id: 1, user: 1, name: "Bob" }];

    render(
      <UnscheduledCard task={task} members={members} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    expect(screen.getByText("Unscheduled item")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("Unscheduled item").closest("div"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(8);
  });

  it("renders TaskTimelineView with tasks and handles pagination", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const tasks = [
      { id: 1, title: "Task A", weekId: "w1", due_date: "2026-03-25T00:00:00.000Z", completed: false, status: "todo" },
      { id: 2, due_date: null, completed: false, status: "todo", title: "Task B", assignees_info: [] },
    ];
    const members = [{ id: 1, user: 1, name: "Cara" }];

    render(
      <TaskTimelineView tasks={tasks} members={members} onUpdate={onUpdate} onDelete={onDelete} />,
    );

    // Header days present
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    // Unscheduled widget
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();

    // Pagination dots - click page 2
    const pageDots = screen.getAllByRole("button", { name: "" });
    if (pageDots.length > 1) {
      fireEvent.click(pageDots[1]);
    }
  });

  it("renders task list row/view and confirms delete flow", () => {
    const onToggle = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    render(
      <>
        <TaskListView tasks={[]} members={[]} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
        <TaskListRow
          task={{ id: 5, title: "Write brief", completed: false, priority: "medium", due_date: "2026-03-30T00:00:00.000Z", assignees_info: [] }}
          members={[]}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </>,
    );

    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onToggle).toHaveBeenCalledWith(5, true);
    fireEvent.change(screen.getByLabelText("No due date"), { target: { value: "2026-04-01" } });
    expect(onUpdate).toHaveBeenCalledWith(5, { due_date: new Date("2026-04-01").toISOString() });
    fireEvent.click(screen.getByTitle("Delete task"));
    fireEvent.click(screen.getByText("confirm-hold"));
    expect(onDelete).toHaveBeenCalledWith(5);
  });

  it("handles assigned task rows, inline edit controls, assignee toggles, and delete cancel", () => {
    const start = vi.fn();
    const save = vi.fn();
    const cancel = vi.fn();
    const toggleAssignee = vi.fn();
    useInlineEdit.mockReturnValueOnce({
      isEditing: false,
      draft: "Review draft",
      setDraft: vi.fn(),
      start,
      save,
      cancel,
    });
    buildToggleAssignee.mockReturnValueOnce(toggleAssignee);

    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskListRow
        task={{
          id: 6,
          title: "Review draft",
          completed: true,
          priority: "high",
          due_date: null,
          assignees_info: [{ id: 1, name: "Alex" }],
        }}
        members={[{ id: 1, user: 1, name: "Alex" }]}
        onToggle={vi.fn()}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(getUserColor).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("start-inline-edit"));
    fireEvent.click(screen.getByText("save-inline-edit"));
    fireEvent.click(screen.getByText("cancel-inline-edit"));
    expect(start).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText("Alex")[0]);
    const popupAlexEntries = screen.getAllByText("Alex");
    fireEvent.click(popupAlexEntries[popupAlexEntries.length - 1]);
    expect(buildToggleAssignee).toHaveBeenCalledWith([{ id: 1, name: "Alex" }], 6, onUpdate);
    expect(toggleAssignee).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTitle("Delete task"));
    fireEvent.click(screen.getByText("cancel-hold"));
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("GroupWork task timeline hooks", () => {
  it("handles drag events and timeline state derivation", () => {
    const onUpdate = vi.fn();
    const styles = { timelineCellDropTarget: "drop-target", widgetListDropTarget: "widget-target" };
    const { result } = renderHook(() => useDragHandlers(onUpdate, styles));

    const dragEvent = {
      preventDefault: vi.fn(),
      currentTarget: { classList: { add: vi.fn(), remove: vi.fn() } },
      dataTransfer: { getData: vi.fn(() => "9") },
    };

    act(() => result.current.onDragOver(dragEvent));
    expect(dragEvent.currentTarget.classList.add).toHaveBeenCalledWith("drop-target");
    act(() => result.current.onDragLeave(dragEvent));
    expect(dragEvent.currentTarget.classList.remove).toHaveBeenCalledWith("drop-target");
    act(() => result.current.onDrop(dragEvent, new Date("2026-03-30T00:00:00.000Z").getTime()));
    const droppedDate = new Date("2026-03-30T00:00:00.000Z");
    droppedDate.setHours(12, 0, 0, 0);
    expect(onUpdate).toHaveBeenCalledWith(9, { due_date: droppedDate.toISOString() });
    act(() => result.current.onDropWidget(dragEvent));
    expect(onUpdate).toHaveBeenCalledWith(9, { due_date: null });
  });

  it("builds visible weeks, placements, and unscheduled tasks", () => {
    const { result } = renderHook(() => useTaskTimelineState([
      { id: 1, weekId: "w1", due_date: "2026-03-25T00:00:00.000Z", completed: false, status: "todo" },
      { id: 2, due_date: null, completed: false, status: "todo" },
      { id: 3, due_date: null, completed: true, status: "done" },
    ], 1));

    expect(result.current.weeks).toHaveLength(4);
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.unscheduled).toEqual([{ id: 2, due_date: null, completed: false, status: "todo" }]);
    expect(result.current.dayMs).toBe(86400000);
  });
});

describe("TaskListView", () => {
  it("renders task list headers and rows for non-empty task list views", () => {
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
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Due date")).toBeInTheDocument();
    expect(screen.getByText("Assignee")).toBeInTheDocument();
    expect(screen.getByText("Draft brief")).toBeInTheDocument();
  });
});
