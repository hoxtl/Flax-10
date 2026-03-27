/**
 * Tests for Timer WrapperComponents (MainSection, PopupSection).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
<<<<<<< HEAD
import { MainSection, PopupSection } from '../../../components/timer/components/WrapperComponents';

vi.mock('../../../components/timer/components/TreeAnimation', () => ({ default: () => <div data-testid="tree" /> }));
vi.mock('../../../components/timer/components/TaskInput', () => ({
=======
import { MainSection, PopupSection } from '../../../components/timer/WrapperComponents';

vi.mock('../../../components/timer/TreeAnimation', () => ({ default: () => <div data-testid="tree" /> }));
vi.mock('../../../components/timer/TaskInput', () => ({
>>>>>>> main
  TaskInput: ({ onTaskSelect, onOpenFocus, onClearTask }) => (
    <div data-testid="task-input">
      <button type="button" onClick={() => onTaskSelect?.({ id: 1, title: 'Task', estimated_blocks: 4, list_color: '#ccc' })}>Choose a task to focus</button>
      <button type="button" onClick={() => onOpenFocus?.()}>Full Focus Mode ⚡</button>
      <button type="button" onClick={() => onClearTask?.()}>Clear task</button>
    </div>
  ),
}));
vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: (props) => {
    const safeProps = { ...props };
    delete safeProps.pill;
    delete safeProps.variant;
    delete safeProps.size;
    return <button {...safeProps}>{props.children}</button>;
  },
}));
<<<<<<< HEAD
vi.mock('../../../components/timer/components/TimerComponents', () => ({
=======
vi.mock('../../../components/timer/TimerComponents', () => ({
>>>>>>> main
  TimerDisplay: () => <div data-testid="timer-display" />,
  ModeIndicator: () => <div data-testid="mode-indicator" />,
  SessionStatus: () => <div data-testid="session-status" />,
  TimerControls: () => <div data-testid="timer-controls" />,
  TimerSettings: () => <div data-testid="timer-settings" />,
}));
<<<<<<< HEAD
vi.mock('../../../components/timer/components/TimerPopups', () => ({
=======
vi.mock('../../../components/timer/TimerPopups', () => ({
>>>>>>> main
  OvertimePopup: () => <div data-testid="overtime-popup" />,
  GoalModal: () => <div data-testid="goal-modal" />,
  BreakModal: () => <div data-testid="break-modal" />,
  EndEarlyModal: () => <div data-testid="end-early-modal" />,
}));
<<<<<<< HEAD
vi.mock('../../../components/timer/components/HistoryModal', () => ({ default: () => <div data-testid="history-modal" /> }));
=======
vi.mock('../../../components/timer/HistoryModal', () => ({ default: () => <div data-testid="history-modal" /> }));
>>>>>>> main
vi.mock('../../../pages/timer/TimerPage.module.css', () => ({ default: { header: '', title: '', historyButton: '', mobileHistoryBtn: '' } }));

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
  setActiveTaskId: vi.fn(),
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

  it('renders the full focus entry button and opens focus mode', () => {
    const onOpenFocus = vi.fn();
    render(<MainSection t={baseT} onOpenHistory={vi.fn()} onOpenFocus={onOpenFocus} isMobile={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Full Focus Mode ⚡' }));
    expect(onOpenFocus).toHaveBeenCalledTimes(1);
  });

  it('applies the chosen task timing from the task picker actions', () => {
    const t = {
      ...baseT,
      setTask: vi.fn(),
      updateTime: vi.fn(),
      setTimeLeft: vi.fn(),
      setActiveTaskId: vi.fn(),
    };

    render(<MainSection t={t} onOpenHistory={vi.fn()} onOpenFocus={vi.fn()} isMobile={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose a task to focus' }));

    expect(t.setTask).toHaveBeenCalledWith('Task');
    expect(t.updateTime).toHaveBeenCalledWith('work', 25);
    expect(t.updateTime).toHaveBeenCalledWith('sessions', 4);
    expect(t.setTimeLeft).toHaveBeenCalledWith(25 * 60);
    expect(t.setActiveTaskId).toHaveBeenCalledWith(1, expect.objectContaining({
      title: 'Task',
      estimatedBlocks: 4,
      estimatedSessionCount: 4,
      estimatedWorkMinutes: 25,
    }));
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

  it('renders nothing while focus mode disables popups', () => {
    const t = { ...baseT, isOvertime: true, modal: 'goal' };
    render(<PopupSection t={t} showHistory={true} onCloseHistory={vi.fn()} disabled />);
    expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overtime-popup')).not.toBeInTheDocument();
    expect(screen.queryByTestId('goal-modal')).not.toBeInTheDocument();
  });
});
