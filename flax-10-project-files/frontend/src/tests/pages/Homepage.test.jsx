import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../pages/Homepage/Homepage';

const mockDispatch = vi.fn();
const mockOpenModal = vi.fn();
const mockRemoveEvent = vi.fn();
const mockUseCalendarEvents = vi.fn();
const mockNavigate = vi.fn();

const TODAY = new Date();
let mockSelectedDate = TODAY;
let mockEvents = [];
let mockFilter = 'all';
let mockTimeLeft = 0;
let mockTimerActive = false;
let mockDayEvents = [];
let mockDayTasks = [];
let mockAllTasks = [];

vi.mock('../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents, filter: mockFilter }),
  useCalendarDispatch: () => mockDispatch,
  useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock('../../components/Calendar/hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: vi.fn(), editEvent: vi.fn() }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock('../../pages/Homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({
    dayEvents: mockDayEvents,
    dayTasks: mockDayTasks,
    allTasks: mockAllTasks,
    removePendingTask: vi.fn(),
    refetchTasks: vi.fn(),
  }),
}));

vi.mock('../../context/TagContext', () => ({
  useTags: () => ({ getTag: () => ({ label: 'Academic' }), tags: [{ id: 1, label: 'Routine' }] }),
}));

vi.mock('../../context/TimerContext', () => ({
  useTimerContext: () => ({
    setActiveTaskId: vi.fn(),
    isActive: mockTimerActive,
    timeLeft: mockTimeLeft,
    task: null,
    progress: 0,
    setIsActive: vi.fn(),
    mode: 'work',
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
      <div data-testid="color">{getTaskCategoryColor?.({ tag: 1 })}</div>
    </div>
  ),
}));

vi.mock('../../pages/Homepage/components/DeadlinesWidget', () => ({
  DeadlinesWidget: ({ deadlines }) => <div data-testid="deadlines-count">deadlines:{(deadlines || []).length}</div>,
}));

vi.mock('../../pages/Homepage/components/SleepBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="sleep-banner">sleep</div>,
}));

vi.mock('../../components/Calendar/EventPopups', () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock('../../components/Tags/PillFilters', () => ({
  __esModule: true,
  default: () => <div data-testid="pill-filters" />,
}));

vi.mock('../../pages/Homepage/components', () => ({
  MiniTimeline: ({ sortedEvents }) => <div data-testid="mini-timeline">events:{(sortedEvents || []).length}</div>,
}));

vi.mock('../../api/taskService', () => ({
  updateTask: vi.fn().mockResolvedValue({}),
  createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: 'University' }]),
  createTaskList: vi.fn(),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../api/moduleApi', () => ({
  getModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/deadlineApi', () => ({
  getUpcomingDeadlines: vi.fn().mockResolvedValue([{ id: 1 }]),
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
  mockDayEvents = [];
  mockDayTasks = [];
  mockAllTasks = [];
  vi.clearAllMocks();
  mockUseCalendarEvents.mockReturnValue({ loadEvents: vi.fn() });
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
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
});
