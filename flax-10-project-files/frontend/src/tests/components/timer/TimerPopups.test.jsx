import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OvertimePopup, GoalModal, BreakModal } from '../../../components/Timer/TimerPopups';

describe('TimerPopups', () => {
    describe('OvertimePopup', () => {
        it('renders correctly for work mode', () => {
            const onAction = vi.fn();
            render(<OvertimePopup mode="work" time={65} onAction={onAction} />);
            expect(screen.getByText("Time's Up!")).toBeInTheDocument();
            expect(screen.getByText("You're in overtime mode.")).toBeInTheDocument();
            expect(screen.getByText("Start Break")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Start Break"));
            expect(onAction).toHaveBeenCalled();
        });

        it('renders correctly for break mode', () => {
            render(<OvertimePopup mode="break" time={120} onAction={() => { }} />);
            expect(screen.getByText("Break Over!")).toBeInTheDocument();
            expect(screen.getByText("Time to get back to work.")).toBeInTheDocument();
            expect(screen.getByText("Start Work")).toBeInTheDocument();
        });
    });

    describe('BreakModal', () => {
        it('renders correctly', () => {
            const onAction = vi.fn();
            render(<BreakModal onAction={onAction} />);
            expect(screen.getByText('Focus Session Complete!')).toBeInTheDocument();
            expect(screen.getByText('Start Break')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Start Break'));
            expect(onAction).toHaveBeenCalled();
        });
    });

    describe('GoalModal', () => {
        it('renders correctly', () => {
            const onAction = vi.fn();
            render(<GoalModal sessions={4} workTime={1500} breakTime={300} onAction={onAction} />);
            expect(screen.getByText('🎉 Goal Reached!')).toBeInTheDocument();
            expect(screen.getByText('Start New Goal')).toBeInTheDocument();

            // Check Summary Pills
            expect(screen.getByText('✅ Sessions')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });

        it('calls onAction', () => {
            const onAction = vi.fn();
            render(<GoalModal sessions={4} workTime={0} breakTime={0} onAction={onAction} />);
            fireEvent.click(screen.getByText('Start New Goal'));
            expect(onAction).toHaveBeenCalled();
        });
    });
});
