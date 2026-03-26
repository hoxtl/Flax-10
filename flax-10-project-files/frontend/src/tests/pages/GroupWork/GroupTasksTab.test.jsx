import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import GroupTasksTab from "../../../pages/GroupWork/GroupTasksTab";

const toastMock = vi.fn();
const mockConfirm = vi.fn();
const useGroupTasksTabStateMock = vi.fn();

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => mockConfirm,
}));
vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));
vi.mock("../../../pages/GroupWork/useGroupTasksTabState", () => ({
  useGroupTasksTabState: (...args) => useGroupTasksTabStateMock(...args),
}));

vi.mock("../../../pages/GroupWork/components/TaskListView", () => ({
  default: ({ tasks, onToggle, onUpdate, onDelete }) => (
    <div data-testid="task-list-view">
      {tasks.map((t) => <div key={t.id}>{t.title}</div>)}
      {tasks[0] && <button onClick={() => onToggle(tasks[0].id, true)}>Toggle first task</button>}
      {tasks[0] && <button onClick={() => onUpdate(tasks[0].id, { status: "done" })}>Update first task</button>}
      {tasks[0] && <button onClick={() => onDelete(tasks[0].id)}>Delete first task</button>}
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/TaskTimelineView", () => ({
  default: ({ tasks, onToggle }) => (
    <div data-testid="task-timeline-view">
      {tasks[0] && <button onClick={() => onToggle(tasks[0].id, false)}>Toggle timeline task</button>}
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/TaskBoardView", () => ({
  default: ({ onAdd }) => (
    <div data-testid="task-board-view">
      <button onClick={() => onAdd("Board task", "done")}>Add board task</button>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/MemberFilter", () => ({
  default: ({ onToggle, selectedUsers }) => (
    <div data-testid="member-filter">
      <button onClick={() => onToggle(1)}>Toggle member filter</button>
      <span>{selectedUsers.length}</span>
    </div>
  ),
}));

vi.mock("../../../pages/GroupWork/components/AddTaskModal", () => ({
  default: ({ onAdd, onClose }) => (
    <div data-testid="add-task-modal">
      <button onClick={() => { onAdd({ title: "New Seed Task" }); onClose(); }}>Confirm Add</button>
    </div>
  ),
}));

vi.mock("../../../components/common/AnimatedDropdown", () => ({
  default: () => <div data-testid="animated-dropdown" />,
}));

vi.mock("../../../components/common/SegmentedControl/SegmentedControl.jsx", () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div data-testid="segmented-control">
      {options.map((option) => (
        <button key={option.value} onClick={() => onChange(option.value)} aria-pressed={value === option.value}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  List: () => <div data-testid="list-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  Square: () => <div data-testid="square-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

const mockMembers = [
  { user: 1, user_name: "User One" },
  { user: 2, user_name: "User Two" },
];

const mockTasks = [
  { id: 1, title: "Task One", status: "todo", assignees_info: [{ id: 1, user_name: "User One" }] },
  { id: 2, title: "Task Two", status: "in_progress", assignees_info: [{ id: 2, user_name: "User Two" }] },
];

function buildDefaultState(overrides = {}) {
  return {
    taskActions: {
      loading: false,
      updateTask: vi.fn().mockResolvedValue({}),
      deleteTask: vi.fn().mockResolvedValue({}),
      addTask: vi.fn().mockResolvedValue({}),
    },
    filterUsers: [],
    setFilterUsers: vi.fn(),
    taskView: "list",
    setTaskView: vi.fn(),
    showAddModal: false,
    setShowAddModal: vi.fn(),
    sortedTasks: mockTasks,
    ...overrides,
  };
}

function renderComponent(props = {}) {
  return render(
    <GroupTasksTab projectId={1} members={mockMembers} onStatsUpdate={vi.fn()} {...props} />
  );
}

describe("GroupTasksTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastMock.mockReset();
    mockConfirm.mockReset();
    useGroupTasksTabStateMock.mockReturnValue(buildDefaultState());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    useGroupTasksTabStateMock.mockReturnValueOnce(buildDefaultState({
      taskActions: {
        loading: true,
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
        addTask: vi.fn(),
      },
      sortedTasks: [],
    }));
    renderComponent();
    expect(screen.getByText(/Loading tasks.../i)).toBeTruthy();
  });

  it("renders tasks after loading", () => {
    renderComponent();
    expect(screen.getByText("Task One")).toBeTruthy();
    expect(screen.getByText("Task Two")).toBeTruthy();
  });

  it("switches between views", () => {
    const state = buildDefaultState();
    useGroupTasksTabStateMock.mockReturnValue(state);
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));
    expect(state.setTaskView).toHaveBeenCalledWith("timeline");

    fireEvent.click(screen.getByRole("button", { name: "Kanban" }));
    expect(state.setTaskView).toHaveBeenCalledWith("board");
  });

  it("opens add task modal on button click", () => {
    const state = buildDefaultState();
    useGroupTasksTabStateMock.mockReturnValue(state);
    renderComponent();

    fireEvent.click(screen.getByText(/Add new task/i));
    expect(state.setShowAddModal).toHaveBeenCalledWith(true);
  });

  it("wires task actions from list, board, and filter controls", async () => {
    const state = buildDefaultState();
    useGroupTasksTabStateMock.mockReturnValue(state);
    renderComponent();

    fireEvent.click(screen.getByText("Toggle first task"));
    fireEvent.click(screen.getByText("Update first task"));
    fireEvent.click(screen.getByText("Delete first task"));
    fireEvent.click(screen.getByText("Toggle member filter"));

    expect(state.taskActions.updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(state.taskActions.updateTask).toHaveBeenCalledWith(1, { status: "done" });
    expect(state.taskActions.deleteTask).toHaveBeenCalledWith(1);
    expect(state.setFilterUsers).toHaveBeenCalled();
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith("Task completed!", { icon: "🎉", variant: "success" });
      expect(toastMock).toHaveBeenCalledWith("Task deleted", { variant: "error", icon: "🗑️" });
    });
  });

  it("adds a task from the modal and from the board view", () => {
    const state = buildDefaultState({
      taskView: "board",
      showAddModal: true,
    });
    useGroupTasksTabStateMock.mockReturnValue(state);
    renderComponent();

    fireEvent.click(screen.getByText("Add board task"));
    fireEvent.click(screen.getByText("Confirm Add"));

    expect(state.taskActions.addTask).toHaveBeenCalledWith("Board task", { status: "done" });
    expect(state.taskActions.addTask).toHaveBeenCalledWith("New Seed Task", { due_date: undefined, assigned_to: undefined });
    expect(state.setShowAddModal).toHaveBeenCalledWith(false);
  });

  it("returns null for unsupported task views", () => {
    useGroupTasksTabStateMock.mockReturnValue(buildDefaultState({
      taskView: "unknown",
    }));

    const { container } = renderComponent();
    expect(container.querySelector('[data-testid="task-list-view"]')).toBeNull();
    expect(container.querySelector('[data-testid="task-timeline-view"]')).toBeNull();
    expect(container.querySelector('[data-testid="task-board-view"]')).toBeNull();
  });

  it("renders the timeline view directly from state", () => {
    useGroupTasksTabStateMock.mockReturnValue(buildDefaultState({
      taskView: "timeline",
    }));

    renderComponent();
    expect(screen.getByTestId("task-timeline-view")).toBeInTheDocument();
  });
});
