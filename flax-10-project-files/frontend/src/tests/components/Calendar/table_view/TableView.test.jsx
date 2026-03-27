/**
 * Tests for TableView - Spreadsheet-style calendar view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableView } from '../../../../components/calendar/table_view/TableView';
import { createMockEvent } from '../mocks/calendarMocks';

let mockEvents = [];
const mockEditState = { editingCell: null, cellValue: '', startEdit: vi.fn(), updateValue: vi.fn(), saveEdit: vi.fn(), cancelEdit: vi.fn(), saveDateTimes: vi.fn(), saveWithValue: vi.fn() };
const mockNavState = { focusedCell: null, handleKeyDown: vi.fn(), EDITABLE_COLUMNS: ['title', 'tag', 'date', 'location', 'description'] };
const mockUseCalendar = vi.fn(() => ({ readOnly: false }));

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: ({ events }) => ({ events: events || mockEvents, viewMode: 'month', selectedDate: new Date(2026, 2, 15) }),
    useCalendar: () => mockUseCalendar(),
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, label: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../hooks/usePagination', () => ({
    usePagination: (items, size) => ({ currentPage: 1, totalPages: Math.ceil(items.length / size) || 1, currentItems: items.slice(0, size), setPage: vi.fn() }),
}));

vi.mock('../../../../components/calendar/hooks/useTableEdit', () => ({
    useTableEdit: () => mockEditState,
}));

vi.mock('../../../../components/calendar/hooks/useKeyboardNav', () => ({
    useKeyboardNav: () => mockNavState,
}));

vi.mock('../../../../components/calendar/table_view/TableRow', () => ({
    TableRow: ({ event, onCellClick, readOnly }) => (
        <tr data-testid="table-row" data-read-only={String(readOnly)}>
            <td>{event.title}</td>
            <td>
                <button type="button" onClick={() => onCellClick(event.id, 'title', event.title)}>
                    edit-{event.id}
                </button>
            </td>
        </tr>
    ),
}));

vi.mock('../../../../components/pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages }) => <div data-testid="pagination">{currentPage}/{totalPages}</div>,
    BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    sortByStartTime: (events) => [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
}));

describe('TableView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEvents = [];
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
        mockEvents = [createMockEvent({ id: 99, title: 'Context Event' })];
        const propEvents = [createMockEvent({ id: 1, title: 'Prop Event' })];
        render(<TableView events={propEvents} />);
        expect(screen.getByText('Prop Event')).toBeInTheDocument();
    });

    it('falls back to an empty array when calendar data returns null events', () => {
        mockEvents = null;
        render(<TableView />);
        expect(screen.getByText('No events to display')).toBeInTheDocument();
    });

    it('passes readOnly through when prop or context enables it', () => {
        const propEvents = [createMockEvent({ id: 1, title: 'Read Only Event' })];
        const { rerender } = render(<TableView events={propEvents} readOnly />);
        expect(screen.getByTestId('table-row')).toHaveAttribute('data-read-only', 'true');

        mockUseCalendar.mockReturnValueOnce({ readOnly: true });
        rerender(<TableView events={propEvents} />);
        expect(screen.getByTestId('table-row')).toHaveAttribute('data-read-only', 'true');
    });

    it('does not save when click occurs inside the table and removes listener on cleanup', () => {
        mockEditState.editingCell = { eventId: 1, field: 'title' };
        const events = [createMockEvent({ id: 1, title: 'Internal Click Event' })];
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const { container, unmount } = render(<TableView events={events} />);
        fireEvent.mouseDown(container.querySelector('table'));
        expect(mockEditState.saveEdit).not.toHaveBeenCalled();

        unmount();
        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('forwards table row cell clicks into startEdit', () => {
        const event = createMockEvent({ id: 5, title: 'Editable Row' });
        render(<TableView events={[event]} />);

        fireEvent.click(screen.getByText('edit-5'));

        expect(mockEditState.startEdit).toHaveBeenCalledWith(5, 'title', 'Editable Row');
    });
});
