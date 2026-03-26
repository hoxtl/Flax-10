/**
 * Tests for DateTimeCell - Date/time display and editing for table view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateTimeCell, formatTimeRange, isAllDay } from '../../../../../components/Calendar/TableView/cells/DateTimeCell';
import { createMockEvent } from '../../mocks/calendarMocks';

vi.mock('../../../../../components/common/inputs/DateTimePicker', () => ({
    default: ({ value, onChange }) => <input data-testid="datetime-picker" type="datetime-local" value={value} onChange={e => onChange(e.target.value)} />,
}));

vi.mock('../../../../../components/Calendar/utils/dateValidation', () => ({
    validateEventTimes: ({ start_time, end_time }) => {
        if (new Date(end_time) <= new Date(start_time)) return 'End time must be after start time';
        return null;
    },
}));

vi.mock('../../../../../components/Calendar/utils/eventUtils', () => ({
    isAllDay: (e) => e.all_day,
}));

describe('DateTimeCell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderCell(props = {}) {
        return render(<DateTimeCell event={createMockEvent()} isReadOnly={false} onSave={vi.fn()} {...props} />);
    }

    function openEditor(label = /Mar 15/) {
        fireEvent.click(screen.getByText(label));
        return screen.getAllByTestId('datetime-picker');
    }

    function setInvalidRange() {
        const pickers = openEditor();
        fireEvent.change(pickers[0], { target: { value: '2026-03-15T14:00' } });
        fireEvent.change(pickers[1], { target: { value: '2026-03-15T10:00' } });
        fireEvent.click(screen.getByText('Save'));
    }

    it('renders time range display', () => {
        renderCell();
        expect(screen.getByText(/Mar 15/)).toBeInTheDocument();
    });

    it('renders All day for all-day events', () => {
        renderCell({ event: createMockEvent({ all_day: true }) });
        expect(screen.getByText('All day')).toBeInTheDocument();
    });

    it('shows edit form when clicked', () => {
        renderCell();
        openEditor();
        expect(screen.getAllByTestId('datetime-picker')).toHaveLength(2);
    });

    it('does not show edit form when read-only clicked', () => {
        renderCell({ isReadOnly: true });
        fireEvent.click(screen.getByText(/Mar 15/));
        expect(screen.queryByTestId('datetime-picker')).not.toBeInTheDocument();
    });

    it('shows Save and Cancel buttons when editing', () => {
        renderCell();
        openEditor();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onSave with new times when Save clicked', () => {
        const onSave = vi.fn();
        renderCell({ onSave });
        openEditor();
        fireEvent.click(screen.getByText('Save'));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ start_time: expect.any(String), end_time: expect.any(String) }));
    });

    it('closes edit form when Cancel clicked', () => {
        renderCell();
        openEditor();
        expect(screen.getByText('Save')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('shows error when end time before start time', () => {
        renderCell();
        setInvalidRange();
        expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    });

    it('does not call onSave when validation fails', () => {
        const onSave = vi.fn();
        renderCell({ onSave });
        setInvalidRange();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('hides edit icon when read-only', () => {
        const { container } = renderCell({ isReadOnly: true });
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows edit icon when not read-only', () => {
        const { container } = renderCell();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('updates start value when picker changes', () => {
        renderCell();
        const pickers = openEditor();
        fireEvent.change(pickers[0], { target: { value: '2026-03-16T09:00' } });
        expect(pickers[0]).toHaveValue('2026-03-16T09:00');
    });

    it('updates end value when picker changes', () => {
        renderCell();
        const pickers = openEditor();
        fireEvent.change(pickers[1], { target: { value: '2026-03-16T18:00' } });
        expect(pickers[1]).toHaveValue('2026-03-16T18:00');
    });

    it('resets missing event times to empty inputs when editing', () => {
        renderCell({ event: createMockEvent({ start_time: null, end_time: null }) });
        const pickers = openEditor(/Jan 1/);
        expect(pickers[0]).toHaveValue('');
        expect(pickers[1]).toHaveValue('');
    });

    it('applies the hovered edit-icon class when the row is hovered', () => {
        const { container } = renderCell({ isRowHovered: true });
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('class')).toContain('editIconVisible');
    });
});

describe('formatTimeRange', () => {
    it('returns All day for all-day events', () => {
        expect(formatTimeRange({ all_day: true })).toBe('All day');
    });

    it('formats date and time range', () => {
        const result = formatTimeRange({ start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:30:00Z' });
        expect(result).toMatch(/Mar 15/);
    });
});
