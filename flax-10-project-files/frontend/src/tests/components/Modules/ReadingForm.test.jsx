/*
 * Tests for ReadingForm component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReadingForm from '../../../components/Modules/Readings/ReadingForm';

vi.mock('../../../components/Modules/Deadlines/DeadlineForm.module.css', () => ({ default: { } }));
vi.mock('../../../components/Common/inputs/DateTimePicker', () => ({
    default: ({onChange, placeholder }) => (
        <input placeholder={placeholder} onChange={e =>onChange(e.target.value)} />
    ),
}))

describe('ReadingForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Software Engineering Module Handbook/))
        expect(screen.getByPlaceholderText(/Chapter 13/)).toBeInTheDocument();
        expect(screen.getByText('Add Reading')).toBeInTheDocument();
    });

    it('shows the update button when editing', () => {
        const initial = {title: 'Reading', chapter: 'Ch.1', start_page:13, end_page:63, deadline: '', estimated_minutes: ''};
        render(<ReadingForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button clicked', () => {
        const onCancel = vi.fn();
        render(<ReadingForm onSubmit={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('shows an error when chapter is negative', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(/Software Engineering Module Handbook/), {target : {value: 'Test Reading'}});
        fireEvent.change(screen.getByPlaceholderText(/Chapter 13/), {target : {value: '-1'}});
        fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '13' } });
        fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '63' } });
        fireEvent.click(screen.getByText('Add Reading'));
        expect(screen.getByText('Chapter cannot be negative.')).toBeInTheDocument();
    });

     it('shows an error when end page is less than start page', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText(/Software Engineering Module Handbook/), {target : {value: 'Test Reading'}});
        fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '40' } });
        fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '10' } });
        fireEvent.click(screen.getByText('Add Reading'));
        expect(screen.getByText('End page must be greater than or equal to start page.')).toBeInTheDocument();
    });

});