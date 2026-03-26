/**
 * Exercises TaskTimelineView cards and drag-and-drop state wiring.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useDragHandlersMock = vi.fn();
const useTaskTimelineStateMock = vi.fn();

vi.mock("../../../pages/GroupWork/components/useTaskTimelineState", () => ({
  useDragHandlers: (...args) => useDragHandlersMock(...args),
  useTaskTimelineState: (...args) => useTaskTimelineStateMock(...args),
}));

vi.mock("../../../pages/GroupWork/components/TaskAvatarStack", () => ({
  default: ({ assignees }) => <div>{`avatars:${assignees.length}`}</div>,
}));

vi.mock("../../../pages/GroupWork/components/TaskAssigneePopup", () => ({
  default: ({ isOpen, members, onClose, onToggleAssignee }) =>
    isOpen ? (
      <div data-testid="assignee-popup">
        <button type="button" onClick={() => onToggleAssignee(members[0].user)}>
          toggle-assignee
        </button>
        <button type="button" onClick={onClose}>
          close-assignees
        </button>
      </div>
    ) : null,
}));

vi.mock("../../../pages/GroupWork/components/TaskContextMenu", () => ({
  default: ({ task, onClose, onDelete, onEditStart }) => (
    <div data-testid="task-context-menu">
      <button type="button" onClick={onEditStart}>
        edit-task
      </button>
      <button type="button" onClick={() => onDelete(task.id)}>
        delete-task
      </button>
      <button type="button" onClick={onClose}>
        close-menu
      </button>
    </div>
  ),
}));

import TaskTimelineView from "../../../pages/GroupWork/components/TaskTimelineView";
import {
  TimelineCard,
  UnscheduledCard,
} from "../../../pages/GroupWork/components/TaskTimelineCards";

const members = [
  { id: 2, user: 2, name: "Bea" },
  { id: 1, user: 1, name: "Alex" },
];

const createTransfer = () => ({ setData: vi.fn() });
const dayMs = 86400000;
const timelineWeeks = [
  { id: "wk-1", label: "Week 1 (1 Mar - 6 Mar)", startTs: 1000 },
  { id: "wk-2", label: "Week 2 (8 Mar - 13 Mar)", startTs: 2000 },
  { id: "wk-3", label: "Week 3 (15 Mar - 20 Mar)", startTs: 3000 },
  { id: "wk-4", label: "Later", startTs: 4000 },
];
const placedTasks = {
  "wk-1": [[], [{ id: 11, title: "Timeline task", priority: "urgent", assignees_info: [] }], [], [], [], []],
  "wk-2": [[], [], [], [], [], []],
  "wk-3": [[], [], [], [], [], []],
  "wk-4": [[], [], [], [], [], []],
};

const buildTimelineTask = () => ({ id: 7, title: "Write essay", priority: "high" });

const buildUnscheduledTask = () => ({
  id: 8,
  title: "Read notes",
  assignees_info: [{ id: 1 }, { id: 9 }],
  priority: null,
});

const renderTimelineCard = (props = {}) => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  render(
    <TimelineCard
      assignees={[{ id: 1, username: "alex" }]}
      members={members}
      onDelete={onDelete}
      onUpdate={onUpdate}
      task={buildTimelineTask()}
      {...props}
    />,
  );
  return { onUpdate, onDelete };
};

const renderUnscheduledCard = (props = {}) => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  render(
    <UnscheduledCard
      members={members}
      onDelete={onDelete}
      onUpdate={onUpdate}
      task={buildUnscheduledTask()}
      {...props}
    />,
  );
  return { onUpdate, onDelete };
};

const visibleWeeks = (page) => (page === 0 ? timelineWeeks.slice(0, 3) : timelineWeeks.slice(3));

const buildTimelineState = (page) => ({
  dayMs,
  placed: placedTasks,
  unscheduled: page === 0 ? [{ id: 12, title: "Loose task", assignees_info: [] }] : [],
  visible: visibleWeeks(page),
  weeks: timelineWeeks,
});

const setupTimelineMocks = () => {
  const handlers = {
    dayMs,
    onDragLeave: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDropWidget: vi.fn(),
  };
  useDragHandlersMock.mockReturnValue(handlers);
  useTaskTimelineStateMock.mockImplementation((_tasks, page) => buildTimelineState(page));
  return handlers;
};

describe("Task timeline cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates assignees and saves context-menu edits", () => {
    const { onUpdate, onDelete } = renderTimelineCard();
    const card = screen.getByText("Write essay").closest("[draggable='true']");
    fireEvent.click(screen.getByText("avatars:1"));
    fireEvent.click(screen.getByText("toggle-assignee"));
    expect(onUpdate).toHaveBeenCalledWith(7, { assigned_to: [1, 2] });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText("edit-task"));
    fireEvent.change(screen.getByDisplayValue("Write essay"), { target: { value: "Updated essay" } });
    fireEvent.keyDown(screen.getByDisplayValue("Updated essay"), { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith(7, { title: "Updated essay" });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText("delete-task"));
    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it("sets drag payload for scheduled cards", () => {
    renderTimelineCard();
    const transfer = createTransfer();
    const card = screen.getByText("Write essay").closest("[draggable='true']");
    fireEvent.dragStart(card, { dataTransfer: transfer });
    expect(transfer.setData).toHaveBeenCalledWith("text/plain", "7");
  });

  it("sets drag payload for unscheduled cards", () => {
    renderUnscheduledCard();
    const transfer = createTransfer();
    const card = screen.getByText("Read notes").closest("[draggable='true']");
    fireEvent.dragStart(card, { dataTransfer: transfer });
    expect(transfer.setData).toHaveBeenCalledWith("text/plain", "8");
  });

  it("filters unscheduled assignees and exits edit mode on escape", () => {
    const { onUpdate } = renderUnscheduledCard();
    expect(screen.getByText("avatars:1")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("Read notes").closest("[draggable='true']"));
    fireEvent.click(screen.getByText("edit-task"));
    fireEvent.change(screen.getByDisplayValue("Read notes"), { target: { value: "Read summary" } });
    fireEvent.keyDown(screen.getByDisplayValue("Read summary"), { key: "Escape" });
    expect(onUpdate).not.toHaveBeenCalledWith(8, { title: "Read summary" });
  });

  it("saves unscheduled edits on blur and deletes tasks", () => {
    const { onUpdate, onDelete } = renderUnscheduledCard();
    const card = screen.getByText("Read notes").closest("[draggable='true']");
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getAllByText("edit-task")[0]);
    fireEvent.change(screen.getByDisplayValue("Read notes"), { target: { value: "Read summary" } });
    fireEvent.blur(screen.getByDisplayValue("Read summary"));
    expect(onUpdate).toHaveBeenCalledWith(8, { title: "Read summary" });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getAllByText("delete-task")[0]);
    expect(onDelete).toHaveBeenCalledWith(8);
  });
});

describe("TaskTimelineView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows unscheduled tasks and widget drop targets", () => {
    const handlers = setupTimelineMocks();
    const { container } = render(
      <TaskTimelineView members={members} onDelete={vi.fn()} onUpdate={vi.fn()} tasks={[]} />,
    );
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    expect(screen.getByText("Loose task")).toBeInTheDocument();
    const widgetList = container.querySelector("[class*='widgetList']");
    fireEvent.dragOver(widgetList);
    expect(widgetList.className).toContain("widgetListDropTarget");
    fireEvent.dragLeave(widgetList);
    fireEvent.drop(widgetList);
    expect(handlers.onDropWidget).toHaveBeenCalled();
  });

  it("drops tasks into timeline cells and paginates weeks", () => {
    const handlers = setupTimelineMocks();
    const { container } = render(
      <TaskTimelineView members={members} onDelete={vi.fn()} onUpdate={vi.fn()} tasks={[]} />,
    );
    const timelineCell = container.querySelector("[class*='timelineCell']");
    fireEvent.drop(timelineCell);
    expect(handlers.onDrop).toHaveBeenCalledWith(expect.any(Object), 1000);
    fireEvent.click(container.querySelectorAll("button")[1]);
    expect(screen.getByText("Later")).toBeInTheDocument();
  });
});
