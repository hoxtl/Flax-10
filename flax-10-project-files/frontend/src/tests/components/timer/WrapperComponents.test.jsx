/**
 * Tests for Timer WrapperComponents (MainSection, PopupSection).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainSection, PopupSection } from '../../../components/Timer/WrapperComponents';

vi.mock('../../../components/Timer/TreeAnimation', () => ({ default: () => <div data-testid="tree" /> }));
vi.mock('../../../components/Timer/TimerComponents', () => ({
  TimerDisplay: () => <div data-testid="timer-display" />,
  ModeIndicator: () => <div data-testid="mode-indicator" />,
  SessionStatus: () => <div data-testid="session-status" />,
  TimerControls: () => <div data-testid="timer-controls" />,
  TimerSettings: () => <div data-testid="timer-settings" />,
  SoundSelector: () => <div data-testid="sound-selector" />,
}));
vi.mock('../../../components/Timer/TaskInput', () => ({
  TaskInput: ({ onTaskSelect }) => (
    <button
      data-testid="task-select-btn"
      onClick={() => onTaskSelect?.({ id: 1, title: 'Task', estimated_blocks: 4, list_color: '#ccc' })}
    >
      Select task
    </button>
  ),
}));
vi.mock('../../../components/Timer/TimerPopups', () => ({
  OvertimePopup: () => <div data-testid="overtime-popup" />,
  GoalModal: () => <div data-testid="goal-modal" />,
  BreakModal: () => <div data-testid="break-modal" />,
  EndEarlyModal: () => <div data-testid="end-early-modal" />,
}));
vi.mock('../../../components/Timer/HistoryModal', () => ({ default: () => <div data-testid="history-modal" /> }));
vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({ default: { header: '', title: '', historyButton: '', mobileHistoryBtn: '' } }));

const baseT = {
  task: '',
  progress: 0,
  mode: 'work',
  timeLeft: 1500,
  isOvertime: false,
  isBreakOvertime: false,
  completedSessions: 0,
  targetSessions: 4,
  isActive: false,
  isPaused: false,
  workTime: 25,
  breakTime: 5,
  totalPaused: 0,
  blockTotalWork: 100,
  blockTotalBreak: 20,
  modal: null,
  setTask: vi.fn(),
  updateTime: vi.fn(),
  setTimeLeft: vi.fn(),
  setIsActive: vi.fn(),
  togglePause: vi.fn(),
  resetTimer: vi.fn(),
  setModal: vi.fn(),
  handlers: {
    break: vi.fn(),
    overtimeBreak: vi.fn(),
    goal: vi.fn(),
    endEarly: vi.fn(),
  },
};

describe('MainSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render History button when not mobile', () => {
    const onOpenHistory = vi.fn();
    render(<MainSection t={baseT} onOpenHistory={onOpenHistory} isMobile={false} />);
    expect(screen.queryByText('View History 📜')).not.toBeInTheDocument();
    expect(onOpenHistory).not.toHaveBeenCalled();
  });

  it('renders mobile View History button when isMobile', () => {
    const onOpenHistory = vi.fn();
    render(<MainSection t={baseT} onOpenHistory={onOpenHistory} isMobile={true} />);
    expect(screen.getByText('View History 📜')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'History' })).not.toBeInTheDocument();
  });

  it('calls setTask from sessionStorage timerSuggestedTask on mount', async () => {
    const t = { ...baseT, setTask: vi.fn() };
    sessionStorage.setItem('timerSuggestedTask', 'Suggested task');
    render(<MainSection t={t} onOpenHistory={vi.fn()} isMobile={false} />);
    await waitFor(() => {
      expect(t.setTask).toHaveBeenCalledWith('Suggested task');
    });
    expect(sessionStorage.getItem('timerSuggestedTask')).toBeNull();
  });

  it('on task select updates time and calls setActiveTaskId when present', () => {
    const setActiveTaskId = vi.fn();
    const t = { ...baseT, setActiveTaskId, updateTime: vi.fn(), setTimeLeft: vi.fn(), setIsActive: vi.fn() };
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    render(<MainSection t={t} onOpenHistory={vi.fn()} isMobile={false} />);
    fireEvent.click(screen.getByTestId('task-select-btn'));
    expect(t.updateTime).toHaveBeenCalledWith('work', 25);
    expect(t.updateTime).toHaveBeenCalledWith('sessions', 4);
    expect(setActiveTaskId).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Task', estimatedBlocks: 4 }));
    setItemSpy.mockRestore();
  });
});

describe('PopupSection', () => {
  it('renders HistoryModal when showHistory is true', () => {
    render(<PopupSection t={baseT} showHistory={true} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('history-modal')).toBeInTheDocument();
  });

  it('renders OvertimePopup work when isOvertime', () => {
    const t = { ...baseT, isOvertime: true };
    render(<PopupSection t={t} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('overtime-popup')).toBeInTheDocument();
  });

  it('renders OvertimePopup break when isBreakOvertime', () => {
    const t = { ...baseT, isBreakOvertime: true };
    render(<PopupSection t={t} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('overtime-popup')).toBeInTheDocument();
  });

  it('renders BreakModal when modal is break', () => {
    const t = { ...baseT, modal: 'break' };
    render(<PopupSection t={t} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('break-modal')).toBeInTheDocument();
  });

  it('renders GoalModal when modal is goal', () => {
    const t = { ...baseT, modal: 'goal' };
    render(<PopupSection t={t} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('goal-modal')).toBeInTheDocument();
  });

  it('renders EndEarlyModal when modal is endEarly', () => {
    const t = { ...baseT, modal: 'endEarly' };
    render(<PopupSection t={t} showHistory={false} onCloseHistory={vi.fn()} />);
    expect(screen.getByTestId('end-early-modal')).toBeInTheDocument();
  });
});
