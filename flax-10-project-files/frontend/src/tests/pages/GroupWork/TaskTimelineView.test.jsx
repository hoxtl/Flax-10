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

describe("Task timeline cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders timeline cards, supports drag data, editing, assignee toggling, and delete actions", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(
      <TimelineCard
        assignees={[{ id: 1, username: "alex" }]}
        members={members}
        onDelete={onDelete}
        onUpdate={onUpdate}
        task={{ id: 7, title: "Write essay", priority: "high" }}
      />,
    );

    fireEvent.click(screen.getByText("avatars:1"));
    fireEvent.click(screen.getByText("toggle-assignee"));
    expect(onUpdate).toHaveBeenCalledWith(7, { assigned_to: [1, 2] });

    const draggableCard = screen.getByText("Write essay").closest("[draggable='true']");
    const dataTransfer = { setData: vi.fn() };
    fireEvent.dragStart(draggableCard, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "7");

    fireEvent.contextMenu(draggableCard);
    fireEvent.click(screen.getByText("edit-task"));

    const input = screen.getByDisplayValue("Write essay");
    fireEvent.change(input, { target: { value: "Updated essay" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdate).toHaveBeenCalledWith(7, { title: "Updated essay" });

    fireEvent.contextMenu(screen.getByText("Write essay").closest("[draggable='true']"));
    fireEvent.click(screen.getByText("delete-task"));
    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it("renders unscheduled cards, filters visible assignees, and exits edit mode on escape", () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    render(
      <UnscheduledCard
        members={members}
        onDelete={onDelete}
        onUpdate={onUpdate}
        task={{
          id: 8,
          title: "Read notes",
          assignees_info: [{ id: 1 }, { id: 9 }],
          priority: null,
        }}
      />,
    );

    expect(screen.getByText("avatars:1")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();

    const unscheduledCard = screen.getByText("Read notes").closest("[draggable='true']");
    const dataTransfer = { setData: vi.fn() };
    fireEvent.dragStart(unscheduledCard, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "8");

    fireEvent.contextMenu(unscheduledCard);
    fireEvent.click(screen.getByText("edit-task"));

    const input = screen.getByDisplayValue("Read notes");
    fireEvent.change(input, { target: { value: "Read summary" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onUpdate).not.toHaveBeenCalledWith(8, { title: "Read summary" });

    const editAgainCard = screen.getByText("Read notes").closest("[draggable='true']");
    fireEvent.contextMenu(editAgainCard);
    fireEvent.click(screen.getAllByText("edit-task")[0]);
    const editedInput = screen.getByDisplayValue("Read summary");
    fireEvent.blur(editedInput);

    expect(onUpdate).toHaveBeenCalledWith(8, { title: "Read summary" });

    fireEvent.contextMenu(editAgainCard);
    fireEvent.click(screen.getAllByText("delete-task")[0]);
    expect(onDelete).toHaveBeenCalledWith(8);
  });
});

describe("TaskTimelineView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders weeks, unscheduled tasks, drag targets, and pagination between pages", () => {
    const handlers = {
      dayMs: 86400000,
      onDragLeave: vi.fn(),
      onDragOver: vi.fn(),
      onDrop: vi.fn(),
      onDropWidget: vi.fn(),
    };
    useDragHandlersMock.mockReturnValue(handlers);
    useTaskTimelineStateMock.mockImplementation((tasks, page) => {
      const weeks = [
        { id: "wk-1", label: "Week 1 (1 Mar - 6 Mar)", startTs: 1000 },
        { id: "wk-2", label: "Week 2 (8 Mar - 13 Mar)", startTs: 2000 },
        { id: "wk-3", label: "Week 3 (15 Mar - 20 Mar)", startTs: 3000 },
        { id: "wk-4", label: "Later", startTs: 4000 },
      ];
      const visible = page === 0 ? weeks.slice(0, 3) : weeks.slice(3);
      return {
        dayMs: 86400000,
        placed: {
          "wk-1": [[], [{ id: 11, title: "Timeline task", priority: "urgent", assignees_info: [] }], [], [], [], []],
          "wk-2": [[], [], [], [], [], []],
          "wk-3": [[], [], [], [], [], []],
          "wk-4": [[], [], [], [], [], []],
        },
        unscheduled: page === 0 ? [{ id: 12, title: "Loose task", assignees_info: [] }] : [],
        visible,
        weeks,
      };
    });

    const { container } = render(
      <TaskTimelineView members={members} onDelete={vi.fn()} onUpdate={vi.fn()} tasks={[]} />,
    );

    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    expect(screen.getByText("Loose task")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("(1 Mar - 6 Mar)")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);

    const widgetList = container.querySelector("[class*='widgetList']");
    fireEvent.dragOver(widgetList);
    expect(widgetList.className).toContain("widgetListDropTarget");
    fireEvent.dragLeave(widgetList);
    expect(widgetList.className).not.toContain("widgetListDropTarget");
    fireEvent.drop(widgetList);
    expect(handlers.onDropWidget).toHaveBeenCalled();

    const timelineCell = container.querySelector("[class*='timelineCell']");
    fireEvent.drop(timelineCell);
    expect(handlers.onDrop).toHaveBeenCalledWith(expect.any(Object), 1000);

    fireEvent.click(container.querySelectorAll("button")[1]);
    expect(screen.getByText("Later")).toBeInTheDocument();
    expect(screen.getByText("All tasks scheduled!")).toBeInTheDocument();
  });
});
