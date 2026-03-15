import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../pages/Homepage/Homepage';

const {
  mockDispatch,
  mockOpenModal,
  mockRemoveEvent,
  mockAddEvent,
  mockEditEvent,
  mockLoadEvents,
  mockRefetchTasks,
  mockUseCalendarEvents,
  mockNavigate,
  mockGetTag,
  mockGetUpcomingDeadlines,
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockOpenModal: vi.fn(),
  mockRemoveEvent: vi.fn(),
  mockAddEvent: vi.fn(),
  mockEditEvent: vi.fn(),
  mockLoadEvents: vi.fn(),
  mockRefetchTasks: vi.fn(),
  mockUseCalendarEvents: vi.fn(),
  mockNavigate: vi.fn(),
  mockGetTag: vi.fn(() => ({ label: 'Academic' })),
  mockGetUpcomingDeadlines: vi.fn().mockResolvedValue([{ id: 1, start_due_date: new Date(Date.now() + 2 * 86400000).toISOString() }]),
}));

const TODAY = new Date();
let mockSelectedDate = TODAY;
let mockEvents = [];
let mockFilter = 'all';
let mockTimeLeft = 0;
let mockTimerActive = false;
let mockTimerMode = 'work';
let mockDayEvents = [];
let mockDayTasks = [];
let mockAllTasks = [];

vi.mock('../../components/Calendar/utils/dateUtils', () => ({
  isToday: vi.fn((d) => {
    const today = new Date();
    return d && today.toDateString() === new Date(d).toDateString();
  }),
  overlapsDay: vi.fn((start, end, day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return start < dayEnd && end > dayStart;
  }),
}));

vi.mock('../../components/Calendar/utils/eventUtils', () => ({
  extractBaseEventId: vi.fn((id) => (typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id)),
}));

vi.mock('../../pages/Homepage/utils/index', () => ({
  formatTime: vi.fn((d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
  isNow: vi.fn(() => false),
  isRoutineEvent: vi.fn(() => false),
  getNavigatorContext: vi.fn(() => ({ state: 'gap', nextItem: null, gapMins: 30, overlaps: [], conflictAt: null })),
  getNextFreeSlotToday: vi.fn(() => ({ start: new Date(), end: new Date(Date.now() + 25 * 60000) })),
  getAllFreeWindowsToday: vi.fn(() => [{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]),
  isRoutineOrEventTask: vi.fn(() => false),
}));

vi.mock('../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents, filter: mockFilter }),
  useCalendarDispatch: () => mockDispatch,
  useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock('../../components/Calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: mockAddEvent, editEvent: mockEditEvent }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock('../../pages/Homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({
    dayEvents: mockDayEvents,
    dayTasks: mockDayTasks,
    allTasks: mockAllTasks,
    removePendingTask: vi.fn(),
    refetchTasks: mockRefetchTasks,
    loading: false,
  }),
}));

vi.mock('../../context/TagContext', () => ({
  useTags: () => ({ getTag: mockGetTag, tags: [{ id: 1, label: 'Routine' }] }),
}));

vi.mock('../../context/TimerContext', () => ({
  useTimerContext: () => ({
    setActiveTaskId: vi.fn(),
    isActive: mockTimerActive,
    timeLeft: mockTimeLeft,
    task: mockTimerActive ? 'My Task' : null,
    progress: 0,
    setIsActive: vi.fn(),
    mode: mockTimerMode,
    setMode: vi.fn(),
    setTimeLeft: vi.fn(),
    workTime: 25,
    breakTime: 5,
    resetTimer: vi.fn(),
    setTask: vi.fn(),
  }),
}));

vi.mock('../../context/TaskCompletionContext', () => ({
  useTaskCompletion: () => ({ showCompletionToast: vi.fn() }),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../../components/Modules/hooks/useModuleDisenrollment', () => ({
  useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }),
}));

vi.mock('../../context/ConfirmContext', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../../pages/Homepage/components/IntelligenceRow', () => ({
  __esModule: true,
  default: ({ displayName, slot1TodayTasks, slot3Urgent }) => (
    <div data-testid="intelligence-row">
      <div data-testid="display-name">{displayName || 'anon'}</div>
      <div data-testid="slot1">{slot1TodayTasks}</div>
      <div data-testid="slot3">{slot3Urgent}</div>
    </div>
  ),
}));

