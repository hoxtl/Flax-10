import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskWidgetSlot } from "../../../../pages/Homepage/components/TaskWidgetSlot";

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

vi.mock("../../../../pages/Tasks/components/TaskCard", () => ({
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
  return render(
    <MemoryRouter>
      <TaskWidgetSlot {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function getTaskRow(title) {
  return screen.getByLabelText(`Complete ${title}`).closest("div");
}

describe("TaskWidgetSlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no tasks", () => {
    renderTaskWidgetSlot();
    expect(screen.getByText("No tasks need attention.")).toBeTruthy();
    expect(screen.getByText(/Add a task/i)).toBeTruthy();
  });

  it("renders all tasks complete card when all done", () => {
    const completedTasks = [
      { id: 1, title: "Task 1", completed: true },
      { id: 2, title: "Task 2", completed: true },
    ];

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: completedTasks,
      taskWidgetList: completedTasks,
    });

    expect(screen.getByText(/2 tasks completed today/i)).toBeTruthy();
    expect(screen.getByText(/Plan tomorrow/i)).toBeTruthy();
  });

  it("renders task list with incomplete tasks", () => {
    renderTaskWidgetSlot({
      taskWidgetDueTodayCount: 1,
      taskWidgetItemsOnly: [{ id: 1, title: "Study math", completed: false, due_date: hoursFromNow(1) }],
      taskWidgetList: [{ id: 1, title: "Study math", completed: false, due_date: hoursFromNow(1) }],
    });

    expect(screen.getByText("Today's Tasks")).toBeTruthy();
    expect(screen.getByText("Study math")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to all tasks" })).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("calls handleTaskWidgetComplete when checkbox clicked", () => {
    const handleTaskWidgetComplete = vi.fn();

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Task A", completed: false }],
      taskWidgetList: [{ id: 1, title: "Task A", completed: false }],
      handleTaskWidgetComplete,
    });

    fireEvent.click(screen.getByLabelText("Complete Task A"));
    expect(handleTaskWidgetComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("shows Show more when more than 6 incomplete tasks", () => {
    const tasks = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      title: `Task ${index + 1}`,
      completed: false,
    }));

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
    });
    expect(screen.getByRole("button", { name: /\+ 1 more/i })).toBeTruthy();
  });

  it("expands hidden tasks when Show more is clicked", () => {
    const tasks = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      title: `Task ${index + 1}`,
      completed: false,
    }));

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
    });
    expect(screen.queryByText("Task 7")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /\+ 1 more/i }));
    expect(screen.getByText("Task 7")).toBeTruthy();
    expect(screen.getByRole("button", { name: /show less/i })).toBeTruthy();
  });

  it("shows an overdue countdown for overdue tasks", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Overdue task", completed: false, due_date: hoursFromNow(-1), taskWidgetStatus: "overdue" }],
      taskWidgetList: [{ id: 1, title: "Overdue task", completed: false, due_date: hoursFromNow(-1), taskWidgetStatus: "overdue" }],
    });

    expect(screen.getByText("1d overdue")).toBeTruthy();
  });

  it("shows context menu on right click", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Task", completed: false }],
      taskWidgetList: [{ id: 1, title: "Task", completed: false }],
    });

    fireEvent.contextMenu(getTaskRow("Task"));
    expect(screen.getByTestId("task-context-menu")).toBeTruthy();
  });

  it("shows High urgency pill for high priority task", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "High task", completed: false, due_date: hoursFromNow(1), priority: "high" }],
      taskWidgetList: [{ id: 1, title: "High task", completed: false, due_date: hoursFromNow(1), priority: "high" }],
    });

    expect(screen.getByText("High")).toBeTruthy();
  });

  it("renders a compact completed section below active tasks", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: "Active task", completed: false },
        { id: 2, title: "Completed task", completed: true },
      ],
      taskWidgetList: [
        { id: 1, title: "Active task", completed: false },
        { id: 2, title: "Completed task", completed: true },
      ],
    });

    expect(screen.getByRole("button", { name: /\+ 1 completed/i })).toBeTruthy();
    expect(screen.queryByText("Completed task")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /\+ 1 completed/i }));
    expect(screen.getByText("Completed task")).toBeTruthy();
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
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });
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

  it("all done card shows singular task when one task completed", () => {
    const completedTask = [{ id: 1, title: "Only", completed: true }];

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: completedTask,
      taskWidgetList: completedTask,
    });

    expect(screen.getByText(/1 task completed today/i)).toBeTruthy();
  });

  it("calls onInlineTaskEdit when context menu Inline Edit is clicked", async () => {
    const onInlineTaskEdit = vi.fn().mockResolvedValue(undefined);

    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Edit Me", completed: false }],
      taskWidgetList: [{ id: 1, title: "Edit Me", completed: false }],
      onInlineTaskEdit,
    });

    fireEvent.contextMenu(getTaskRow("Edit Me"));
    fireEvent.click(screen.getByText("Inline Edit"));
    await vi.waitFor(() =>
      expect(onInlineTaskEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), { title: "Updated title" })
    );
  });

  it("shows Urgent pill for priority urgent", () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: "Urgent task", completed: false, due_date: hoursFromNow(1), priority: "urgent" }],
      taskWidgetList: [{ id: 1, title: "Urgent task", completed: false, due_date: hoursFromNow(1), priority: "urgent" }],
    });

    expect(screen.getByText("Urgent")).toBeTruthy();
  });
});
