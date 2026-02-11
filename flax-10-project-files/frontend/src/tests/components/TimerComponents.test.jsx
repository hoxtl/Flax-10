import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerDisplay, ModeIndicator, TimerControls, TimerSettings } from '../../components/Timer/TimerComponents';

describe('TimerComponents', () => {
    describe('TimerDisplay', () => {
        it('formats time correctly', () => {
            render(<TimerDisplay timeLeft={1500} mode="work" isOvertime={false} />);
            expect(screen.getByText('25:00')).toBeInTheDocument();
        });

        it('shows negative time for overtime', () => {
            render(<TimerDisplay timeLeft={-65} mode="work" isOvertime={true} />);
            // logic returns +MM:SS for negative numbers
            expect(screen.getByText('+01:05')).toBeInTheDocument();
        });
    });

    describe('ModeIndicator', () => {
        it('shows correct text for modes', () => {
            const { rerender } = render(<ModeIndicator mode="work" isOvertime={false} />);
            expect(screen.getByText(/Focus Time/)).toBeInTheDocument();

            rerender(<ModeIndicator mode="break" isOvertime={false} />);
            expect(screen.getByText('☕ Break Time')).toBeInTheDocument();
        });
    });

    describe('TimerControls', () => {
        it('renders correct buttons', () => {
            const onToggle = vi.fn();
            const onReset = vi.fn();
            render(<TimerControls isActive={false} onToggle={onToggle} onReset={onReset} />);

            const startBtn = screen.getByText('Start');
            fireEvent.click(startBtn);
            expect(onToggle).toHaveBeenCalled();

            const resetBtn = screen.getByText('Reset');
            fireEvent.click(resetBtn);
            expect(onReset).toHaveBeenCalled();
        });

        it('shows Pause when active', () => {
            render(<TimerControls isActive={true} onToggle={() => { }} onReset={() => { }} />);
            expect(screen.getByText('Pause')).toBeInTheDocument();
        });
    });

    describe('TimerSettings', () => {
        it('inputs are not disabled when active', () => {
            render(<TimerSettings work={25} breakTime={5} sessions={4} isActive={true} onUpdate={() => { }} />);
            const inputs = screen.getAllByRole('spinbutton');
            inputs.forEach(input => expect(input).not.toBeDisabled());
        });

        it('inputs call onUpdate', () => {
            const onUpdate = vi.fn();
            render(<TimerSettings work={25} breakTime={5} sessions={4} isActive={false} onUpdate={onUpdate} />);
            const inputs = screen.getAllByRole('spinbutton');

            // Work time input
            fireEvent.change(inputs[0], { target: { value: '30' } });
            // onUpdate called with number
            expect(onUpdate).toHaveBeenCalledWith('work', 30);
        });
    });
});
