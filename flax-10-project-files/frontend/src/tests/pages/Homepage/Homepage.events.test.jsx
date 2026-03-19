import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../../pages/Homepage/Homepage';

const { mockDispatch, mockOpenModal, mockRemoveEvent, mockAddEvent, mockEditEvent, mockLoadEvents,
  mockRefetchTasks, mockUseCalendarEvents, mockNavigate, mockGetTag } = vi.hoisted(() => ({
  mockDispatch: vi.fn(), mockOpenModal: vi.fn(), mockRemoveEvent: vi.fn(), mockAddEvent: vi.fn(),
  mockEditEvent: vi.fn(), mockLoadEvents: vi.fn(), mockRefetchTasks: vi.fn(),
  mockUseCalendarEvents: vi.fn(), mockNavigate: vi.fn(), mockGetTag: vi.fn(() => ({ label: 'Academic' })),
}));

const TODAY = new Date();
let mockSelectedDate = TODAY, mockEvents = [], mockFilter = 'all';
let mockTimeLeft = 0, mockTimerActive = false, mockTimerMode = 'work';
let mockDayEvents = [], mockDayTasks = [], mockAllTasks = [];

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
  isToday: vi.fn((d) => { const t = new Date(); return d && t.toDateString() === new Date(d).toDateString(); }),
  overlapsDay: vi.fn((s, e, day) => { const ds = new Date(day); ds.setHours(0,0,0,0); const de = new Date(ds); de.setDate(de.getDate()+1); return s < de && e > ds; }),
}));
vi.mock('../../../components/Calendar/utils/eventUtils', () => ({ extractBaseEventId: vi.fn((id) => (typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id)) }));
vi.mock('../../../pages/Homepage/utils/index', () => ({
  formatTime: vi.fn((d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
  isNow: vi.fn(() => false), isRoutineEvent: vi.fn(() => false), isRoutineOrEventTask: vi.fn(() => false),
  getNavigatorContext: vi.fn(() => ({ state: 'gap', nextItem: null, gapMins: 30, overlaps: [], conflictAt: null })),
  getNextFreeSlotToday: vi.fn(() => ({ start: new Date(), end: new Date(Date.now() + 25 * 60000) })),
  getAllFreeWindowsToday: vi.fn(() => [{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]),
}));
vi.mock('../../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents, filter: mockFilter }),
  useCalendarDispatch: () => mockDispatch, useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));
vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: mockAddEvent, editEvent: mockEditEvent }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));
vi.mock('../../../pages/Homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({ dayEvents: mockDayEvents, dayTasks: mockDayTasks, allTasks: mockAllTasks,
    removePendingTask: vi.fn(), refetchTasks: mockRefetchTasks, loading: false }),
}));
vi.mock('../../../context/TagContext', () => ({ useTags: () => ({ getTag: mockGetTag, tags: [{ id: 1, label: 'Routine' }] }) }));
vi.mock('../../../context/TimerContext', () => ({
  useTimerContext: () => ({ setActiveTaskId: vi.fn(), isActive: mockTimerActive, timeLeft: mockTimeLeft,
    task: mockTimerActive ? 'My Task' : null, progress: 0, setIsActive: vi.fn(),
    mode: mockTimerMode, setMode: vi.fn(), setTimeLeft: vi.fn(),
    workTime: 25, breakTime: 5, resetTimer: vi.fn(), setTask: vi.fn() }),
}));
vi.mock('../../../context/TaskCompletionContext', () => ({ useTaskCompletion: () => ({ showCompletionToast: vi.fn() }) }));
vi.mock('../../../context/NotificationContext', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('../../../components/Notifications/hooks/useNotify', () => ({ useNotify: () => vi.fn() }));
vi.mock('../../../components/Modules/hooks/useModuleDisenrollment', () => ({ useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }) }));
vi.mock('../../../context/ConfirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../../../pages/Homepage/components/IntelligenceRow', async () => {
  const { IntelligenceRowMock } = await import('./homepageMocks');
  return { __esModule: true, default: IntelligenceRowMock };
});
vi.mock('../../../pages/Homepage/components/TaskWidgetSlot', async () => {
  const { TaskWidgetSlotMock } = await import('./homepageMocks');
  return { TaskWidgetSlot: TaskWidgetSlotMock };
});
vi.mock('../../../pages/Homepage/components/DeadlinesWidget', async () => {
  const { DeadlinesWidgetMock } = await import('./homepageMocks');
  return { DeadlinesWidget: DeadlinesWidgetMock };
});
vi.mock('../../../pages/Homepage/components/SleepBanner', () => ({ __esModule: true, default: () => <div data-testid="sleep-banner">sleep</div> }));
vi.mock('../../../components/Calendar/EventPopups', () => ({ EventPopups: () => <div data-testid="event-popups" /> }));
vi.mock('../../../components/Pagination/Pagination', () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock('../../../components/Tags/PillFilters', () => ({ __esModule: true, default: () => <div data-testid="pill-filters" /> }));
vi.mock('../../../pages/Tasks/components/TaskCard', async () => {
  const actual = await vi.importActual('../../../pages/Tasks/components/TaskCard');
  const { EditTaskModalMock } = await import('./homepageMocks');
  return { ...actual, EditTaskModal: EditTaskModalMock };
});
vi.mock('../../../pages/Homepage/components', async () => {
  const { MiniTimelineMock } = await import('./homepageMocks');
  return { MiniTimeline: MiniTimelineMock };
});
vi.mock('../../../api/taskService', () => ({
  updateTask: vi.fn().mockResolvedValue({}), createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: 'University' }]),
  createTaskList: vi.fn(), deleteTask: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../pages/Tasks/components/CreateTaskModal', async () => {
  const { CreateTaskModalMock } = await import('./homepageMocks');
  return { __esModule: true, default: CreateTaskModalMock };
});
vi.mock('../../../pages/Tasks/components/CreateListModal', async () => {
  const { CreateListModalMock } = await import('./homepageMocks');
  return { __esModule: true, default: CreateListModalMock };
});
vi.mock('../../../pages/Homepage/components/PlanReadDetailModal', async () => {
  const { PlanReadDetailModalMock } = await import('./homepageMocks');
  return { PlanReadDetailModal: PlanReadDetailModalMock };
});
vi.mock('../../../api/moduleApi', () => ({ getModules: vi.fn().mockResolvedValue([]), getEnrollments: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../api/deadlineApi', () => ({ getUpcomingDeadlines: vi.fn().mockResolvedValue([{ id: 1 }]) }));
vi.mock('../../../lib/completionMessages', () => ({ getCompletionMessage: () => 'Nice', isRoutineTask: () => false }));
vi.mock('../../../lib/sounds', () => ({ playCompletionChime: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockSelectedDate = TODAY; mockEvents = []; mockFilter = 'all';
  mockTimeLeft = 0; mockTimerActive = false; mockTimerMode = 'work';
  mockDayEvents = []; mockDayTasks = []; mockAllTasks = [];
  vi.clearAllMocks();
  mockGetTag.mockReturnValue({ label: 'Academic' });
  mockUseCalendarEvents.mockReturnValue({ loadEvents: mockLoadEvents });
  mockAddEvent.mockResolvedValue(undefined); mockEditEvent.mockResolvedValue(undefined);
  mockRemoveEvent.mockResolvedValue(undefined); mockLoadEvents.mockResolvedValue(undefined);
  mockRefetchTasks.mockResolvedValue(undefined);
  global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

describe('Homepage – overlays & event operations', () => {
  it('opens deadline detail overlay and closes it', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('select-deadline'));
    await waitFor(() => expect(screen.getByText('Essay')).toBeInTheDocument());
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(dialog);
    await waitFor(() => expect(screen.queryByText('Essay')).not.toBeInTheDocument());
  });

  it('opens module pill overlay and closes it', async () => {
    const { getModules, getEnrollments } = await import('../../../api/moduleApi');
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module A', department: 'Dept', description: 'Desc', module_leader: 'Lead' }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('select-module')).toBeInTheDocument());
    fireEvent.click(screen.getByText('select-module'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('AB1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('handleQuickStartGap adds event and shows toast', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('quick-start'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/added to your schedule/)).toBeInTheDocument());
  });

  it('handleQuickStartGap shows error toast on fail', async () => {
    mockAddEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('quick-start'));
    await waitFor(() => expect(screen.getByText("Couldn't add to schedule. Try again.")).toBeInTheDocument());
  });

  it('handleConflictAutoMove shows toast on success', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('conflict-auto-move'));
    await waitFor(() => expect(screen.getByText('Event moved to next available window.')).toBeInTheDocument());
  });

  it('handleConflictAutoMove shows error toast on fail', async () => {
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('conflict-auto-move'));
    await waitFor(() => expect(screen.getByText("Couldn't move event. Try again.")).toBeInTheDocument());
  });

  it('handleConflictPushTomorrow moves event and shows undo', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText(/moved to tomorrow/)).toBeInTheDocument());
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('handleConflictPushTomorrow undo restores event', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText('Undo')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Undo'));
    await waitFor(() => expect(screen.getByText(/Undid move/)).toBeInTheDocument());
  });

  it('handleConflictPushTomorrow shows error on fail', async () => {
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('push-tomorrow'));
    await waitFor(() => expect(screen.getByText("Couldn't move to tomorrow. Try again.")).toBeInTheDocument());
  });

  it('handleTimelineDelete removes event and shows toast', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('timeline-delete'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/deleted/)).toBeInTheDocument());
  });

  it('handleTimelineDelete task event deletes task and refetches', async () => {
    const { deleteTask } = await import('../../../api/taskService');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('timeline-delete-task'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(99));
    await waitFor(() => expect(screen.getByText(/removed from tasks and calendar/)).toBeInTheDocument());
  });

  it('handleTimelineDelete shows error toast on fail', async () => {
    mockRemoveEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('timeline-delete'));
    await waitFor(() => expect(screen.getByText("Couldn't delete this item. Try again.")).toBeInTheDocument());
  });

  it('timeline edit opens event modal', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('timeline-edit'));
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it('card click opens popup', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('card-click'));
    expect(screen.getByTestId('mini-timeline')).toBeInTheDocument();
  });

  it('onToggleComplete toggles completed event ids', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('toggle-complete'));
    expect(screen.getByTestId('mini-timeline')).toBeInTheDocument();
  });

  it('handleTaskToggle calls updateTask and refetchTasks', async () => {
    const { updateTask } = await import('../../../api/taskService');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('task-toggle'));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(1, { completed: true }));
    expect(mockRefetchTasks).toHaveBeenCalled();
  });
});
