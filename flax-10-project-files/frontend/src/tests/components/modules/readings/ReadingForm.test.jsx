/*
 * Tests for ReadingForm component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingForm, { buildFormData } from '@/components/modules/readings/ReadingForm';
import { fillBaseReadingForm, setChapterValue, setEstimatedMinutes, submitReadingForm } from './readingTestUtils';

vi.mock('@/components/common/inputs/DateTimePicker', () => ({
    default: ({onChange, placeholder }) => (
        <input placeholder={placeholder} onChange={e =>onChange(e.target.value)} />
    ),
}))

describe('ReadingForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the labelled reading fields', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Software Engineering Module Handbook/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Chapter 13/)).toBeInTheDocument();
        expect(screen.getByText('Add Reading')).toBeInTheDocument();
    });

    it('shows the update button when editing', () => {
        const initial = {title: 'Reading', chapter: 'Ch.1', start_page:13, end_page:63, deadline: '', estimated_minutes: ''};
        render(<ReadingForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<ReadingForm onSubmit={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('shows an error when chapter is negative', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fillBaseReadingForm();
        setChapterValue('-1');
        submitReadingForm();
        expect(screen.getByText('Chapter cannot be negative.')).toBeInTheDocument();
    });

    it('shows an error when end page is less than start page', () => {
        render(<ReadingForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        fillBaseReadingForm();
        fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '40' } });
        fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '10' } });
        submitReadingForm();
        expect(screen.getByText('End page must be greater than or equal to start page.')).toBeInTheDocument();
    });

    it('submits a transformed payload with numeric and ISO values', () => {
        const onSubmit = vi.fn();
        render(<ReadingForm onSubmit={onSubmit} onCancel={vi.fn()} />);
        fillBaseReadingForm();
        submitReadingForm();
        const isoDeadline = new Date('2026-04-01T09:00').toISOString();
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            start_page: 10,
            end_page: 30,
            estimated_minutes: null,
            deadline: isoDeadline,
        }));
    });

    it('allows manual estimated minutes overrides', () => {
        const onSubmit = vi.fn();
        render(<ReadingForm onSubmit={onSubmit} onCancel={vi.fn()} />);
        fillBaseReadingForm();
        setEstimatedMinutes('45');
        submitReadingForm();
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ estimated_minutes: 45 }));
    });

    it('converts blank inputs to defaults in buildFormData', () => {
        const payload = buildFormData({
            title: 'Reading',
            chapter: '',
            start_page: '5',
            end_page: '8',
            estimated_minutes: '',
            deadline: '',
        });
        expect(payload).toMatchObject({
            start_page: 5,
            end_page: 8,
            estimated_minutes: null,
            deadline: '',
        });
    });

});
