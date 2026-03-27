/*
 * Tests for DeadlineForm component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeadlineForm from '../../../components/Modules/Deadlines/DeadlineForm';

vi.mock('../../../components/Modules/utils/deadlineUtils', () => ({
    DEADLINE_TYPES: [
        { value: 'coursework', label: 'Coursework' },
        { value: 'exam', label: 'Exam' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'presentation', label: 'Presentation' },
    ],
    TYPES_WITH_END_DATE: ['exam'],
    TYPES_WITH_LOCATION: ['exam', 'presentation'],
}));

vi.mock('../../../components/common/animated_dropdown', () => ({
    default: ({ value, onChange, options, placeholder }) => (
        <select
            aria-label={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {(options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

vi.mock('../../../components/common/inputs/DateTimePicker', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

vi.mock('../../../components/Modules/Deadlines/DeadlineForm.module.css', () => ({ default: {} }));

describe('DeadlineForm', () => {
    it('should render the title and type field', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
    });

    it('should render Add Deadline button when not editing', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Add Deadline')).toBeInTheDocument();
    });

    it('should render update button', () => {
        const initial = { title: 'Small Group Project', deadline_type: 'coursework', start_due_date: '', end_due_date: '', location: '', description: '' };
        render(<DeadlineForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('should render end time field if deadline type is exam', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'exam' } });
        expect(screen.getByText('End Time')).toBeInTheDocument();
    }, 15000);

    it('shows render location field if deadline type is exam', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'exam' } });
        expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should hide end time field if deadline type is coursework', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.queryByText('End Time')).not.toBeInTheDocument();
    });

    it('should render label as Start Time if deadline type is exam', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'exam' } });
        expect(screen.getByText('Start Time')).toBeInTheDocument();
    });

     it('should call onSubmit when form is submitted', () => {
        const onSubmit = vi.fn();
        const { container } = render(<DeadlineForm onSubmit={onSubmit} onCancel={vi.fn()} />);
        fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Test deadline' } });
        fireEvent.change(screen.getByPlaceholderText('Pick date & time'), { target: { value: '2026-06-01T10:00' } });
        fireEvent.submit(container.querySelector('form'));
        expect(onSubmit).toHaveBeenCalled();
    });

    it('should include description in submitted form', () => {
        const onSubmit = vi.fn();
        const { container } = render(<DeadlineForm onSubmit={onSubmit} onCancel={vi.fn()} />);
        fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Test' } });
        const textarea = container.querySelector('textarea');
        fireEvent.change(textarea, { target: { value: 'Optional notes' } });
        fireEvent.change(screen.getByPlaceholderText('Pick date & time'), { target: { value: '2026-06-01T10:00' } });
        fireEvent.click(screen.getByText('Add Deadline'));
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'Optional notes' }));
    });

    it('should show location field when type is presentation', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'presentation' } });
        expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('validates missing start date and exam end date requirements', () => {
        const onSubmit = vi.fn();
        render(<DeadlineForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Exam title' } });
        fireEvent.click(screen.getByText('Add Deadline'));
        expect(screen.getByText('Due date cannot be empty.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'exam' } });
        fireEvent.change(screen.getAllByPlaceholderText('Pick date & time')[0], { target: { value: '2026-06-01T10:00' } });
        fireEvent.click(screen.getByText('Add Deadline'));

        expect(screen.getByText('End time cannot be empty.')).toBeInTheDocument();
    });

    it('validates end time ordering for exams', () => {
        render(<DeadlineForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Exam title' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'exam' } });
        fireEvent.change(screen.getAllByPlaceholderText('Pick date & time')[0], { target: { value: '2026-06-01T10:00' } });
        fireEvent.change(screen.getAllByPlaceholderText('Pick date & time')[1], { target: { value: '2026-06-01T09:30' } });
        fireEvent.click(screen.getByText('Add Deadline'));

        expect(screen.getByText('End time must be after start time.')).toBeInTheDocument();
    });
});