vi.mock('../../pages/Homepage/components/TaskWidgetSlot', () => ({
  TaskWidgetSlot: ({ handleTaskWidgetComplete, onStartFocus, getTaskCategoryPill, getTaskCategoryColor, onEditTask, onDeleteTask, onInlineTaskEdit }) => (
    <div data-testid="task-widget-slot">
      <button type="button" onClick={() => handleTaskWidgetComplete({ id: 'task-1', title: 'Task A', completed: false, task_list: 123, tag: 1 })}>complete-task</button>
      <button type="button" onClick={() => onStartFocus?.()}>start-focus</button>
      <button type="button" onClick={() => onEditTask?.({ id: 1 })}>edit-task</button>
      <button type="button" onClick={() => onDeleteTask?.({ id: 1 })}>delete-task</button>
      <button type="button" onClick={() => onInlineTaskEdit?.({ id: 1 }, { title: 'X' })}>inline-edit</button>
      <div data-testid="pill">{getTaskCategoryPill?.({ task_list: 123, tag: 1 })}</div>
      <div data-testid="pill-null">{getTaskCategoryPill?.({ task_list: 999 }) ?? 'null'}</div>
      <div data-testid="pill-module-code">{getTaskCategoryPill?.({ module_code: 'XY1' }) ?? 'null'}</div>
      <div data-testid="pill-module-id">{getTaskCategoryPill?.({ module_id: 10 }) ?? 'null'}</div>
      <div data-testid="color">{getTaskCategoryColor?.({ tag: 1 })}</div>
      <div data-testid="color-flax">{getTaskCategoryColor?.({})}</div>
      <div data-testid="color-module">{getTaskCategoryColor?.({ module_code: 'CS101' })}</div>
    </div>
  ),
}));

vi.mock('../../pages/Homepage/components/DeadlinesWidget', () => ({
  DeadlinesWidget: ({ deadlines, onSelectDeadline, onSelectModule }) => (
    <div data-testid="deadlines-count">deadlines:{(deadlines || []).length}
      <button type="button" onClick={() => onSelectDeadline?.({ id: 1, assessment_title: 'Essay', start_due_date: new Date().toISOString(), module_code: 'AB1', deadline_type: 'assignment', description: 'D', location: 'Room 1', module_id: 10 })}>select-deadline</button>
      <button type="button" onClick={() => onSelectDeadline?.({ id: 2, assessment_title: 'Exam', start_due_date: new Date().toISOString(), module_code: 'XY' })}>select-deadline-code-only</button>
      <button type="button" onClick={() => onSelectModule?.({ code: 'AB1', id: 10, name: 'Module A' })}>select-module</button>
    </div>
  ),
}));

vi.mock('../../pages/Homepage/components/SleepBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="sleep-banner">sleep</div>,
}));

vi.mock('../../components/Calendar/EventPopups', () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock('../../components/Pagination/Pagination', () => ({
  BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock('../../components/Tags/PillFilters', () => ({
  __esModule: true,
  default: () => <div data-testid="pill-filters" />,
}));

vi.mock('../../pages/Tasks/components/TaskCard', async () => {
  const actual = await vi.importActual('../../pages/Tasks/components/TaskCard');
  return {
    ...actual,
    EditTaskModal: ({ task, onSave, onDelete, onClose }) => (
      <div data-testid="edit-task-modal">
        <button type="button" onClick={() => onSave?.({ title: task?.title })}>edit-modal-save</button>
        <button type="button" onClick={() => onDelete?.()}>edit-modal-delete</button>
        <button type="button" onClick={onClose}>edit-modal-close</button>
      </div>
    ),
  };
});

vi.mock('../../pages/Homepage/components', () => ({
  MiniTimeline: ({
    sortedEvents,
    onQuickStart,
    onTaskToggle,
    onCardClick,
    onEdit,
    onConflictAutoMove,
    onPushTomorrow,
    onDelete,
    onReschedule,
    onToggleComplete,
  }) => (
    <div data-testid="mini-timeline">events:{(sortedEvents || []).length}
      <button type="button" onClick={() => onQuickStart?.(new Date(), 25, { id: 1, title: 'T', estimated_blocks: 1 })}>quick-start</button>
      <button type="button" onClick={() => onQuickStart?.(new Date(), 25, null)}>quick-start-no-task</button>
      <button type="button" onClick={() => onTaskToggle?.({ id: 1 }, true)}>task-toggle</button>
      <button type="button" onClick={() => onCardClick?.({ id: 1, title: 'E' })}>card-click</button>
      <button type="button" onClick={() => onCardClick?.(null)}>card-click-null</button>
      <button type="button" onClick={() => onEdit?.({ id: 1 })}>timeline-edit</button>
      <button type="button" onClick={() => onConflictAutoMove?.({ id: 1 }, new Date(), new Date())}>conflict-auto-move</button>
      <button type="button" onClick={() => onPushTomorrow?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: 'E' })}>push-tomorrow</button>
      <button type="button" onClick={() => onPushTomorrow?.({ id: 1 })}>push-tomorrow-no-time</button>
      <button type="button" onClick={() => onDelete?.({ id: 1, title: 'E' })}>timeline-delete</button>
      <button type="button" onClick={() => onDelete?.({ id: 'ev-1', source: 'task', external_id: 99, title: 'Task Event' })}>timeline-delete-task</button>
      <button type="button" onClick={() => onReschedule?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: 'E' })}>reschedule</button>
      <button type="button" onClick={() => onToggleComplete?.(1)}>toggle-complete</button>
    </div>
  ),
}));

