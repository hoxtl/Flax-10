import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GroupTasksTab from '../../../pages/group_work/GroupTasksTab';

vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
}));
vi.mock('../../../context/ToastContext', () => ({
  useToast: () => vi.fn(),
}));

const mockConfirm = vi.fn();

vi.mock('../../../pages/group_work/components/TaskListView', () => ({
  default: ({ tasks }) => (
    <div data-testid="task-list-view">
      {tasks.map(t => <div key={t.id}>{t.title}</div>)}
    </div>
  ),
}));
vi.mock('../../../pages/group_work/components/TaskTimelineView', () => ({
  default: () => <div data-testid="task-timeline-view" />,
}));
vi.mock('../../../pages/group_work/components/TaskBoardView', () => ({
  default: () => <div data-testid="task-board-view" />,
}));
vi.mock('../../../pages/group_work/components/MemberFilter', () => ({
  default: () => <div data-testid="member-filter" />,
}));
vi.mock('../../../pages/group_work/components/AddTaskModal', () => ({
  default: ({ onAdd, onClose }) => (
    <div data-testid="add-task-modal">
      <button onClick={() => { onAdd({ title: 'New Seed Task' }); onClose(); }}>Confirm Add</button>
    </div>
  ),
}));
vi.mock('../../../components/common/animated_dropdown', () => ({
  default: () => <div data-testid="animated-dropdown" />,
}));
vi.mock('lucide-react', () => ({
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

global.fetch = vi.fn();

function renderComponent(props = {}) {
  return render(
    <GroupTasksTab projectId={1} members={mockMembers} onStatsUpdate={vi.fn()} {...props} />
  );
}

describe('GroupTasksTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTasks),
    });
  });

  it('renders loading state initially', () => {
    global.fetch.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading tasks.../i)).toBeTruthy();
  });

  it('renders tasks after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Task One")).toBeTruthy();
    });
    expect(screen.getByText("Task Two")).toBeTruthy();
  });

  it('switches between views', async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Task One"));

    const timelineBtn = screen.getByText(/Timeline/i);
    fireEvent.click(timelineBtn);
    expect(screen.getByTestId('task-timeline-view')).toBeTruthy();
  });

  it('opens add task modal on button click', async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Task One"));

    const addBtn = screen.getByText(/Add new task/i);
    fireEvent.click(addBtn);
    expect(screen.getByTestId('add-task-modal')).toBeTruthy();
  });
});
