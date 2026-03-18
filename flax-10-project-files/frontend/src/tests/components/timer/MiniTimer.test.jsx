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
        const { container } = render(<MiniTimer activeNav="home" />);
        const wrapper = container.firstChild;
        fireEvent.mouseEnter(wrapper);
        expect(wrapper.querySelector('[class*="tooltip"]')).toBeTruthy();
    });

    it('hides tooltip on mouse leave', () => {
        const { container } = render(<MiniTimer activeNav="home" />);
        const wrapper = container.firstChild;
        fireEvent.mouseEnter(wrapper);
        fireEvent.mouseLeave(wrapper);
        const tooltip = wrapper.querySelector('[class*="tooltip"]');
        expect(tooltip.className).not.toContain('visible');
    });

    it('shows Focus label in work mode', () => {
        const { container } = render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(container.firstChild);
        expect(container.textContent).toContain('Focus');
    });

    it('shows Overtime label when isOvertime', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isOvertime: true });
        const { container } = render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(container.firstChild);
        expect(container.textContent).toContain('Overtime');
    });

    it('shows Paused label when isPaused', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, isPaused: true });
        const { container } = render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(container.firstChild);
        expect(container.textContent).toContain('Paused');
    });

    it('shows Break Time label in break mode', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, mode: 'break' });
        const { container } = render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(container.firstChild);
        expect(container.textContent).toContain('Break');
    });

    it('shows Break Overtime when isBreakOvertime', () => {
        useTimerContext.mockReturnValue({ ...baseTimerState, mode: 'break', isBreakOvertime: true });
        const { container } = render(<MiniTimer activeNav="home" />);
        fireEvent.mouseEnter(container.firstChild);
        expect(container.textContent).toContain('Overtime');
    });

    it('does not throw when onNavigate is not provided', () => {
        render(<MiniTimer activeNav="home" />);
        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
});
