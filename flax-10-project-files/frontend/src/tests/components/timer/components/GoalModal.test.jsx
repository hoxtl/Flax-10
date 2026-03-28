import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalModal } from '../../../../components/timer/components/TimerPopups';

const testRender = () => {
    render(<GoalModal sessions={4} workTime={1500} breakTime={300} onAction={() => { }} />);
    expect(screen.getByText('Goal reached')).toBeInTheDocument();
    expect(screen.getByText('Start New Goal')).toBeInTheDocument();
    expect(screen.getByText('✅ Sessions')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
};

const testAction = () => {
    const onAction = vi.fn();
    render(<GoalModal sessions={4} workTime={0} breakTime={0} onAction={onAction} />);
    fireEvent.click(screen.getByText('Start New Goal'));
    expect(onAction).toHaveBeenCalled();
};

const testMoodPersistence = () => {
    sessionStorage.clear();
    const onAction = vi.fn();
    render(<GoalModal sessions={2} workTime={1200} breakTime={300} onAction={onAction} />);
    fireEvent.click(screen.getByText('🔥'));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(sessionStorage.getItem('lastSessionMood')).toBe('locked_in');
    expect(onAction).toHaveBeenCalledTimes(1);
};

describe('GoalModal', () => {
    it('renders correctly', testRender);

    it('calls onAction', testAction);

    it('persists the selected mood before completing the goal', testMoodPersistence);
});
