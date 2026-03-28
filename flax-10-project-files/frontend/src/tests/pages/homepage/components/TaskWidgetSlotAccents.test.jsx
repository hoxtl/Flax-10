/*
 * Tests for TaskWidgetSlot context menu actions, accent colours, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as RTL from "@testing-library/react";
const { screen, fireEvent, act } = RTL;
const rtlRender = RTL.render;
import { MemoryRouter } from "react-router-dom";
import { TaskWidgetSlot, getRowAccent } from "../../../../pages/homepage/components/TaskWidgetSlot";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../../pages/tasks/utils/readingListUtils", () => ({
  isReadingList: (list) => list?.isReading === true,
}));

vi.mock("../../../../components/common/inline_title_field/InlineTitleField", () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => (
      <div data-testid="inline-edit">
        {props.isEditing ? (
          <input data-testid="inline-input" defaultValue={props.value} onBlur={(e) => props.onSave(e.target.value)} />
        ) : (
          <span onClick={props.onStart}>{props.value}</span>
        )}
      </div>
    ),
    useInlineEdit: (val, onSave) => {
      const [isEditing, setIsEditing] = React.useState(false);
      return {
        isEditing,
        draft: val,
        setDraft: vi.fn(),
        start: () => setIsEditing(true),
        save: (v) => { onSave(v); setIsEditing(false); },
        cancel: () => setIsEditing(false),
      };
    }
  };
});

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          delete props.initial;
          delete props.animate;
          delete props.exit;
          delete props.transition;
          delete props.variants;
          delete props.layout;
          delete props.whileHover;
          delete props.whileTap;
          return <Tag {...props}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../pages/tasks/components/TaskCard", () => ({
  TaskContextMenu: ({ task, onClose, onEditOpen, onDelete, onEdit }) => (
    <div data-testid="task-context-menu">
      <span>{task?.title}</span>
      <button onClick={onClose}>Close</button>
      <button onClick={onEditOpen}>Edit</button>
      <button onClick={onDelete}>Delete</button>
      {onEdit ? <button onClick={() => onEdit({ title: "Updated title" })}>Inline Edit</button> : null}
    </div>
  ),
}));

const mockStyles = {
  taskWidgetSlotAllDoneWrap: "allDone",
  taskWidgetSlotRoot: "root",
  taskWidgetPlanTomorrowPill: "planTomorrow",
  taskWidgetLink: "link",
};

const defaultProps = {
  styles: mockStyles,
  taskWidgetDueTodayCount: 0,
  taskWidgetItemsOnly: [],
  taskWidgetList: [],
  handleTaskWidgetComplete: vi.fn(),
  taskWidgetRef: { current: null },
  taskLists: [],
  onEditTask: vi.fn(),
  onDeleteTask: vi.fn(),
  onInlineTaskEdit: vi.fn(),
};

function renderTaskWidgetSlot(props = {}) {
  return rtlRender(
    <MemoryRouter>
      <TaskWidgetSlot {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function getTaskRow(title) {
  const checkbox = screen.queryByLabelText(new RegExp(`Complete ${title}`, 'i'));
  if (checkbox) return checkbox.closest("div");
  return screen.getAllByText(title)[0].closest("div");
}

describe("TaskWidgetSlot – context menu and accent colours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onEditTask when context menu Edit is clicked", () => {
    const onEditTask = vi.fn();
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Ctx Task", completed: false }],
      taskWidgetList: [{ id: 1, title: "Ctx Task", completed: false }],
      onEditTask,
    });
    fireEvent.contextMenu(getTaskRow("Ctx Task"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onEditTask).toHaveBeenCalledWith(expect.objectContaining({ id: 1, title: "Ctx Task" }));
  });

  it("calls onDeleteTask when context menu Delete is clicked", async () => {
    const onDeleteTask = vi.fn().mockResolvedValue(undefined);
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Del Task", completed: false }],
      taskWidgetList: [{ id: 1, title: "Del Task", completed: false }],
      onDeleteTask,
    });
    fireEvent.contextMenu(getTaskRow("Del Task"));
    await act(async () => { fireEvent.click(screen.getByText("Delete")); });
    await vi.waitFor(() => expect(onDeleteTask).toHaveBeenCalledWith(expect.objectContaining({ id: 1 })));
    await vi.waitFor(() => expect(screen.queryByTestId("task-context-menu")).toBeNull());
  });

  it("closes context menu when Close is clicked", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "T", completed: false }],
      taskWidgetList: [{ id: 1, title: "T", completed: false }],
    });
    fireEvent.contextMenu(getTaskRow("T"));
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("task-context-menu")).toBeNull();
  });

  it("calls onInlineTaskEdit when context menu Inline Edit is clicked", async () => {
    const onInlineTaskEdit = vi.fn().mockResolvedValue(undefined);
    const task = { id: 1, title: "Edit Me", completed: false };
    rtlRender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskWidgetItemsOnly={[task]} taskWidgetList={[task]} onInlineTaskEdit={onInlineTaskEdit} /></MemoryRouter>);
    fireEvent.contextMenu(getTaskRow("Edit Me"));
    await act(async () => { fireEvent.click(screen.getByText("Inline Edit")); });
    await vi.waitFor(() => expect(onInlineTaskEdit).toHaveBeenCalledWith(expect.anything(), { title: "Updated title" }));
  });

  it("shows Urgent pill for priority urgent", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Urgent task", completed: false, due_date: hoursFromNow(1), priority: "urgent" }],
      taskWidgetList: [{ id: 1, title: "Urgent task", completed: false, due_date: hoursFromNow(1), priority: "urgent" }],
    });
    expect(screen.getByText("Urgent")).toBeTruthy();
  });

  it("shows Neutral accent for low priority tasks", () => {
    const tasks = [
      { id: 0, title: "Lead", completed: false },
      { id: 1, title: "Low", priority: "low", completed: false },
    ];
    renderTaskWidgetSlot({ taskWidgetItemsOnly: tasks, taskWidgetList: tasks });
    expect(getTaskRow("Low").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-neutral)");
  });

  it("shows Warning accent for medium and high priority tasks", () => {
    const lead = { id: 0, title: "Lead", completed: false };
    const med = { id: 4, title: "Med", priority: "medium", completed: false };
    const high = { id: 5, title: "High2", priority: "high", completed: false };
    const { rerender } = renderTaskWidgetSlot({ taskWidgetItemsOnly: [lead, med], taskWidgetList: [lead, med] });
    expect(getTaskRow("Med").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-warning)");
    rerender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskWidgetItemsOnly={[lead, high]} taskWidgetList={[lead, high]} /></MemoryRouter>);
    expect(getTaskRow("High2").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-warning)");
  });

  it("shows Danger accent for urgent, overdue, or lead tasks", () => {
    const tasks = [
      { id: 1, title: "UrgentT", priority: "urgent", completed: false, due_date: hoursFromNow(1) },
      { id: 2, title: "OverdueT", completed: false, due_date: hoursFromNow(-1), taskWidgetStatus: "overdue" },
      { id: 3, title: "LeadT", completed: false },
    ];
    const { rerender } = renderTaskWidgetSlot({ taskWidgetItemsOnly: [tasks[0]], taskWidgetList: [tasks[0]] });
    expect(getTaskRow("UrgentT").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-danger)");
    rerender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskWidgetItemsOnly={[tasks[1]]} taskWidgetList={[tasks[1]]} /></MemoryRouter>);
    expect(getTaskRow("OverdueT").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-danger)");
    renderTaskWidgetSlot({ taskWidgetItemsOnly: [tasks[2]], taskWidgetList: [tasks[2]] });
    expect(getTaskRow("LeadT").style.getPropertyValue("--deadline-row-accent")).toBe("var(--home-urgency-danger)");
  });

  it("hits getRowAccent default parameter branch", () => {
    expect(getRowAccent({ priority: "low" })).toBe("var(--home-urgency-neutral)");
  });

  it("hits non-lead priority branches in getRowAccent", () => {
    expect(getRowAccent({ taskWidgetStatus: "overdue" })).toBe("var(--home-urgency-danger)");
    expect(getRowAccent({ priority: "high" })).toBe("var(--home-urgency-warning)");
    expect(getRowAccent({ priority: "medium" })).toBe("var(--home-urgency-warning)");
    expect(getRowAccent({ priority: "urgent" })).toBe("var(--home-urgency-danger)");
  });

  it("handles reading list tasks correctly", () => {
    const tasks = [{ id: 1, title: "Read", completed: false, task_list: 10 }];
    renderTaskWidgetSlot({
      taskLists: [{ id: 10, name: "Reading", isReading: true }],
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
    });
    expect(getTaskRow("Read")).toBeTruthy();
  });

  it("calls onInlineTaskEdit when task title is edited and saved", async () => {
    const onInlineTaskEdit = vi.fn();
    const task = { id: 1, title: "Old", completed: false };
    rtlRender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskWidgetItemsOnly={[task]} taskWidgetList={[task]} onInlineTaskEdit={onInlineTaskEdit} /></MemoryRouter>);
    await act(async () => { fireEvent.click(screen.getByText("Old")); });
    const input = screen.getByTestId("inline-input");
    await act(async () => {
      fireEvent.change(input, { target: { value: "New" } });
      fireEvent.blur(input);
    });
    expect(onInlineTaskEdit).toHaveBeenCalled();
  });

  it("reading list tasks are not editable inline", () => {
    const task = { id: 1, title: "Read", completed: false, task_list: 10 };
    rtlRender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskLists={[{ id: 10, isReading: true }]}
      taskWidgetItemsOnly={[task]} taskWidgetList={[task]} /></MemoryRouter>);
    expect(screen.getByText("Read")).toBeTruthy();
  });

  it("uses default empty array when taskLists is missing", () => {
    const tasks = [{ id: 1, title: "UniqueT", completed: false, task_list: 10 }];
    const { rerender } = renderTaskWidgetSlot({
      taskLists: null, taskWidgetItemsOnly: tasks, taskWidgetList: tasks,
    });
    fireEvent.contextMenu(getTaskRow("UniqueT"));
    expect(screen.getByTestId("task-context-menu")).toBeTruthy();
    const tasks2 = [{ id: 2, title: "AnotherT", completed: false }];
    rerender(<MemoryRouter><TaskWidgetSlot {...defaultProps} taskLists={undefined} taskWidgetItemsOnly={tasks2} taskWidgetList={tasks2} /></MemoryRouter>);
    expect(screen.getByText("AnotherT")).toBeTruthy();
  });

  it("covers reading list branch in TaskWidgetMenu", () => {
    const task = { id: 1, title: "ReadTask", completed: false, task_list: 5 };
    renderTaskWidgetSlot({
      taskLists: [{ id: 5, name: "Books", isReading: true }],
      taskWidgetItemsOnly: [task], taskWidgetList: [task],
    });
    fireEvent.contextMenu(getTaskRow("ReadTask"));
    expect(screen.getByTestId("task-context-menu")).toBeTruthy();
  });
});
