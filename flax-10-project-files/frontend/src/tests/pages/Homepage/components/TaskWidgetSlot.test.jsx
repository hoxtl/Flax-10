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
  TaskContextMenu: ({ task, onClose, onEditOpen, onDelete, onEdit }) => (
    <div data-testid="task-context-menu">
      <span>{task?.title}</span>
      <button onClick={onClose}>Close</button>
      <button onClick={onEditOpen}>Edit</button>
      <button onClick={onDelete}>Delete</button>
      {onEdit && <button onClick={() => onEdit({ title: 'Updated title' })}>Inline Edit</button>}
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
  taskWidgetSlotSubtitle: 'subtitle',
  taskWidgetSlotHeaderLeft: 'left',
  taskWidgetFocusBtn: 'focusBtn',
  taskWidgetSummaryRow: 'summaryRow',
  taskWidgetDueTodayPill: 'pill',
  taskWidgetSummaryPill: 'summaryPill',
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
    expect(screen.getByText('No tasks need attention.')).toBeTruthy();
    expect(screen.getByText('Add a task →')).toBeTruthy();
  });

  it('renders all tasks complete card when all done', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Task 1', completed: true },
        { id: 2, title: 'Task 2', completed: true },
      ],
      taskWidgetList: [
        { id: 1, title: 'Task 1', completed: true },
        { id: 2, title: 'Task 2', completed: true },
      ],
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

  it('shows Show more when more than 6 incomplete tasks', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: false,
    }));
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
    });
    expect(screen.getByText(/\+ 2 more/)).toBeTruthy();
  });

  it('toggles showAll when Show more clicked', () => {
    const setShowAllTaskWidgetTasks = vi.fn();
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: false,
    }));
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
      setShowAllTaskWidgetTasks,
    });
    // The link navigates to /tasks?filter=today instead of calling setShowAllTaskWidgetTasks
    expect(screen.getByText(/\+ 2 more/)).toBeTruthy();
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

  // This behaviour was removed in favour of a redirect
  it.skip('shows Show less when showAllTaskWidgetTasks is true', () => {
    const tasks = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: false,
    }));
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: tasks,
      taskWidgetList: tasks,
      showAllTaskWidgetTasks: true,
    });
    expect(screen.getByText('Show less')).toBeTruthy();
  });

  it('shows High urgency pill for high priority task', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'High task', completed: false, priority: 'high' }],
      taskWidgetList: [{ id: 1, title: 'High task', completed: false, priority: 'high' }],
    });
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('renders a compact completed section below active tasks', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [
        { id: 1, title: 'Active task', completed: false },
        { id: 2, title: 'Completed task', completed: true },
      ],
      taskWidgetList: [
        { id: 1, title: 'Active task', completed: false },
        { id: 2, title: 'Completed task', completed: true },
      ],
    });
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('1 done')).toBeTruthy();
    expect(screen.queryByText('Completed task')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /completed/i }));
    expect(screen.getByText('Completed task')).toBeTruthy();
  });

  it('shows Now urgency pill for taskWidgetStatus now', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Now task', completed: false, taskWidgetStatus: 'now' }],
      taskWidgetList: [{ id: 1, title: 'Now task', completed: false, taskWidgetStatus: 'now' }],
    });
    expect(screen.getByText('Now')).toBeTruthy();
  });

  it('calls onEditTask when context menu Edit is clicked', () => {
    const onEditTask = vi.fn();
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Ctx Task', completed: false }],
      taskWidgetList: [{ id: 1, title: 'Ctx Task', completed: false }],
      onEditTask,
    });
    fireEvent.contextMenu(screen.getByText('Ctx Task').closest('li'));
    fireEvent.click(screen.getByText('Edit'));
    expect(onEditTask).toHaveBeenCalledWith(expect.objectContaining({ id: 1, title: 'Ctx Task' }));
  });

  it('calls onDeleteTask when context menu Delete is clicked', async () => {
    const onDeleteTask = vi.fn().mockResolvedValue(undefined);
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Del Task', completed: false }],
      taskWidgetList: [{ id: 1, title: 'Del Task', completed: false }],
      onDeleteTask,
    });
    fireEvent.contextMenu(screen.getByText('Del Task').closest('li'));
    fireEvent.click(screen.getByText('Delete'));
    await vi.waitFor(() => expect(onDeleteTask).toHaveBeenCalledWith(expect.objectContaining({ id: 1 })));
  });

  it('closes context menu when Close is clicked', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'T', completed: false }],
      taskWidgetList: [{ id: 1, title: 'T', completed: false }],
    });
    fireEvent.contextMenu(screen.getByText('T').closest('li'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('task-context-menu')).toBeNull();
  });

  it('all done card shows singular task when one task completed', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Only', completed: true }],
      taskWidgetList: [{ id: 1, title: 'Only', completed: true }],
    });
    expect(screen.getByText(/1 task completed today/)).toBeTruthy();
  });

  it('calls onInlineTaskEdit when context menu Inline Edit is clicked', async () => {
    const onInlineTaskEdit = vi.fn().mockResolvedValue(undefined);
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Edit Me', completed: false }],
      taskWidgetList: [{ id: 1, title: 'Edit Me', completed: false }],
      onInlineTaskEdit,
    });
    fireEvent.contextMenu(screen.getByText('Edit Me').closest('li'));
    fireEvent.click(screen.getByText('Inline Edit'));
    await vi.waitFor(() =>
      expect(onInlineTaskEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), { title: 'Updated title' })
    );
  });

  it('shows Urgent pill for priority urgent', () => {
    renderTaskWidgetSlot({
      taskWidgetItemsOnly: [{ id: 1, title: 'Urgent task', completed: false, priority: 'urgent' }],
      taskWidgetList: [{ id: 1, title: 'Urgent task', completed: false, priority: 'urgent' }],
    });
    expect(screen.getByText('Urgent')).toBeTruthy();
  });
});
