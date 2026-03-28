import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskInput } from '../../../../components/timer/components/TimerComponents';

describe('TaskInput', () => {
    it('shows the current focus task instead of a text input', () => {
        render(<TaskInput value="My Task" onChange={vi.fn()} />);
        expect(screen.getByText('Currently focusing on')).toBeInTheDocument();
        expect(screen.getByText('My Task')).toBeInTheDocument();
    });

    it('renders matching action buttons for choosing a task and opening full focus', () => {
        render(<TaskInput value="" onChange={vi.fn()} onOpenFocus={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Choose a task to focus' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Full Focus Mode ⚡' })).toBeInTheDocument();
    });

    it('clears the selected task through the clear action', () => {
        const onChange = vi.fn();
        const onClearTask = vi.fn();
        render(<TaskInput value="Task" onChange={onChange} onClearTask={onClearTask} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear task' }));

        expect(onChange).toHaveBeenCalledWith('');
        expect(onClearTask).toHaveBeenCalledTimes(1);
    });
});
