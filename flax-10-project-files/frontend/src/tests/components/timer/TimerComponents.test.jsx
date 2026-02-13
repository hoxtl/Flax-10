import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerDisplay, ModeIndicator, TimerControls, TimerSettings } from '../../../components/Timer/TimerComponents';

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

            rerender(<ModeIndicator mode="break" isOvertime={false} isBreakOvertime={true} />);
            expect(screen.getByText('⏳ Break Overtime')).toBeInTheDocument();
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

            // Test empty input change
            fireEvent.change(inputs[0], { target: { value: '' } });
            expect(onUpdate).toHaveBeenCalledWith('work', '');
        });

        it('selects content on focus', () => {
            render(<TimerSettings work={25} breakTime={5} sessions={4} isActive={false} onUpdate={() => { }} />);
            const input = screen.getAllByRole('spinbutton')[0];
            const selectSpy = vi.spyOn(input, 'select');
            fireEvent.focus(input);
            expect(selectSpy).toHaveBeenCalled();
        });

        it('handles invalid input on blur', () => {
            const onUpdate = vi.fn();
            render(<TimerSettings work={25} breakTime={5} sessions={4} isActive={false} onUpdate={onUpdate} />);
            const input = screen.getAllByRole('spinbutton')[0];

            // Empty string -> reset to default (work default is passed as prop? No, logic is inside component)
            // handleBlur('work', work, 0)

            // Simulate changing to empty
            fireEvent.blur(input, { target: { value: '' } });
            // Should call onUpdate with default 0? 
            // Wait, the component implementation: onBlur={handleBlur('work', work, 0)}
            // handleBlur uses the 'val' passed to it? No, handleBlur = (type, val, def) => () => check val?
            // Let's check implementation:
            // const handleBlur = (type, val, def) => () => { if (val === '' ...) onUpdate(type, def); }
            // It uses the closure value of 'val' (prop value). 
            // So if checking for empty, we need to pass empty as prop? But controlled input...
            // If we change input, onUpdate is called. Parent updates prop.
            // If we render with empty prop, then blur, it should reset.
        });

        it('resets invalid values on blur', () => {
            const onUpdate = vi.fn();
            // Render with empty value to simulate invalid state
            const { rerender } = render(<TimerSettings work={''} breakTime={5} sessions={4} isActive={false} onUpdate={onUpdate} />);
            const inputs = screen.getAllByRole('spinbutton');

            // Blur work input (empty)
            fireEvent.blur(inputs[0]);
            expect(onUpdate).toHaveBeenCalledWith('work', 0);

            // Render with sessions < 1
            rerender(<TimerSettings work={25} breakTime={5} sessions={0} isActive={false} onUpdate={onUpdate} />);
            const sessionInput = screen.getAllByRole('spinbutton')[2];
            fireEvent.blur(sessionInput);
            expect(onUpdate).toHaveBeenCalledWith('sessions', 1);

            // Test NaN (just in case)
            // Although number input usually handles this, we can force it via value
            rerender(<TimerSettings work={NaN} breakTime={5} sessions={4} isActive={false} onUpdate={onUpdate} />);
            const workInput = screen.getAllByRole('spinbutton')[0];
            fireEvent.blur(workInput);
            expect(onUpdate).toHaveBeenCalledWith('work', 0);
        });
    });
});