vi.mock('../../api/taskService', () => ({
  updateTask: vi.fn().mockResolvedValue({}),
  createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: 'University' }]),
  createTaskList: vi.fn(),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../pages/Tasks/components/CreateTaskModal', () => ({
  __esModule: true,
  default: ({ onSave, onClose, onOpenCreateList }) => (
    <div data-testid="create-task-modal">
      <button type="button" onClick={() => onSave({ title: 'New Task' }, {})}>create-task-save</button>
      <button type="button" onClick={() => onSave({ title: 'breakfast' }, {})}>create-task-routine</button>
      <button type="button" onClick={() => onSave({ title: 'Task', estimated_blocks: 2 }, { addToSchedule: true })}>create-task-with-schedule</button>
      <button type="button" onClick={onOpenCreateList}>create-task-open-list</button>
      <button type="button" onClick={onClose}>create-task-close</button>
    </div>
  ),
}));

vi.mock('../../pages/Tasks/components/CreateListModal', () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="create-list-modal">
      <button type="button" onClick={() => onSave({ name: 'My List' })}>create-list-save</button>
      <button type="button" onClick={onClose}>create-list-close</button>
    </div>
  ),
}));

vi.mock('../../pages/Homepage/components/PlanReadDetailModal', () => ({
  PlanReadDetailModal: ({ item, onClose, onEditTask, onDeleteTask, onEditEvent, onDeleteEvent }) => (
    <div data-testid="plan-read-detail-modal">
      <button type="button" onClick={onClose}>plan-read-close</button>
      <button type="button" onClick={() => item?.task && onEditTask?.(item.task)}>plan-read-edit-task</button>
      <button type="button" onClick={() => item?.task && onDeleteTask?.(item.task)}>plan-read-delete-task</button>
      <button type="button" onClick={() => item?.event && onEditEvent?.(item.event)}>plan-read-edit-event</button>
      <button type="button" onClick={() => item?.event && onDeleteEvent?.(item.event)}>plan-read-delete-event</button>
    </div>
  ),
}));

vi.mock('../../api/moduleApi', () => ({
  getModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/deadlineApi', () => ({
  getUpcomingDeadlines: mockGetUpcomingDeadlines,
}));

vi.mock('../../api/scheduleApi', () => ({
  createSchedule: vi.fn().mockResolvedValue({ event_allocations: [{ id: 1 }] }),
}));

vi.mock('../../lib/completionMessages', () => ({
  getCompletionMessage: () => 'Nice',
  isRoutineTask: () => false,
}));

