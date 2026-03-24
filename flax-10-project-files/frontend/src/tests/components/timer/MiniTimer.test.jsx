import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MiniTimer from '../../../components/Timer/MiniTimer';

vi.mock('../../../context/TimerContext', () => ({
    useTimerContext: vi.fn(),
}));

vi.mock('../../../components/Timer/TimerComponents', () => ({
    formatTime: vi.fn((s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`),
}));

import { useTimerContext } from '../../../context/TimerContext';

const baseTimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: 1500,
    totalPaused: 0,
    mode: 'work',
    isOvertime: false,
    isBreakOvertime: false,
};

describe('MiniTimer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTimerContext.mockReturnValue(baseTimerState);
    });

    it('renders nothing when not active', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isActive: false });
        const { container } = render(<MiniTimer />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when activeNav is timer', () => {
        const { container } = render(<MiniTimer activeNav="timer" />);
        expect(container.firstChild).toBeNull();
    });

    it('renders timer button when active and not on timer nav', () => {
        render(<MiniTimer activeNav="home" />);
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('calls onNavigate with timer when button clicked', () => {
        const onNavigate = vi.fn();
        render(<MiniTimer onNavigate={onNavigate} activeNav="home" />);
        fireEvent.click(screen.getByRole('button'));
        expect(onNavigate).toHaveBeenCalledWith('timer');
    });

    it('shows paused time when paused', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isPaused: true, totalPaused: 120 });
        render(<MiniTimer activeNav="home" />);
        expect(screen.getByRole('button').textContent).toContain('2:00');
    });

    it('shows timeLeft when not paused', () => {
        render(<MiniTimer activeNav="home" />);
        expect(screen.getByRole('button').textContent).toContain('25:00');
    });

    it('shows tooltip on mouse enter', () => {
        render(<MiniTimer activeNav="home" />);
        const wrapper = screen.getByRole('button').parentElement;
        fireEvent.mouseEnter(wrapper);
        expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    it('hides tooltip on mouse leave', () => {
        render(<MiniTimer activeNav="home" />);
        const wrapper = screen.getByRole('button').parentElement;
        fireEvent.mouseEnter(wrapper);
        fireEvent.mouseLeave(wrapper);
        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('shows Focus label in work mode', () => {
        render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(screen.getByRole('button').parentElement);
        expect(screen.getByRole('tooltip').textContent).toContain('Focus');
    });

    it('shows Overtime label when isOvertime', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isOvertime: true });
        render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(screen.getByRole('button').parentElement);
        expect(screen.getByRole('tooltip').textContent).toContain('Overtime');
    });

    it('shows Paused label when isPaused', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isPaused: true });
        render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(screen.getByRole('button').parentElement);
        expect(screen.getByRole('tooltip').textContent).toContain('Paused');
    });

    it('shows Break Time label in break mode', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, mode: 'break' });
        render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(screen.getByRole('button').parentElement);
        expect(screen.getByRole('tooltip').textContent).toContain('Break');
    });

    it('shows Break Overtime when isBreakOvertime', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, mode: 'break', isBreakOvertime: true });
        render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(screen.getByRole('button').parentElement);
        expect(screen.getByRole('tooltip').textContent).toContain('Overtime');
    });

    it('does not throw when onNavigate is not provided', () => {
        render(<MiniTimer activeNav="home" />);
        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
});
