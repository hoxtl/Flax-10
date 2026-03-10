import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaskWidgetSlot } from '../../../../pages/Homepage/components/TaskWidgetSlot';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === 'string' ? tag : 'div';
        return ({ children, ...props }) => {
          const { initial, animate, exit, transition, variants, layout, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../../pages/Tasks/components/TaskCard', () => ({
  TaskContextMenu: ({ task, onClose, onEditOpen, onDelete }) => (
    <div data-testid="task-context-menu">
      <span>{task?.title}</span>
      <button onClick={onClose}>Close</button>
      <button onClick={onEditOpen}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

const mockStyles = {
  taskWidgetSlotAllDoneWrap: 'allDone',
  taskWidgetSlotRoot: 'root',
  taskWidgetSlotHeader: 'header',
  taskWidgetSlotIconWrap: 'iconWrap',
  taskWidgetSlotIcon: 'icon',
  taskWidgetSlotTitleBlock: 'titleBlock',
  taskWidgetSlotTitle: 'title',
  taskWidgetSlotHeaderLeft: 'left',
  taskWidgetDueTodayPill: 'pill',
  taskWidgetTaskList: 'list',
  taskWidgetTaskRow: 'row',
  taskWidgetTaskRowOverdue: 'overdue',
  taskWidgetTaskRowNext: 'next',
  taskWidgetCheckbox: 'checkbox',
  taskWidgetTaskBody: 'body',
  taskWidgetTaskTopRow: 'topRow',
  taskWidgetTaskTitle: 'taskTitle',
  taskWidgetUrgencyPill: 'urgency',
  taskWidgetUrgencyPillUrgent: 'urgent',
  taskWidgetUrgencyPillHigh: 'high',
  taskWidgetUrgencyPillNow: 'now',
  taskWidgetMoreText: 'more',
  taskWidgetLink: 'link',
  taskWidgetPlanTomorrowPill: 'planTomorrow',
};

const defaultProps = {
  styles: mockStyles,
  displayName: 'Tasks',
  isToday: true,
  taskWidgetOverdueCount: 0,
  taskWidgetDueTodayCount: 2,
  taskWidgetSpineCompletedPct: 0,
  taskWidgetItemsOnly: [],
  taskWidgetList: [],
  showAllTaskWidgetTasks: false,
  setShowAllTaskWidgetTasks: vi.fn(),
  getTaskCategoryPill: vi.fn(),
  getTaskCategoryColor: vi.fn(),
  handleTaskWidgetComplete: vi.fn(),
  taskWidgetRef: { current: null },
  hasTimerSession: false,
  onStartFocus: vi.fn(),
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

describe('TaskWidgetSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no tasks', () => {
    renderTaskWidgetSlot();
    expect(screen.getByText('All caught up for today.')).toBeTruthy();
    expect(screen.getByText('Add a task →')).toBeTruthy();
  });

  it('renders all tasks complete card when all done', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Task 1', completed: true },
        { id: 2, title: 'Task 2', completed: true },
      ],
      taskWidgetList: [],
    });
    expect(screen.getByText(/completed today/)).toBeTruthy();
    expect(screen.getByText('Plan tomorrow →')).toBeTruthy();
  });

  it('renders task list with incomplete tasks', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Study math', completed: false },
      ],
      taskWidgetList: [
        { id: 1, title: 'Study math', completed: false },
      ],
    });
    expect(screen.getByText("Today's Tasks")).toBeTruthy();
    expect(screen.getByText('Study math')).toBeTruthy();
    expect(screen.getByText('2 due today')).toBeTruthy();
  });

  it('calls handleTaskWidgetComplete when checkbox clicked', () => {
    const handleTaskWidgetComplete = vi.fn();
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Task A', completed: false },
      ],
      taskWidgetList: [
        { id: 1, title: 'Task A', completed: false },
      ],
      handleTaskWidgetComplete,
    });
    fireEvent.click(screen.getByLabelText('Complete Task A'));
    expect(handleTaskWidgetComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('shows Show more when more than 5 incomplete tasks', () => {
    const tasks = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: false,
    }));
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
    });
    expect(screen.getByText('+ 2 more')).toBeTruthy();
  });

  it('toggles showAll when Show more clicked', () => {
    const setShowAllTaskWidgetTasks = vi.fn();
    const tasks = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: false,
    }));
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
      setShowAllTaskWidgetTasks,
    });
    fireEvent.click(screen.getByText('+ 2 more'));
    expect(setShowAllTaskWidgetTasks).toHaveBeenCalled();
  });

  it('shows urgency pill for overdue task', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Overdue task', completed: false, taskWidgetStatus: 'overdue' },
      ],
      taskWidgetList: [
        { id: 1, title: 'Overdue task', completed: false, taskWidgetStatus: 'overdue' },
      ],
    });
    expect(screen.getByText('Urgent')).toBeTruthy();
  });

  it('shows context menu on right click', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Task', completed: false },
      ],
      taskWidgetList: [
        { id: 1, title: 'Task', completed: false },
      ],
    });
    const row = screen.getByText('Task').closest('li');
    fireEvent.contextMenu(row);
    expect(screen.getByTestId('task-context-menu')).toBeTruthy();
  });
});
