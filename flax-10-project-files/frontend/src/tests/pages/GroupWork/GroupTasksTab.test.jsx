import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GroupTasksTab from '../../../pages/GroupWork/GroupTasksTab';

// Mock the hook directly
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
}));

const mockConfirm = vi.fn();

// Mock sub-components
vi.mock('../../../pages/GroupWork/components/TaskListView', () => ({
  default: ({ tasks }) => (
    <div data-testid="task-list-view">
      {tasks.map(t => <div key={t.id}>{t.title}</div>)}
    </div>
  ),
}));
vi.mock('../../../pages/GroupWork/components/TaskTimelineView', () => ({
  default: () => <div data-testid="task-timeline-view" />,
}));
vi.mock('../../../pages/GroupWork/components/TaskBoardView', () => ({
  default: () => <div data-testid="task-board-view" />,
}));
vi.mock('../../../components/ui/AnimatedDropdown', () => ({
  default: () => <div data-testid="animated-dropdown" />,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  List: () => <div data-testid="list-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  Square: () => <div data-testid="square-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
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
    expect(timelineBtn.className).toContain('viewToggleBtnActive');
  });

  it('adds a new task', async () => {
    renderComponent();
    await waitFor(() => screen.getByPlaceholderText(/Add a new task.../i));
    
    const input = screen.getByPlaceholderText(/Add a new task.../i);
    const addBtn = screen.getByText(/Add/i);
    
    fireEvent.change(input, { target: { value: "New Seed Task" } });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 3, title: "New Seed Task", status: "todo" }),
    });
    
    fireEvent.click(addBtn);
    
    await waitFor(() => {
      expect(screen.getByText("New Seed Task")).toBeTruthy();
    });
  });
});