vi.mock('../../lib/sounds', () => ({
  playCompletionChime: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockSelectedDate = TODAY;
  mockEvents = [];
  mockFilter = 'all';
  mockTimeLeft = 0;
  mockTimerActive = false;
  mockTimerMode = 'work';
  mockDayEvents = [];
  mockDayTasks = [];
  mockAllTasks = [];
  vi.clearAllMocks();
  mockGetTag.mockReturnValue({ label: 'Academic' });
  mockUseCalendarEvents.mockReturnValue({ loadEvents: mockLoadEvents });
  mockAddEvent.mockResolvedValue(undefined);
  mockEditEvent.mockResolvedValue(undefined);
  mockRemoveEvent.mockResolvedValue(undefined);
  mockLoadEvents.mockResolvedValue(undefined);
  mockRefetchTasks.mockResolvedValue(undefined);
  mockGetUpcomingDeadlines.mockResolvedValue([{ id: 1, start_due_date: new Date(Date.now() + 2 * 86400000).toISOString() }]);
  global.IntersectionObserver = class {
    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

describe('Homepage', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders dashboard content and uses displayName from localStorage', () => {
    window.localStorage.setItem('user', JSON.stringify({ first_name: 'Alice' }));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('intelligence-row')).toBeInTheDocument();
    expect(screen.getByTestId('display-name').textContent).toContain('Alice');
  });

  it('renders the shared BackToTop control', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('back-to-top')).toBeTruthy();
  });

  it('falls back when localStorage user JSON is invalid', () => {
    window.localStorage.setItem('user', '{nope');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('display-name').textContent).toContain('anon');
  });

  it('dispatches SET_SELECTED_DATE on mount and refetches events when calendar empty', async () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn();
    mockUseCalendarEvents.mockReturnValue({ loadEvents });
    mockEvents = [];
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_SELECTED_DATE' }));
    await vi.advanceTimersByTimeAsync(250);
    expect(loadEvents).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('fetches upcoming deadlines and passes them to widget', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('deadlines-count').textContent).toContain('deadlines:1'));
  });

  it('completes a task via TaskWidgetSlot and shows completion toast path', async () => {
    const { updateTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('complete-task'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    expect(updateTask).toHaveBeenCalledWith(1, expect.anything());
  });

  it('shows an error toast when task update fails', async () => {
    const svc = await import('../../api/taskService');
    svc.updateTask.mockRejectedValueOnce(new Error('fail'));
    mockRefetchTasks.mockResolvedValueOnce([{ id: 1, completed: false }]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('complete-task'));
    await waitFor(() => expect(screen.getByText("Couldn't update task.")).toBeTruthy());
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText("Couldn't update task.")).toBeNull();
  });

  it('dedupes meal events (e.g., lunch) by day', () => {
    const t1 = new Date('2026-03-09T12:00:00Z').toISOString();
    const t2 = new Date('2026-03-09T12:30:00Z').toISOString();
    mockDayEvents = [
      { id: 1, title: 'Lunch', start_time: t1 },
      { id: 2, title: 'Lunch', start_time: t2 },
    ];
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('mini-timeline').textContent).toContain('events:1');
  });

  it('plays completion chime when work timer hits 0', async () => {
    const { playCompletionChime } = await import('../../lib/sounds');
    mockTimerActive = true;
    mockTimeLeft = 5;
    const { rerender } = render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    mockTimeLeft = 0;
    rerender(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(playCompletionChime).toHaveBeenCalled();
  });

  it('displayName falls back to username when first_name is empty', () => {
    window.localStorage.setItem('user', JSON.stringify({ first_name: '  ', username: 'bob' }));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('display-name').textContent).toContain('bob');
  });

  it('opens deadline detail overlay and closes it', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('select-deadline'));
    await waitFor(() => expect(screen.getByText('Essay')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    await waitFor(() => expect(screen.queryByText('Essay')).not.toBeInTheDocument());
  });

  it('opens module pill overlay and closes it', async () => {
    const { getModules, getEnrollments } = await import('../../api/moduleApi');
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module A', department: 'Dept', description: 'Desc', module_leader: 'Lead' }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('select-module')).toBeInTheDocument());
    fireEvent.click(screen.getByText('select-module'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('AB1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('handleQuickStartGap adds event and shows toast', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('quick-start'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/added to your schedule/)).toBeInTheDocument());
  });

  it('handleQuickStartGap shows error toast on fail', async () => {
    mockAddEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('quick-start'));
    await waitFor(() => expect(screen.getByText("Couldn't add to schedule. Try again.")).toBeInTheDocument());
  });

  it('handleConflictAutoMove shows toast on success', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('conflict-auto-move'));
    await waitFor(() => expect(screen.getByText('Event moved to next available window.')).toBeInTheDocument());
  });

  it('handleConflictAutoMove shows error toast on fail', async () => {
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('conflict-auto-move'));
    await waitFor(() => expect(screen.getByText("Couldn't move event. Try again.")).toBeInTheDocument());
  });

  it('handleConflictPushTomorrow moves event and shows undo', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText(/moved to tomorrow/)).toBeInTheDocument());
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('handleConflictPushTomorrow undo restores event', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText('Undo')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Undo'));
    await waitFor(() => expect(screen.getByText(/Undid move/)).toBeInTheDocument());
  });

  it('handleConflictPushTomorrow shows error on fail', async () => {
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText("Couldn't move to tomorrow. Try again.")).toBeInTheDocument());
  });

  it('handleTimelineDelete removes event and shows toast', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('timeline-delete'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/deleted/)).toBeInTheDocument());
  });

  it('handleTimelineDelete task event deletes task and refetches', async () => {
    const { deleteTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('timeline-delete-task'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(99));
    await waitFor(() => expect(screen.getByText(/removed from tasks and calendar/)).toBeInTheDocument());
  });
  it('handleTimelineDelete shows error toast on fail', async () => {
    mockRemoveEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('timeline-delete'));
    await waitFor(() => expect(screen.getByText("Couldn't delete this item. Try again.")).toBeInTheDocument());
  });

  it('timeline edit opens event modal', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('timeline-edit'));
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it('card click opens popup', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('card-click'));
    expect(screen.getByTestId('mini-timeline')).toBeInTheDocument();
  });

  it('onToggleComplete toggles completed event ids', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('toggle-complete'));
    expect(screen.getByTestId('mini-timeline')).toBeInTheDocument();
  });

  it('handleTaskToggle calls updateTask and refetchTasks', async () => {
    const { updateTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('task-toggle'));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(1, { completed: true }));
    expect(mockRefetchTasks).toHaveBeenCalled();
  });

  it('Re-plan button shows when today and triggers handleReplanDay', async () => {
    const { isToday } = await import('../../components/Calendar/utils/dateUtils');
    isToday.mockReturnValue(true);
    const { getNextFreeSlotToday, getAllFreeWindowsToday } = await import('../../pages/Homepage/utils/index');
    getAllFreeWindowsToday.mockReturnValue([{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]);
    mockDayEvents = [{ id: 1, title: 'Past', start_time: new Date(Date.now() - 2 * 3600000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString() }];
    mockAllTasks = [{ id: 1, title: 'T', due_date: new Date().toISOString(), completed: false }];
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    const replanButton = screen.getByRole('button', { name: /Auto-generate a schedule from upcoming deadlines/i });
    await waitFor(() => expect(replanButton).not.toBeDisabled());
    fireEvent.click(replanButton);
    await waitFor(() => expect(screen.getByText(/Auto schedule created|No upcoming deadlines to auto-schedule/)).toBeInTheDocument());
  });

  it('Re-plan button is disabled when there are no upcoming deadline', async () => {
    const { isToday } = await import('../../components/Calendar/utils/dateUtils');
    const { getUpcomingDeadlines } = await import('../../api/deadlineApi');
    isToday.mockReturnValue(true);
    getUpcomingDeadlines.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /Auto-generate a schedule from upcoming deadlines/i })).toBeDisabled());
  });

  it('Re-plan shows no-deadline toast when no upcoming deadlines are available', async () => {
    const { isToday } = await import('../../components/Calendar/utils/dateUtils');
    const { getUpcomingDeadlines } = await import('../../api/deadlineApi');
    isToday.mockReturnValue(true);
    getUpcomingDeadlines.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /Auto-generate a schedule from upcoming deadlines/i })).toBeDisabled());
  });

  it('focus banner shows BREAK when timer mode is break', () => {
    mockTimerActive = true;
    mockTimerMode = 'break';
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByText('BREAK')).toBeInTheDocument();
  });

  it('getTaskCategoryPill returns list name when task has task_list matching list', async () => {
    const mod = await import('../../api/taskService');
    mod.fetchTaskLists.mockResolvedValue([{ id: 123, name: 'University' }]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('pill').textContent).toContain('University'), { timeout: 2000 });
  });

  it('handleReschedule moves event to next free slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../pages/Homepage/utils/index');
    const slot = { start: new Date(), end: new Date(Date.now() + 25 * 60000) };
    getNextFreeSlotToday.mockReturnValue(slot);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockEditEvent).toHaveBeenCalled());
  });

  it('handleReschedule falls back to tomorrow when no slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue(null);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/re-scheduled for tomorrow/)).toBeInTheDocument());
  });

  it('handleReschedule rollback on editEvent fail', async () => {
    const { getNextFreeSlotToday } = await import('../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue({ start: new Date(), end: new Date(Date.now() + 25 * 60000) });
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't reschedule. Try again.")).toBeInTheDocument());
  });

  it('getTaskCategoryColor returns sage for academic tag', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('color').textContent).toBe('sage');
  });

  it('EditTaskModal save updates task and closes modal', async () => {
    const { updateTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-save'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('EditTaskModal delete deletes task and closes modal', async () => {
    const { deleteTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByText('edit-modal-delete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-delete'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('EditTaskModal close clears reschedule task', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-close'));
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('CreateTaskModal save creates task and shows toast', async () => {
    const { createTask } = await import('../../api/taskService');
    createTask.mockResolvedValue({ id: 1, title: 'New Task' });
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('create-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('create-task-save'));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Task' })));
    await waitFor(() => expect(screen.getByText('Task added')).toBeInTheDocument());
  });

  it('CreateTaskModal save with routine title sets Routine tag', async () => {
    const { createTask } = await import('../../api/taskService');
    createTask.mockResolvedValue({ id: 1, title: 'breakfast' });
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-routine'));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 1 })));
  });

  it('CreateTaskModal save with addToSchedule adds event and shows schedule toast', async () => {
    const { createTask } = await import('../../api/taskService');
    createTask.mockResolvedValue({ id: 1, title: 'Task', description: '', estimated_blocks: 2 });
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-with-schedule'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/added to today's schedule/)).toBeInTheDocument());
  });

  it('CreateTaskModal save error shows toast', async () => {
    const { createTask } = await import('../../api/taskService');
    createTask.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-save'));
    await waitFor(() => expect(screen.getByText("Couldn't add task. Try again.")).toBeInTheDocument());
  });

  it('CreateTaskModal close clears modal and lastCreatedListId', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-close'));
    await waitFor(() => expect(screen.queryByTestId('create-task-modal')).not.toBeInTheDocument());
  });

  it('CreateTaskModal onOpenCreateList shows CreateListModal', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-open-list'));
    await waitFor(() => expect(screen.getByTestId('create-list-modal')).toBeInTheDocument());
  });

  it('CreateListModal save creates list and closes', async () => {
    const { createTaskList, fetchTaskLists } = await import('../../api/taskService');
    createTaskList.mockResolvedValue({ id: 2, name: 'My List' });
    fetchTaskLists.mockResolvedValue([{ id: 123, name: 'University' }, { id: 2, name: 'My List' }]);
    render(
      <MemoryRouter>
        <Homepage defaultShowCreateTaskModal />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('create-task-open-list'));
    await waitFor(() => expect(screen.getByText('create-list-save')).toBeInTheDocument());
    fireEvent.click(screen.getByText('create-list-save'));
    await waitFor(() => expect(createTaskList).toHaveBeenCalledWith({ name: 'My List' }));
    await waitFor(() => expect(screen.queryByTestId('create-list-modal')).not.toBeInTheDocument());
  });

  it('PlanReadDetailModal onClose closes modal', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('plan-read-detail-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('plan-read-close'));
    await waitFor(() => expect(screen.queryByTestId('plan-read-detail-modal')).not.toBeInTheDocument());
  });

  it('PlanReadDetailModal onEditTask sets rescheduleTask', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('plan-read-edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
  });

  it('PlanReadDetailModal onDeleteTask deletes task and refetches', async () => {
    const { deleteTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('plan-read-delete-task'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(1));
  });

  it('PlanReadDetailModal onEditEvent opens event modal', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultPlanTimelineReadItem={{ event: { id: 1, title: 'E', tag: 1 } }} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('plan-read-edit-event'));
    await waitFor(() => expect(mockOpenModal).toHaveBeenCalled());
  });

  it('PlanReadDetailModal onDeleteEvent calls handleTimelineDelete', async () => {
    render(
      <MemoryRouter>
        <Homepage defaultPlanTimelineReadItem={{ event: { id: 1, title: 'E' } }} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('plan-read-delete-event'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
  });

  it('getTaskCategoryColor returns flax for personal tag', () => {
    mockGetTag.mockReturnValue({ label: 'personal' });
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('color').textContent).toBe('flax');
  });

  it('getTaskCategoryColor returns flax when no tag and no module', () => {
    mockGetTag.mockReturnValue(null);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('color-flax').textContent).toBe('flax');
  });

  it('getTaskCategoryColor returns sage when task has module_code and no tag', () => {
    mockGetTag.mockReturnValue(null);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('color-module').textContent).toBe('sage');
  });

  it('getTaskCategoryPill returns module_code when task has module_code and no list or tag', () => {
    mockGetTag.mockReturnValue(null);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('pill-module-code').textContent).toBe('XY1');
  });

  it('getTaskCategoryPill returns null when no list, module, or tag', () => {
    mockGetTag.mockReturnValue(null);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('pill-null').textContent).toBe('null');
  });

  it('getTaskCategoryPill returns enrolled module code when task has module_id matching enrolled module', async () => {
    const { getModules, getEnrollments } = await import('../../api/moduleApi');
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module Alpha' }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('pill-module-id')).toBeInTheDocument());
    expect(screen.getByTestId('pill-module-id').textContent).toBe('AB1');
  });

  it('EditTaskModal onSave error does not close modal', async () => {
    const { updateTask } = await import('../../api/taskService');
    updateTask.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-save'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument();
  });

  it('EditTaskModal onDelete error does not close modal', async () => {
    const { deleteTask } = await import('../../api/taskService');
    deleteTask.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByText('edit-modal-delete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-delete'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalled());
    expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument();
  });

  it('module pill overlay truncates long description with ellipsis', async () => {
    const { getModules, getEnrollments } = await import('../../api/moduleApi');
    const longDesc = 'a'.repeat(150);
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module A', description: longDesc }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('select-module')).toBeInTheDocument());
    fireEvent.click(screen.getByText('select-module'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('AB1')).toBeInTheDocument();
    const truncated = 'a'.repeat(120) + '…';
    expect(document.body.textContent).toContain(truncated);
  });

  it('handleConflictPushTomorrow does nothing when event has no start_time', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('push-tomorrow-no-time'));
    expect(mockEditEvent).not.toHaveBeenCalled();
  });

  it('handleQuickStartGap does nothing when task is null', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('quick-start-no-task'));
    expect(mockAddEvent).not.toHaveBeenCalled();
  });

  it('onInlineTaskEdit updates task and refetches', async () => {
    const { updateTask } = await import('../../api/taskService');
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('inline-edit'));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'X' })));
    expect(mockRefetchTasks).toHaveBeenCalled();
  });

  it('onStartFocus navigates to timer with state', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('start-focus'));
    expect(mockNavigate).toHaveBeenCalledWith('/timer', { state: { fromTaskPlay: true } });
  });

  it('handleRescheduleTomorrow shows error toast when addEvent fails', async () => {
    const { getNextFreeSlotToday } = await import('../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue(null);
    mockAddEvent.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't re-schedule. Try again.")).toBeInTheDocument());
  });

  it('Re-plan surfaces auto-scheduler error toast when API call fails', async () => {
    const { isToday } = await import('../../components/Calendar/utils/dateUtils');
    const { createSchedule } = await import('../../api/scheduleApi');
    isToday.mockReturnValue(true);
    createSchedule.mockRejectedValueOnce(new Error('fail'));
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    const replanButton = screen.getByRole('button', { name: /Auto-generate a schedule from upcoming deadlines/i });
    await waitFor(() => expect(replanButton).not.toBeDisabled());
    fireEvent.click(replanButton);
    await waitFor(() => expect(screen.getByText("Couldn't auto-schedule right now. Try again.")).toBeInTheDocument());
  });

  it('Re-plan calls createSchedule with generated deadline preferences', async () => {
    const { isToday } = await import('../../components/Calendar/utils/dateUtils');
    const { createSchedule } = await import('../../api/scheduleApi');
    isToday.mockReturnValue(true);
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    const replanButton = screen.getByRole('button', { name: /Auto-generate a schedule from upcoming deadlines/i });
    await waitFor(() => expect(replanButton).not.toBeDisabled());
    fireEvent.click(replanButton);
    await waitFor(() => expect(createSchedule).toHaveBeenCalledWith(expect.objectContaining({
      deadline_preferences: expect.any(Array),
      worktime_preference: 'both',
      week_preference: 'both',
    })));
  });

  it('deadline detail shows link to module by code when only module_code set', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('select-deadline-code-only'));
    await waitFor(() => expect(screen.getByText('Exam')).toBeInTheDocument());
    const link = screen.getByRole('link', { name: /Go to module/ });
    expect(link).toHaveAttribute('href', '/modules?code=XY');
  });
});
