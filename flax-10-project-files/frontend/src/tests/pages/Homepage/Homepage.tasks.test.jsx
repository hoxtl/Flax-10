import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../../pages/homepage/Homepage';

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

vi.mock('../../../components/calendar/utils/dateUtils', () => ({
  isToday: vi.fn((d) => { const t = new Date(); return d && t.toDateString() === new Date(d).toDateString(); }),
  overlapsDay: vi.fn((s, e, day) => { const ds = new Date(day); ds.setHours(0,0,0,0); const de = new Date(ds); de.setDate(de.getDate()+1); return s < de && e > ds; }),
}));
vi.mock('../../../components/calendar/utils/eventUtils', () => ({ extractBaseEventId: vi.fn((id) => (typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id)) }));
vi.mock('../../../pages/homepage/utils', () => ({
  formatTime: vi.fn((d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
  isNow: vi.fn(() => false), isRoutineEvent: vi.fn(() => false), isRoutineOrEventTask: vi.fn(() => false),
  getNavigatorContext: vi.fn(() => ({ state: 'gap', nextItem: null, gapMins: 30, overlaps: [], conflictAt: null })),
  getNextFreeSlotToday: vi.fn(() => ({ start: new Date(), end: new Date(Date.now() + 25 * 60000) })),
  getAllFreeWindowsToday: vi.fn(() => [{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]),
}));
vi.mock('../../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents, filter: mockFilter }),
  useCalendarDispatch: () => mockDispatch, useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: mockOpenPopup }),
}));
vi.mock('../../../components/calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: mockAddEvent, editEvent: mockEditEvent }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));
vi.mock('../../../pages/homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({ dayEvents: mockDayEvents, dayTasks: mockDayTasks, allTasks: mockAllTasks,
    removePendingTask: vi.fn(), refetchTasks: mockRefetchTasks, loading: false }),
}));
vi.mock('../../../context/TagContext', () => ({ useTags: () => ({ getTag: mockGetTag, tags: [{ id: 1, label: 'Routine' }] }) }));
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 1, role: 'student', settings: {} }, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() }),
}));
vi.mock('../../../context/TimerContext', () => ({
  useTimerContext: () => ({ setActiveTaskId: vi.fn(), isActive: mockTimerActive, timeLeft: mockTimeLeft,
    task: mockTimerActive ? 'My Task' : null, progress: 0, setIsActive: vi.fn(),
    mode: mockTimerMode, setMode: vi.fn(), setTimeLeft: vi.fn(),
    workTime: 25, breakTime: 5, resetTimer: vi.fn(), setTask: vi.fn() }),
}));
vi.mock('../../../context/TaskCompletionContext', () => ({ useTaskCompletion: () => ({ showCompletionToast: vi.fn() }) }));
vi.mock('../../../context/NotificationContext', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('../../../components/notifications/hooks/useNotify', () => ({ useNotify: () => vi.fn() }));
vi.mock('../../../components/modules/hooks/useModuleDisenrollment', () => ({ useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }) }));
vi.mock('../../../context/ConfirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../../../pages/homepage/components/IntelligenceRow', async () => {
  const { IntelligenceRowMock } = await import('./homepageMocks');
  return { __esModule: true, default: IntelligenceRowMock };
});
vi.mock('../../../pages/homepage/components/TaskWidgetSlot', async () => {
  const { TaskWidgetSlotMock } = await import('./homepageMocks');
  return { TaskWidgetSlot: TaskWidgetSlotMock };
});
vi.mock('../../../pages/homepage/components/DeadlinesWidget', async () => {
  const { DeadlinesWidgetMock } = await import('./homepageMocks');
  return { DeadlinesWidget: DeadlinesWidgetMock };
});
vi.mock('../../../pages/homepage/components/SleepBanner', () => ({ __esModule: true, default: () => <div data-testid="sleep-banner">sleep</div> }));
vi.mock('../../../components/calendar/EventPopups', () => ({ EventPopups: () => <div data-testid="event-popups" /> }));
vi.mock('../../../components/common/back_to_top/BackToTop', () => ({ __esModule: true, default: () => <div data-testid="back-to-top" /> }));
vi.mock('../../../components/Tags/pill_filters', () => ({ __esModule: true, default: () => <div data-testid="pill-filters" /> }));
vi.mock('../../../pages/tasks/components/TaskCard', async () => {
  const actual = await vi.importActual('../../../pages/Tasks/components/TaskCard');
  const { EditTaskModalMock } = await import('./homepageMocks');
  return { ...actual, EditTaskModal: EditTaskModalMock };
});
vi.mock('../../../pages/homepage/components', async () => {
  const { MiniTimelineMock, HomepageTimelineSectionMock } = await import('./homepageMocks');
  return { MiniTimeline: MiniTimelineMock, HomepageTimelineSection: HomepageTimelineSectionMock };
});
vi.mock('../../../api/taskApi', () => ({
  updateTask: vi.fn().mockResolvedValue({}), createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: 'University' }]),
  createTaskList: vi.fn(), deleteTask: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../pages/tasks/components/CreateTaskModal', async () => {
  const { CreateTaskModalMock } = await import('./homepageMocks');
  return { __esModule: true, default: CreateTaskModalMock };
});
vi.mock('../../../pages/tasks/components/CreateListModal', async () => {
  const { CreateListModalMock } = await import('./homepageMocks');
  return { __esModule: true, default: CreateListModalMock };
});
vi.mock('../../../pages/homepage/components/PlanReadDetailModal', async () => {
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
  window.localStorage.clear();
  mockGetTag.mockReturnValue({ label: 'Academic' });
  mockUseCalendarEvents.mockReturnValue({ loadEvents: mockLoadEvents });
  mockAddEvent.mockResolvedValue(undefined); mockEditEvent.mockResolvedValue(undefined);
  mockRemoveEvent.mockResolvedValue(undefined); mockLoadEvents.mockResolvedValue(undefined);
  mockRefetchTasks.mockResolvedValue(undefined);
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

describe('Homepage – tasks, re-plan & misc', () => {
  it('handleReschedule moves event to next free slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/homepage/utils');
    getNextFreeSlotToday.mockReturnValue({ start: new Date(), end: new Date(Date.now() + 25 * 60000) });
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockEditEvent).toHaveBeenCalled());
  });

  it('handleReschedule falls back to tomorrow when no slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/homepage/utils');
    getNextFreeSlotToday.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/re-scheduled for tomorrow/)).toBeInTheDocument());
  });

  it('handleReschedule rollback on editEvent fail', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/homepage/utils');
    getNextFreeSlotToday.mockReturnValue({ start: new Date(), end: new Date(Date.now() + 25 * 60000) });
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't reschedule. Try again.")).toBeInTheDocument());
  });

  it('handleConflictPushTomorrow does nothing when event has no start_time', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('push-tomorrow-no-time'));
    expect(mockEditEvent).not.toHaveBeenCalled();
  });

  it('handleQuickStartGap does nothing when task is null', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('quick-start-no-task'));
    expect(mockAddEvent).not.toHaveBeenCalled();
  });

  it('onInlineTaskEdit updates task and refetches', async () => {
    const { updateTask } = await import('../../../api/taskApi');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('inline-edit'));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'X' })));
    expect(mockRefetchTasks).toHaveBeenCalled();
  });

  it('delete-task removes the task and refetches tasks', async () => {
    const { deleteTask } = await import('../../../api/taskApi');
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('delete-task'));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(1));
    expect(mockRefetchTasks).toHaveBeenCalled();
  });

  it('handleRescheduleTomorrow shows error toast when addEvent fails', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/homepage/utils');
    getNextFreeSlotToday.mockReturnValue(null);
    mockAddEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't re-schedule. Try again.")).toBeInTheDocument());
  });

  it('deadline detail shows link to module by code when only module_code set', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('select-deadline-code-only'));
    await waitFor(() => expect(screen.getByText('Exam')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Go to module/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/modules?code=XY');
  });
});
