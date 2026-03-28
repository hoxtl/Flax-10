import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../../../pages/homepage/Homepage';

const { mockDispatch, mockOpenModal, mockOpenPopup, mockRemoveEvent, mockAddEvent, mockEditEvent, mockLoadEvents,
  mockRefetchTasks, mockUseCalendarEvents, mockNavigate, mockGetTag } = vi.hoisted(() => ({
  mockDispatch: vi.fn(), mockOpenModal: vi.fn(), mockRemoveEvent: vi.fn(), mockAddEvent: vi.fn(),
  mockEditEvent: vi.fn(), mockLoadEvents: vi.fn(), mockOpenPopup: vi.fn(), mockRefetchTasks: vi.fn(),
  mockUseCalendarEvents: vi.fn(), mockNavigate: vi.fn(), mockGetTag: vi.fn(() => ({ label: 'Academic' })),
}));

const TODAY = new Date();
let mockSelectedDate = TODAY, mockEvents = [], mockFilter = 'all';
let mockTimeLeft = 0, mockTimerActive = false, mockTimerMode = 'work';
let mockDayEvents = [], mockDayTasks = [], mockAllTasks = [];

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
  isToday: vi.fn((d) => { const t = new Date(); return d && t.toDateString() === new Date(d).toDateString(); }),
  overlapsDay: vi.fn((s, e, day) => { const ds = new Date(day); ds.setHours(0,0,0,0); const de = new Date(ds); de.setDate(de.getDate()+1); return s < de && e > ds; }),
}));
vi.mock('../../../../components/calendar/utils/eventUtils', () => ({ extractBaseEventId: vi.fn((id) => (typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id)) }));
vi.mock('../../../../pages/homepage/utils', () => ({
  formatTime: vi.fn((d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
  isNow: vi.fn(() => false), isRoutineEvent: vi.fn(() => false), isRoutineOrEventTask: vi.fn(() => false),
  getNavigatorContext: vi.fn(() => ({ state: 'gap', nextItem: null, gapMins: 30, overlaps: [], conflictAt: null })),
  getNextFreeSlotToday: vi.fn(() => ({ start: new Date(), end: new Date(Date.now() + 25 * 60000) })),
  getAllFreeWindowsToday: vi.fn(() => [{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]),
}));
vi.mock('../../../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents, filter: mockFilter }),
  useCalendarDispatch: () => mockDispatch, useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: mockOpenPopup }),
}));
vi.mock('../../../../components/calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: mockAddEvent, editEvent: mockEditEvent }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));
vi.mock('../../../../pages/homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({ dayEvents: mockDayEvents, dayTasks: mockDayTasks, allTasks: mockAllTasks,
    removePendingTask: vi.fn(), refetchTasks: mockRefetchTasks, loading: false }),
}));
vi.mock('../../../../context/TagContext', () => ({ useTags: () => ({ getTag: mockGetTag, tags: [{ id: 1, label: 'Routine' }] }) }));
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 1, role: 'student', settings: {} }, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() }),
}));
vi.mock('../../../../context/TimerContext', () => ({
  useTimerContext: () => ({ setActiveTaskId: vi.fn(), isActive: mockTimerActive, timeLeft: mockTimeLeft,
    task: mockTimerActive ? 'My Task' : null, progress: 0, setIsActive: vi.fn(),
    mode: mockTimerMode, setMode: vi.fn(), setTimeLeft: vi.fn(),
    workTime: 25, breakTime: 5, resetTimer: vi.fn(), setTask: vi.fn() }),
}));
vi.mock('../../../../context/TaskCompletionContext', () => ({ useTaskCompletion: () => ({ showCompletionToast: vi.fn() }) }));
vi.mock('../../../../context/NotificationContext', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('../../../../components/notifications/hooks/useNotify', () => ({ useNotify: () => vi.fn() }));
vi.mock('../../../../components/modules/hooks/useModuleDisenrollment', () => ({ useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }) }));
vi.mock('../../../../context/ConfirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../../../../pages/homepage/components/IntelligenceRow', async () => {
  const { IntelligenceRowMock } = await import('../homepageMocks');
  return { __esModule: true, default: IntelligenceRowMock };
});
vi.mock('../../../../pages/homepage/components/TaskWidgetSlot', async () => {
  const { TaskWidgetSlotMock } = await import('../homepageMocks');
  return { TaskWidgetSlot: TaskWidgetSlotMock };
});
vi.mock('../../../../pages/homepage/components/DeadlinesWidget', async () => {
  const { DeadlinesWidgetMock } = await import('../homepageMocks');
  return { DeadlinesWidget: DeadlinesWidgetMock };
});
vi.mock('../../../../pages/homepage/components/SleepBanner', () => ({ __esModule: true, default: () => <div data-testid="sleep-banner">sleep</div> }));
vi.mock('../../../../components/calendar/EventPopups', () => ({ EventPopups: () => <div data-testid="event-popups" /> }));
vi.mock('../../../../components/common/back_to_top/BackToTop', () => ({ __esModule: true, default: () => <div data-testid="back-to-top" /> }));
vi.mock('../../../../components/tags/components/PillFilters', () => ({ __esModule: true, default: () => <div data-testid="pill-filters" /> }));
vi.mock('../../../../pages/tasks/components/TaskCard', async () => {
  const actual = await vi.importActual('../../../../pages/tasks/components/TaskCard');
  const { EditTaskModalMock } = await import('../homepageMocks');
  return { ...actual, EditTaskModal: EditTaskModalMock };
});
vi.mock('../../../../pages/homepage/components', async () => {
  const { MiniTimelineMock, HomepageTimelineSectionMock } = await import('../homepageMocks');
  return { MiniTimeline: MiniTimelineMock, HomepageTimelineSection: HomepageTimelineSectionMock };
});
vi.mock('../../../../api/taskApi', () => ({
  updateTask: vi.fn().mockResolvedValue({}), createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: 'University' }]),
  createTaskList: vi.fn(), deleteTask: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../pages/tasks/components/CreateTaskModal', async () => {
  const { CreateTaskModalMock } = await import('../homepageMocks');
  return { __esModule: true, default: CreateTaskModalMock };
});
vi.mock('../../../../pages/tasks/components/CreateListModal', async () => {
  const { CreateListModalMock } = await import('../homepageMocks');
  return { __esModule: true, default: CreateListModalMock };
});
vi.mock('../../../../pages/homepage/components/PlanReadDetailModal', async () => {
  const { PlanReadDetailModalMock } = await import('../homepageMocks');
  return { PlanReadDetailModal: PlanReadDetailModalMock };
});
vi.mock('../../../../api/moduleApi', () => ({ getModules: vi.fn().mockResolvedValue([]), getEnrollments: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../../api/deadlineApi', () => ({ getUpcomingDeadlines: vi.fn().mockResolvedValue([{ id: 1 }]) }));
vi.mock('../../../../lib/completionMessages', () => ({ getCompletionMessage: () => 'Nice', isRoutineTask: () => false }));
vi.mock('../../../../lib/sounds', () => ({ playCompletionChime: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockSelectedDate = TODAY; mockEvents = []; mockFilter = 'all';
  mockTimeLeft = 0; mockTimerActive = false; mockTimerMode = 'work';
  mockDayEvents = []; mockDayTasks = []; mockAllTasks = [];
  vi.clearAllMocks();
  window.localStorage.clear();
  mockGetTag.mockReturnValue({ label: 'Academic' });
  mockUseCalendarEvents.mockReturnValue({ loadEvents: mockLoadEvents });
  mockAddEvent.mockResolvedValue(undefined); mockEditEvent.mockResolvedValue(undefined);
  mockRemoveEvent.mockResolvedValue(undefined); mockLoadEvents.mockResolvedValue(undefined);
  mockRefetchTasks.mockResolvedValue(undefined);
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

describe('Homepage – modals', () => {
  it('EditTaskModal save updates task and closes modal', async () => {
    const { updateTask } = await import('../../../../api/taskApi');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-save'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('EditTaskModal delete deletes task and closes modal', async () => {
    const { deleteTask } = await import('../../../../api/taskApi');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByText('edit-modal-delete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-delete'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('EditTaskModal close clears reschedule task', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-close'));
    await waitFor(() => expect(screen.queryByTestId('edit-task-modal')).not.toBeInTheDocument());
  });

  it('EditTaskModal onSave error does not close modal', async () => {
    const { updateTask } = await import('../../../../api/taskApi');
    updateTask.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-save'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument();
  });

  it('EditTaskModal onDelete error does not close modal', async () => {
    const { deleteTask } = await import('../../../../api/taskApi');
    deleteTask.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('edit-task'));
    await waitFor(() => expect(screen.getByText('edit-modal-delete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('edit-modal-delete'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalled());
    expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument();
  });

  it('CreateTaskModal save creates task and shows toast', async () => {
    const { createTask } = await import('../../../../api/taskApi');
    createTask.mockResolvedValue({ id: 1, title: 'New Task' });
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('create-task-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('create-task-save'));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Task' })));
    await waitFor(() => expect(screen.getByText('Task added')).toBeInTheDocument());
  });

  it('CreateTaskModal save with routine title sets Routine tag', async () => {
    const { createTask } = await import('../../../../api/taskApi');
    createTask.mockResolvedValue({ id: 1, title: 'breakfast' });
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-routine'));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 1 })));
  });

  it('CreateTaskModal save with addToSchedule adds event and shows schedule toast', async () => {
    const { createTask } = await import('../../../../api/taskApi');
    createTask.mockResolvedValue({ id: 1, title: 'Task', description: '', estimated_blocks: 2 });
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-with-schedule'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/added to today's schedule/)).toBeInTheDocument());
  });

  it('CreateTaskModal save error shows toast', async () => {
    const { createTask } = await import('../../../../api/taskApi');
    createTask.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-save'));
    await waitFor(() => expect(screen.getByText("Couldn't add task. Try again.")).toBeInTheDocument());
  });

  it('CreateTaskModal close clears modal and lastCreatedListId', async () => {
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-close'));
    await waitFor(() => expect(screen.queryByTestId('create-task-modal')).not.toBeInTheDocument());
  });

  it('CreateTaskModal onOpenCreateList shows CreateListModal', async () => {
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-open-list'));
    await waitFor(() => expect(screen.getByTestId('create-list-modal')).toBeInTheDocument());
  });

  it('CreateListModal save creates list and closes', async () => {
    const { createTaskList, fetchTaskLists } = await import('../../../../api/taskApi');
    createTaskList.mockResolvedValue({ id: 2, name: 'My List' });
    fetchTaskLists.mockResolvedValue([{ id: 123, name: 'University' }, { id: 2, name: 'My List' }]);
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal /></MemoryRouter>);
    fireEvent.click(screen.getByText('create-task-open-list'));
    await waitFor(() => expect(screen.getByText('create-list-save')).toBeInTheDocument());
    fireEvent.click(screen.getByText('create-list-save'));
    await waitFor(() => expect(createTaskList).toHaveBeenCalledWith({ name: 'My List' }));
    await waitFor(() => expect(screen.queryByTestId('create-list-modal')).not.toBeInTheDocument());
  });

  it('PlanReadDetailModal onClose closes modal', async () => {
    render(<MemoryRouter><Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('plan-read-detail-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByText('plan-read-close'));
    await waitFor(() => expect(screen.queryByTestId('plan-read-detail-modal')).not.toBeInTheDocument());
  });

  it('PlanReadDetailModal onEditTask sets rescheduleTask', async () => {
    render(<MemoryRouter><Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} /></MemoryRouter>);
    fireEvent.click(screen.getByText('plan-read-edit-task'));
    await waitFor(() => expect(screen.getByTestId('edit-task-modal')).toBeInTheDocument());
  });

  it('PlanReadDetailModal onDeleteTask deletes task and refetches', async () => {
    const { deleteTask } = await import('../../../../api/taskApi');
    render(<MemoryRouter><Homepage defaultPlanTimelineReadItem={{ task: { id: 1, title: 'T' } }} /></MemoryRouter>);
    fireEvent.click(screen.getByText('plan-read-delete-task'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(1));
  });

  it('PlanReadDetailModal onEditEvent opens event modal', async () => {
    render(<MemoryRouter><Homepage defaultPlanTimelineReadItem={{ event: { id: 1, title: 'E', tag: 1 } }} /></MemoryRouter>);
    fireEvent.click(screen.getByText('plan-read-edit-event'));
    await waitFor(() => expect(mockOpenModal).toHaveBeenCalled());
  });

  it('PlanReadDetailModal onDeleteEvent calls handleTimelineDelete', async () => {
    render(<MemoryRouter><Homepage defaultPlanTimelineReadItem={{ event: { id: 1, title: 'E' } }} /></MemoryRouter>);
    fireEvent.click(screen.getByText('plan-read-delete-event'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
  });

  it('module pill overlay truncates long description with ellipsis', async () => {
    const { getModules, getEnrollments } = await import('../../../../api/moduleApi');
    const longDesc = 'a'.repeat(150);
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module A', description: longDesc }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('select-module')).toBeInTheDocument());
    fireEvent.click(screen.getByText('select-module'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('AB1')).toBeInTheDocument();
    expect(document.body.textContent).toContain('a'.repeat(120) + '…');
  });
});
