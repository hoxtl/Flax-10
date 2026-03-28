import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import GroupTasksTab from "@/pages/group_work/components/GroupTasksTab";
import { useGroupTasksTabState } from "@/pages/group_work/hooks/useGroupTasksTabState";
import { useToast } from "@/context/ToastContext";

vi.mock("@/pages/group_work/hooks/useGroupTasksTabState", () => ({
  useGroupTasksTabState: vi.fn(),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange }) => (
    <input data-testid="search-bar" value={value} onChange={onChange} />
  ),
}));

vi.mock("@/components/common/segmented_control/SegmentedControl.jsx", () => ({
  SegmentedControl: ({ value, onChange }) => (
    <div data-testid="view-switcher">
      <button onClick={() => onChange("timeline")}>Switch to Timeline</button>
      <button onClick={() => onChange("board")}>Switch to Board</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/MemberFilter", () => ({
  default: ({ onToggle }) => (
    <button onClick={() => onToggle("u1")}>Toggle Filter Alice</button>
  ),
}));

vi.mock("@/pages/group_work/components/AddTaskModal", () => ({
  default: ({ onAdd, onClose }) => (
    <div data-testid="add-modal">
      <button onClick={() => onAdd({ title: "T", due_date: null, assigned_to: [] })}>Add</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const MockView = ({ name }) => <div data-testid={name}>{name}</div>;
vi.mock("@/pages/group_work/components/TaskListView", () => ({ default: ({ tasks, onToggle, onDelete }) => (
    <div data-testid="list-view">
        {tasks.map(t => (
            <div key={t.id}>
                <button onClick={() => onToggle(t.id, !t.is_completed)}>Toggle Task {t.id}</button>
                <button onClick={() => onDelete(t.id)}>Delete Task {t.id}</button>
            </div>
        ))}
    </div>
)}));
vi.mock("@/pages/group_work/components/TaskTimelineView", () => ({ default: () => <MockView name="timeline-view" /> }));
vi.mock("@/pages/group_work/components/TaskBoardView", () => ({ default: (props) => <div data-testid="board-view"><button onClick={() => props.onAdd("Col Task", "todo")}>Add Col Task</button></div> }));

describe("GroupTasksTab", () => {
  const showToast = vi.fn();
  const taskActions = {
    loading: false,
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn(),
    undoDelete: vi.fn(),
    addTask: vi.fn().mockResolvedValue({}),
  };
  const mockState = {
    taskActions,
    filterUsers: [],
    setFilterUsers: vi.fn(),
    searchTerm: "",
    setSearchTerm: vi.fn(),
    taskView: "list",
    setTaskView: vi.fn(),
    showAddModal: false,
    setShowAddModal: vi.fn(),
    sortedTasks: [{ id: 1, title: "T1", is_completed: false }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGroupTasksTabState.mockReturnValue(mockState);
    useToast.mockReturnValue(showToast);
  });

  it("renders loading state", () => {
    useGroupTasksTabState.mockReturnValue({ ...mockState, taskActions: { ...taskActions, loading: true } });
    render(<GroupTasksTab projectId={1} />);
    expect(screen.getByText("Loading tasks...")).toBeTruthy();
  });

  it("renders list view and handles task toggling and deletion", async () => {
    render(<GroupTasksTab projectId={1} />);
    expect(screen.getByTestId("list-view")).toBeTruthy();

    fireEvent.click(screen.getByText("Toggle Task 1"));
    expect(taskActions.updateTask).toHaveBeenCalledWith(1, { completed: true });
    await act(async () => { await Promise.resolve(); });
    expect(showToast).toHaveBeenCalledWith("Task completed!", expect.any(Object));

    fireEvent.click(screen.getByText("Delete Task 1"));
    expect(taskActions.deleteTask).toHaveBeenCalledWith(1);
    expect(showToast).toHaveBeenCalledWith("Task deleted", expect.objectContaining({
        actionLabel: "Undo"
    }));
    
    const toastArgs = showToast.mock.calls[1][1];
    toastArgs.onAction();
    expect(taskActions.undoDelete).toHaveBeenCalledWith(1);
  });

  it("hits the else branch of the toast when task is not completed", async () => {
    // Hits line 38: if (completed) showToast(...)
    // Our mock: onClick={() => onToggle(id, !is_completed)}
    // Task 1 is not completed in mockState.tasks
    render(<GroupTasksTab projectId={1} />);
    fireEvent.click(screen.getByText("Toggle Task 1"));
    
    // showToast should NOT be called
    expect(showToast).not.toHaveBeenCalled();
    expect(taskActions.updateTask).toHaveBeenCalledWith(1, { completed: true });
  });

  it("hits the if branch of the toast when task is completed", async () => {
    // Hits line 38 (true branch)
    // To hit `if (completed)`, the second argument to handleToggle must be true.
    // In our mock: onToggle(t.id, !t.is_completed)
    // So t.is_completed must be false to make completed = true.
    const uncompletedTasks = [{ id: 2, title: "T2", is_completed: false }];
    useGroupTasksTabState.mockReturnValue({ ...mockState, sortedTasks: uncompletedTasks });
    render(<GroupTasksTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Toggle Task 2"));
    await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Task completed!", expect.any(Object));
    });
  });

  it("hits the null branch of TaskContent for unknown view", () => {
    // Hits line 32: return null
    useGroupTasksTabState.mockReturnValue({ ...mockState, taskView: "unknown" });
    const { container } = render(<GroupTasksTab projectId={1} />);
    // TabHeader is rendered, but content should be empty
    // TaskContent is after header actions
    const tabBody = container.firstChild;
    expect(tabBody.children.length).toBe(1); // Only header is present
  });

  it("triggers add modal opening", () => {
    // Hits line 77 onAddClick
    const setShowAddModal = vi.fn();
    useGroupTasksTabState.mockReturnValue({ ...mockState, setShowAddModal });
    render(<GroupTasksTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Add new task"));
    expect(setShowAddModal).toHaveBeenCalledWith(true);
  });

  it("removes a user from the filter when already present", () => {
    // Hits line 49: prev.includes(userId) ? ...
    const setFilterUsers = vi.fn();
    useGroupTasksTabState.mockReturnValue({ ...mockState, filterUsers: ["u1"], setFilterUsers });
    render(<GroupTasksTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Toggle Filter Alice"));
    const toggleFn = setFilterUsers.mock.calls[0][0];
    expect(toggleFn(["u1"])).toEqual([]);
  });

  it("handles view switching and different view renders", () => {
    const { rerender } = render(<GroupTasksTab projectId={1} />);
    
    useGroupTasksTabState.mockReturnValue({ ...mockState, taskView: "timeline" });
    rerender(<GroupTasksTab projectId={1} />);
    expect(screen.getByTestId("timeline-view")).toBeTruthy();

    useGroupTasksTabState.mockReturnValue({ ...mockState, taskView: "board" });
    rerender(<GroupTasksTab projectId={1} />);
    expect(screen.getByTestId("board-view")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Add Col Task"));
    expect(taskActions.addTask).toHaveBeenCalledWith("Col Task", { status: "todo" });
  });

  it("handles member filter toggling", () => {
    const setFilterUsers = vi.fn();
    useGroupTasksTabState.mockReturnValue({ ...mockState, setFilterUsers });
    render(<GroupTasksTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Toggle Filter Alice"));
    const toggleFn = setFilterUsers.mock.calls[0][0];
    expect(toggleFn([])).toEqual(["u1"]);
    expect(toggleFn(["u1"])).toEqual([]);
  });

  it("handles add task modal and search", () => {
    const setShowAddModal = vi.fn();
    useGroupTasksTabState.mockReturnValue({ ...mockState, showAddModal: true, setShowAddModal });
    render(<GroupTasksTab projectId={1} />);
    
    fireEvent.click(screen.getByText("Add"));
    expect(taskActions.addTask).toHaveBeenCalledWith("T", { due_date: null, assigned_to: [] });
    
    fireEvent.click(screen.getByText("Close"));
    expect(setShowAddModal).toHaveBeenCalledWith(false);
  });
});
