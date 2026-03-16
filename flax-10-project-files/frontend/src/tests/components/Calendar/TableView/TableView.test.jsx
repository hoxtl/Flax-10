/**
 * Tests for TableView - Spreadsheet-style calendar view.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableView } from '../../../../components/Calendar/TableView/TableView';
import { createMockEvent } from '../mocks/calendarMocks';

const mockPagination = { currentPage: 1, totalPages: 1, currentItems: [], setPage: vi.fn() };
const mockEditState = { editingCell: null, cellValue: '', startEdit: vi.fn(), updateValue: vi.fn(), saveEdit: vi.fn(), cancelEdit: vi.fn(), saveDateTimes: vi.fn(), saveWithValue: vi.fn() };
const mockNavState = { focusedCell: null, handleKeyDown: vi.fn(), EDITABLE_COLUMNS: ['title', 'tag', 'date', 'location', 'description'] };
const mockCalendarData = { events: [], viewMode: 'month', selectedDate: new Date(2026, 2, 15) };

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: () => mockCalendarData,
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, label: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../hooks/usePagination', () => ({
    usePagination: (items) => ({ ...mockPagination, currentItems: items.slice(0, 10), totalPages: Math.ceil(items.length / 10) || 1 }),
}));

vi.mock('../../../../components/Calendar/hooks/useTableEdit', () => ({
    useTableEdit: () => mockEditState,
}));

vi.mock('../../../../components/Calendar/hooks/useKeyboardNav', () => ({
    useKeyboardNav: () => mockNavState,
}));

vi.mock('../../../../components/Calendar/TableView/TableRow', () => ({
    TableRow: ({ event }) => <tr data-testid="table-row"><td>{event.title}</td></tr>,
}));

vi.mock('../../../../components/Pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages }) => <div data-testid="pagination">{currentPage}/{totalPages}</div>,
    BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({
    sortByStartTime: (events) => [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
}));

describe('TableView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCalendarData.events = [];
        mockEditState.editingCell = null;
    });

    it('renders empty state when no events', () => {
        render(<TableView />);
        expect(screen.getByText('No events to display')).toBeInTheDocument();
    });

    it('renders table header columns', () => {
        render(<TableView />);
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Tag')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders event rows', () => {
        const events = [createMockEvent({ id: 1, title: 'Event A' }), createMockEvent({ id: 2, title: 'Event B' })];
        render(<TableView events={events} />);
        expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders pagination component', () => {
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<TableView events={events} />);
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('renders back to top component', () => {
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<TableView events={events} />);
        expect(screen.getByTestId('back-to-top')).toBeInTheDocument();
    });

    it('calls saveEdit on click outside when editing', () => {
        mockEditState.editingCell = { eventId: 1, field: 'title' };
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<TableView events={events} />);
        fireEvent.mouseDown(document.body);
        expect(mockEditState.saveEdit).toHaveBeenCalled();
    });

    it('does not call saveEdit on click outside when not editing', () => {
        mockEditState.editingCell = null;
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<TableView events={events} />);
        fireEvent.mouseDown(document.body);
        expect(mockEditState.saveEdit).not.toHaveBeenCalled();
    });

    it('sorts events by start time', () => {
        const events = [
            createMockEvent({ id: 2, title: 'Later', start_time: '2026-03-15T14:00:00Z' }),
            createMockEvent({ id: 1, title: 'Earlier', start_time: '2026-03-15T10:00:00Z' }),
        ];
        render(<TableView events={events} />);
        const rows = screen.getAllByTestId('table-row');
        expect(rows[0]).toHaveTextContent('Earlier');
        expect(rows[1]).toHaveTextContent('Later');
    });

    it('uses props events over context events', () => {
        mockCalendarData.events = [createMockEvent({ id: 99, title: 'Context Event' })];
        const propEvents = [createMockEvent({ id: 1, title: 'Prop Event' })];
        render(<TableView events={propEvents} />);
        expect(screen.getByText('Prop Event')).toBeInTheDocument();
    });
});
