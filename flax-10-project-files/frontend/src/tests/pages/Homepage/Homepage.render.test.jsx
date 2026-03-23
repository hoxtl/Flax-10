import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
vi.mock('../../../components/Common/BackToTop/BackToTop', () => ({ __esModule: true, default: () => <div data-testid="back-to-top" /> }));
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
vi.mock('../../../api/taskApi', () => ({
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

describe('Homepage – render & basic', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders dashboard content and uses displayName from localStorage', () => {
    window.localStorage.setItem('user', JSON.stringify({ first_name: 'Alice' }));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('intelligence-row')).toBeInTheDocument();
    expect(screen.getByTestId('display-name').textContent).toContain('Alice');
  });

  it('renders the shared BackToTop control', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('back-to-top')).toBeTruthy();
  });

  it('falls back when localStorage user JSON is invalid', () => {
    window.localStorage.setItem('user', '{nope');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('display-name').textContent).toContain('anon');
  });

  it('dispatches SET_SELECTED_DATE on mount and refetches events when calendar empty', async () => {
    vi.useFakeTimers();
    const loadEvents = vi.fn();
    mockUseCalendarEvents.mockReturnValue({ loadEvents });
    mockEvents = [];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_SELECTED_DATE' }));
    await vi.advanceTimersByTimeAsync(250);
    expect(loadEvents).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('fetches upcoming deadlines and passes them to widget', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('deadlines-count').textContent).toContain('deadlines:1'));
  });

  it('completes a task via TaskWidgetSlot and shows completion toast path', async () => {
    const { updateTask } = await import('../../../api/taskApi');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('complete-task'));
    await waitFor(() => expect(updateTask).toHaveBeenCalled());
    expect(updateTask).toHaveBeenCalledWith(1, expect.anything());
  });

  it('shows an error toast when task update fails', async () => {
    const svc = await import('../../../api/taskApi');
    svc.updateTask.mockRejectedValueOnce(new Error('fail'));
    mockRefetchTasks.mockResolvedValueOnce([{ id: 1, completed: false }]);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('complete-task'));
    await waitFor(() => expect(screen.getByText("Couldn't update task.")).toBeTruthy());
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText("Couldn't update task.")).toBeNull();
  });

  it('dedupes meal events (e.g., lunch) by day', () => {
    const t1 = new Date('2026-03-09T12:00:00Z').toISOString();
    const t2 = new Date('2026-03-09T12:30:00Z').toISOString();
    mockDayEvents = [{ id: 1, title: 'Lunch', start_time: t1 }, { id: 2, title: 'Lunch', start_time: t2 }];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('mini-timeline').textContent).toContain('events:1');
  });

  it('plays completion chime when work timer hits 0', async () => {
    const { playCompletionChime } = await import('../../../lib/sounds');
    mockTimerActive = true; mockTimeLeft = 5;
    const { rerender } = render(<MemoryRouter><Homepage /></MemoryRouter>);
    mockTimeLeft = 0;
    rerender(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(playCompletionChime).toHaveBeenCalled();
  });

  it('displayName falls back to username when first_name is empty', () => {
    window.localStorage.setItem('user', JSON.stringify({ first_name: '  ', username: 'bob' }));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('display-name').textContent).toContain('bob');
  });
});
