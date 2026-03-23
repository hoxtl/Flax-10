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
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

describe('Homepage – tasks, re-plan & misc', () => {
  it('Re-plan button shows when today and triggers handleReplanDay', async () => {
    const { isToday } = await import('../../../components/Calendar/utils/dateUtils');
    const { getAllFreeWindowsToday } = await import('../../../pages/Homepage/utils/index');
    isToday.mockReturnValue(true);
    getAllFreeWindowsToday.mockReturnValue([{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]);
    mockDayEvents = [{ id: 1, title: 'Past', start_time: new Date(Date.now() - 2 * 3600000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString() }];
    mockAllTasks = [{ id: 1, title: 'T', due_date: new Date().toISOString(), completed: false }];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /Re-plan/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Re-plan/ }));
    await waitFor(() => expect(screen.getByText(/Re-planned|No items could fit|Nothing to re-plan|No free windows/)).toBeInTheDocument());
  });

  it('Re-plan button is disabled when no missed or overdue items', async () => {
    const { isToday } = await import('../../../components/Calendar/utils/dateUtils');
    isToday.mockReturnValue(true);
    mockDayEvents = []; mockAllTasks = [];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /Re-plan/ })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Re-plan/ })).toBeDisabled();
  });

  it('Re-plan shows "No free windows" when getAllFreeWindowsToday returns empty', async () => {
    const { isToday } = await import('../../../components/Calendar/utils/dateUtils');
    const { getAllFreeWindowsToday } = await import('../../../pages/Homepage/utils/index');
    isToday.mockReturnValue(true);
    getAllFreeWindowsToday.mockReturnValue([]);
    mockDayEvents = [{ id: 1, title: 'Missed', start_time: new Date(Date.now() - 2 * 3600000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString() }];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Re-plan/ }));
    await waitFor(() => expect(screen.getByText(/No free windows left today/)).toBeInTheDocument());
  });

  it('does not render the top focus banner when a timer session is active', () => {
    mockTimerActive = true;
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.queryByText('Open timer →')).not.toBeInTheDocument();
  });

  it('getTaskCategoryPill returns list name when task has task_list matching list', async () => {
    const mod = await import('../../../api/taskApi');
    mod.fetchTaskLists.mockResolvedValue([{ id: 123, name: 'University' }]);
    // Homepage only fetches task lists when the create task modal is enabled.
    render(<MemoryRouter><Homepage defaultShowCreateTaskModal={true} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('pill').textContent).toContain('University'), { timeout: 2000 });
  });

  it('handleReschedule moves event to next free slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue({ start: new Date(), end: new Date(Date.now() + 25 * 60000) });
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockRemoveEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(mockEditEvent).toHaveBeenCalled());
  });

  it('handleReschedule falls back to tomorrow when no slot and shows toast', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(mockAddEvent).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/re-scheduled for tomorrow/)).toBeInTheDocument());
  });

  it('handleReschedule rollback on editEvent fail', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue({ start: new Date(), end: new Date(Date.now() + 25 * 60000) });
    mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't reschedule. Try again.")).toBeInTheDocument());
  });

  it('getTaskCategoryColor returns sage for academic tag', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('color').textContent).toBe('sage');
  });

  it('getTaskCategoryColor returns flax for personal tag', () => {
    mockGetTag.mockReturnValue({ label: 'personal' });
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('color').textContent).toBe('flax');
  });

  it('getTaskCategoryColor returns flax when no tag and no module', () => {
    mockGetTag.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('color-flax').textContent).toBe('flax');
  });

  it('getTaskCategoryColor returns sage when task has module_code and no tag', () => {
    mockGetTag.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('color-module').textContent).toBe('sage');
  });

  it('getTaskCategoryPill returns module_code when task has module_code and no list or tag', () => {
    mockGetTag.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('pill-module-code').textContent).toBe('XY1');
  });

  it('getTaskCategoryPill returns null when no list, module, or tag', () => {
    mockGetTag.mockReturnValue(null);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    expect(screen.getByTestId('pill-null').textContent).toBe('null');
  });

  it('getTaskCategoryPill returns enrolled module code when task has module_id matching enrolled module', async () => {
    const { getModules, getEnrollments } = await import('../../../api/moduleApi');
    getModules.mockResolvedValue([{ id: 10, module_code: 'AB1', module_name: 'Module Alpha' }]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('pill-module-id')).toBeInTheDocument());
    expect(screen.getByTestId('pill-module-id').textContent).toBe('AB1');
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

  it('onStartFocus navigates to timer with state', () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('start-focus'));
    expect(mockNavigate).toHaveBeenCalledWith('/timer', { state: { fromTaskPlay: true } });
  });

  it('handleRescheduleTomorrow shows error toast when addEvent fails', async () => {
    const { getNextFreeSlotToday } = await import('../../../pages/Homepage/utils/index');
    getNextFreeSlotToday.mockReturnValue(null);
    mockAddEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('reschedule'));
    await waitFor(() => expect(screen.getByText("Couldn't re-schedule. Try again.")).toBeInTheDocument());
  });

  it('Re-plan shows "Nothing to re-plan" when missed items are all routine', async () => {
    const { isToday } = await import('../../../components/Calendar/utils/dateUtils');
    const { isRoutineEvent, getAllFreeWindowsToday } = await import('../../../pages/Homepage/utils/index');
    isToday.mockReturnValue(true);
    isRoutineEvent.mockReturnValue(true);
    getAllFreeWindowsToday.mockReturnValue([{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]);
    const past = new Date(Date.now() - 2 * 3600000);
    mockDayEvents = [{ id: 1, title: 'Routine', start_time: past.toISOString(), end_time: new Date(Date.now() - 3600000).toISOString() }];
    mockAllTasks = [];
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /Re-plan/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Re-plan/ }));
    await waitFor(() => expect(screen.getByText('Nothing to re-plan.')).toBeInTheDocument());
  });

  it('Re-plan shows error toast when editEvent fails', async () => {
    const { isToday } = await import('../../../components/Calendar/utils/dateUtils');
    const { getAllFreeWindowsToday, isRoutineEvent } = await import('../../../pages/Homepage/utils/index');
    isToday.mockReturnValue(true);
    isRoutineEvent.mockReturnValue(false);
    getAllFreeWindowsToday.mockReturnValue([{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]);
    const past = new Date(Date.now() - 2 * 3600000);
    mockDayEvents = [{ id: 1, title: 'Missed', start_time: past.toISOString(), end_time: new Date(Date.now() - 3600000).toISOString() }];
    mockAllTasks = []; mockEditEvent.mockRejectedValueOnce(new Error('fail'));
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Re-plan/ }));
    await waitFor(() => expect(screen.getByText("Couldn't re-plan. Try again.")).toBeInTheDocument());
  });

  it('deadline detail shows link to module by code when only module_code set', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    fireEvent.click(screen.getByText('select-deadline-code-only'));
    await waitFor(() => expect(screen.getByText('Exam')).toBeInTheDocument());
    const link = screen.getByRole('link', { name: /Go to module/ });
    expect(link).toHaveAttribute('href', '/modules?code=XY');
  });
});
