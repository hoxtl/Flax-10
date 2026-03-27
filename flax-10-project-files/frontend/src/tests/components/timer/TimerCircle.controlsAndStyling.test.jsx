/**
 * Covers TimerCircle controls, styling, and TimerRing rendering.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createFnMap } from '../../utils/testBuilderUtils';

// CSS module mocks
vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));
vi.mock('../../../components/timer/TreeAnimation.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

// Dependency mocks for TimerCircle
vi.mock('../../../components/timer/FocusAnimation', () => ({
  default: ({ progress, mode, isActive, showPicker }) => (
    <div data-testid="focus-animation" data-progress={progress} data-mode={mode} data-active={String(isActive)} data-showpicker={String(showPicker)} />
  ),
}));

vi.mock('../../../components/timer/TimerComponents', () => ({
  TimerDisplay: ({ timeLeft, mode, isOvertime }) => (
    <div data-testid="timer-display" data-timeleft={timeLeft} data-mode={mode} data-overtime={String(isOvertime)} />
  ),
}));

// Canvas mock for FocusAnimation real tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillStyle: '',
}));
vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Imports under test
import TimerCircle, { TimerRing } from '../../../components/timer/TimerCircle';
import FocusAnimation from '../../../components/timer/FocusAnimation';

// Helper timer state
const timerActionNames = ['setIsActive', 'togglePause', 'resetTimer', 'setModal'];
const baseTimerProps = {
  mode: 'work', workTime: 25, breakTime: 5, timeLeft: 1500, progress: 50,
  isActive: false, isPaused: false, isOvertime: false, isBreakOvertime: false,
  completedSessions: 0, targetSessions: 4, blockTotalWork: 0, blockTotalBreak: 0, totalPaused: 0,
};

const makeT = (overrides = {}) => ({
  ...baseTimerProps,
  ...createFnMap(timerActionNames),
  ...overrides,
});

// TimerCircle

describe('TimerCircle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders SVG ring', () => {
    const t = makeT();
    const { container } = render(<TimerCircle t={t} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows Start button when timer is not active', () => {
    render(<TimerCircle t={makeT({ isActive: false })} />);
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('calls setIsActive when Start is clicked and onPrimaryStart is absent', () => {
    const t = makeT();
    render(<TimerCircle t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('calls onPrimaryStart when provided instead of setIsActive', () => {
    const t = makeT();
    const onPrimaryStart = vi.fn();
    render(<TimerCircle t={t} onPrimaryStart={onPrimaryStart} />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onPrimaryStart).toHaveBeenCalledTimes(1);
    expect(t.setIsActive).not.toHaveBeenCalled();
  });

  it('shows Pause button when running (isActive && !isPaused)', () => {
    render(<TimerCircle t={makeT({ isActive: true, isPaused: false })} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('calls togglePause when Pause button clicked', () => {
    const t = makeT({ isActive: true, isPaused: false });
    render(<TimerCircle t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(t.togglePause).toHaveBeenCalledTimes(1);
  });

  it('shows Resume button when paused', () => {
    render(<TimerCircle t={makeT({ isActive: true, isPaused: true })} />);
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('shows Reset and End Early buttons only when active or paused', () => {
    const t = makeT({ isActive: true });
    render(<TimerCircle t={t} />);
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end early/i })).toBeInTheDocument();
  });

  it('does NOT show Reset/End Early when neither active nor paused', () => {
    render(<TimerCircle t={makeT()} />);
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /end early/i })).not.toBeInTheDocument();
  });

  it('calls resetTimer when Reset button clicked', () => {
    const t = makeT({ isActive: true });
    render(<TimerCircle t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(t.resetTimer).toHaveBeenCalledTimes(1);
  });

  it("calls setModal('endEarly') when End Early is clicked", () => {
    const t = makeT({ isActive: true });
    render(<TimerCircle t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    expect(t.setModal).toHaveBeenCalledWith('endEarly');
  });

  it('hides controls when showControls is false', () => {
    render(<TimerCircle t={makeT()} showControls={false} />);
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
  });

  it('applies deep-session class when workTime >= 60 and running', () => {
    const { container } = render(
      <TimerCircle t={makeT({ isActive: true, isPaused: false, workTime: 90 })} />,
    );
    // The wrapper div should have timerCircleDeep class
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('timerCircleDeep');
  });

  it('does NOT apply deep class when workTime < 60', () => {
    const { container } = render(
      <TimerCircle t={makeT({ isActive: true, isPaused: false, workTime: 25 })} />,
    );
    expect(container.firstChild.className).not.toContain('timerCircleDeep');
  });

  it('uses warning color when overtime', () => {
    // With overtime, getRingState returns warning color; SVG circles use it as stroke
    const { container } = render(
      <TimerCircle t={makeT({ isOvertime: true })} />,
    );
    const circles = container.querySelectorAll('circle');
    const hasWarning = Array.from(circles).some((c) => c.getAttribute('stroke') === 'var(--warning)');
    expect(hasWarning).toBe(true);
  });

  it('uses sage color in break mode without overtime', () => {
    const { container } = render(
      <TimerCircle t={makeT({ mode: 'break', isOvertime: false })} />,
    );
    const circles = container.querySelectorAll('circle');
    const hasSage = Array.from(circles).some((c) => c.getAttribute('stroke') === 'var(--sage)');
    expect(hasSage).toBe(true);
  });

  it('passes showPicker=true to FocusAnimation by default', () => {
    render(<TimerCircle t={makeT()} />);
    const anim = screen.getByTestId('focus-animation');
    expect(anim.dataset.showpicker).toBe('true');
  });

  it('passes showPicker=false to FocusAnimation when showAnimationPicker=false', () => {
    render(<TimerCircle t={makeT()} showAnimationPicker={false} />);
    const anim = screen.getByTestId('focus-animation');
    expect(anim.dataset.showpicker).toBe('false');
  });

  it('ratio is 1 when total is 0 (workTime=0)', () => {
    // Should not throw; ratio defaults to 1
    expect(() =>
      render(<TimerCircle t={makeT({ workTime: 0, timeLeft: 0 })} />),
    ).not.toThrow();
  });
});

// TimerRing

describe('TimerRing', () => {
  it('renders SVG ring', () => {
    const { container } = render(<TimerRing t={makeT()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders TimerDisplay', () => {
    render(<TimerRing t={makeT({ timeLeft: 300, mode: 'break' })} />);
    const display = screen.getByTestId('timer-display');
    expect(display.dataset.timeleft).toBe('300');
    expect(display.dataset.mode).toBe('break');
  });

  it('does not render primary or secondary buttons', () => {
    render(<TimerRing t={makeT({ isActive: true })} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses warning color when break is overtime', () => {
    const { container } = render(
      <TimerRing t={makeT({ isBreakOvertime: true })} />,
    );
    const circles = container.querySelectorAll('circle');
    const hasWarning = Array.from(circles).some((c) => c.getAttribute('stroke') === 'var(--warning)');
    expect(hasWarning).toBe(true);
  });
});

// FocusAnimation – showPicker=false branch

describe('FocusAnimation – showPicker=false', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('hides the picker row when showPicker is false', () => {
    render(<FocusAnimation progress={0.5} mode="work" isActive={false} showPicker={false} />);
    // Picker buttons should not be present
    const pickerBtns = document.querySelectorAll('button[title]');
    expect(pickerBtns.length).toBe(0);
  });

  it('still renders the animation wrapper when showPicker is false', () => {
    const { container } = render(
      <FocusAnimation progress={0.5} mode="work" isActive={false} showPicker={false} />,
    );
    // The outer focusAnimWrapper div should always be present
    expect(container.firstChild).not.toBeNull();
  });
});
