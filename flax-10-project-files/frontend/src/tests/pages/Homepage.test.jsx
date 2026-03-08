import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from '../../pages/Homepage/Homepage';

const mockDispatch = vi.fn();
const mockOpenModal = vi.fn();
const mockRemoveEvent = vi.fn();
const mockUseCalendarEvents = vi.fn();

const TODAY = new Date();
let mockSelectedDate = TODAY;
let mockEvents = [];

vi.mock('../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents }),
  useCalendarDispatch: () => mockDispatch,
  useEventModal: () => ({ openModal: mockOpenModal }),
}));

vi.mock('../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent }),
}));

vi.mock('../../pages/Homepage/hooks/useHomeData', () => ({
  useHomeData: () => ({
    dayEvents: [],
    dayTasks: [],
    allTasks: [],
    removePendingTask: vi.fn(),
    refetchTasks: vi.fn(),
  }),
}));

vi.mock('../../context/TagContext', () => ({
  useTags: () => ({ getTag: () => null, tags: [] }),
}));

vi.mock('../../context/TimerContext', () => ({
  useTimerContext: () => ({
    setActiveTaskId: vi.fn(),
    isActive: false,
    timeLeft: 0,
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

vi.mock('../../pages/Homepage/components/IntelligenceRow', () => ({
  __esModule: true,
  default: () => <div data-testid="intelligence-row">Good Morning</div>,
}));

beforeEach(() => {
  mockSelectedDate = TODAY;
  mockEvents = [];
  vi.clearAllMocks();
  mockUseCalendarEvents.mockReturnValue({ loadEvents: vi.fn() });
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

  it('renders dashboard content', () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('intelligence-row')).toBeInTheDocument();
    expect(screen.getByText('Good Morning')).toBeInTheDocument();
  });
});
