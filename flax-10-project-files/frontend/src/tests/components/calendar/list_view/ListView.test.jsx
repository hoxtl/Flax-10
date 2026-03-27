/**
 * Tests for ListView - Calendar list view with grouped daily sections.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListView } from '../../../../components/calendar/list_view/ListView';
import { createMockEvent } from '../mocks/calendarMocks';

let mockViewMode = 'month';
let mockEvents = [];

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: ({ events }) => ({ events: events || mockEvents, viewMode: mockViewMode, selectedDate: new Date(2026, 2, 15) }),
}));

vi.mock('../../../../hooks/usePagination', () => ({
    usePagination: (items, size) => ({ currentPage: 1, totalPages: Math.ceil(items.length / size) || 1, currentItems: items.slice(0, size), setPage: vi.fn() }),
}));

vi.mock('../../../../components/calendar/list_view/EventRow', () => ({
    EventRow: ({ event }) => <div data-testid="event-row">{event.title}</div>,
    ConflictRow: ({ events }) => <div data-testid="conflict-row">{events.map((event) => event.title).join(', ')}</div>,
}));

vi.mock('../../../../components/pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages }) => <div data-testid="pagination">{currentPage}/{totalPages}</div>,
    BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    getEffectiveTagName: (e) => e.tag_name || 'default',
    sortByStartTime: (events) => [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    isAllDay: (event) => !!event.all_day,
}));

describe('ListView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEvents = [];
        mockViewMode = 'month';
        Element.prototype.scrollIntoView = vi.fn();
        vi.stubGlobal('requestAnimationFrame', (callback) => {
            callback();
            return 1;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('renders empty state when no events', () => {
        render(<ListView />);
        expect(screen.getByText('No events to display')).toBeInTheDocument();
    });

    it('renders empty state when calendar data returns null events', () => {
        mockEvents = null;
        render(<ListView />);
        expect(screen.getByText('No events to display')).toBeInTheDocument();
    });

    it('renders grouped list for month view', () => {
        const events = [createMockEvent({ id: 1, title: 'Event A' }), createMockEvent({ id: 2, title: 'Event B' })];
        render(<ListView events={events} />);
        expect(screen.getAllByTestId('event-row')).toHaveLength(2);
    });

    it('renders flat list for day view', () => {
        mockViewMode = 'day';
        const events = [createMockEvent({ id: 1, title: 'Day Event' })];
        render(<ListView events={events} />);
        expect(screen.getByText('Day Event')).toBeInTheDocument();
    });

    it('renders pagination component', () => {
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<ListView events={events} />);
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('renders back to top component', () => {
        const events = [createMockEvent({ id: 1, title: 'Event' })];
        render(<ListView events={events} />);
        expect(screen.getByTestId('back-to-top')).toBeInTheDocument();
    });

    it('groups events by date', () => {
        const events = [
            createMockEvent({ id: 1, title: 'A', start_time: '2026-03-15T10:00:00Z' }),
            createMockEvent({ id: 2, title: 'B', start_time: '2026-03-15T14:00:00Z' }),
            createMockEvent({ id: 3, title: 'C', start_time: '2026-03-16T10:00:00Z' }),
        ];
        render(<ListView events={events} />);
        expect(screen.getAllByTestId('event-row')).toHaveLength(3);
    });

    it('displays day header with date info', () => {
        const events = [createMockEvent({ id: 1, title: 'Event', start_time: '2026-03-15T10:00:00Z' })];
        render(<ListView events={events} />);
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('shows deadline count in day header', () => {
        const events = [createMockEvent({ id: 1, title: 'Deadline', tag_name: 'deadline' })];
        render(<ListView events={events} />);
        expect(screen.getByText('1 deadline')).toBeInTheDocument();
    });

    it('shows plural deadlines text', () => {
        const events = [
            createMockEvent({ id: 1, title: 'DL1', tag_name: 'deadline', start_time: '2026-03-15T10:00:00Z' }),
            createMockEvent({ id: 2, title: 'DL2', tag_name: 'deadline', start_time: '2026-03-15T11:00:00Z' }),
        ];
        render(<ListView events={events} />);
        expect(screen.getByText('2 deadlines')).toBeInTheDocument();
    });

    it('shows Today badge for current date events', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
        const events = [createMockEvent({ id: 1, title: 'My Event', start_time: '2026-03-15T10:00:00Z' })];
        render(<ListView events={events} />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders event count in header label', () => {
        const events = [createMockEvent({ id: 1, title: 'Single' })];
        render(<ListView events={events} />);
        expect(screen.getByText(/1 event/)).toBeInTheDocument();
    });

    it('renders plural events count', () => {
        const events = [
            createMockEvent({ id: 1, title: 'E1', start_time: '2026-03-15T10:00:00Z' }),
            createMockEvent({ id: 2, title: 'E2', start_time: '2026-03-15T11:00:00Z' }),
        ];
        render(<ListView events={events} />);
        expect(screen.getByText(/2 events/)).toBeInTheDocument();
    });

    it('uses props events over context events', () => {
        mockEvents = [createMockEvent({ id: 99, title: 'Context Event' })];
        const propEvents = [createMockEvent({ id: 1, title: 'Prop Event' })];
        render(<ListView events={propEvents} />);
        expect(screen.getByText('Prop Event')).toBeInTheDocument();
    });

    it('hides pagination helpers for day and week views', () => {
        mockViewMode = 'day';
        render(<ListView events={[createMockEvent({ id: 1, title: 'Day Event' })]} />);
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        expect(screen.queryByTestId('back-to-top')).not.toBeInTheDocument();

        mockViewMode = 'week';
        render(<ListView events={[createMockEvent({ id: 2, title: 'Week Event' })]} />);
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('renders overlapping day events as a conflict row and keeps all-day rows separate', () => {
        mockViewMode = 'day';
        const events = [
            createMockEvent({ id: 1, title: 'Overlap A', start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:00:00Z' }),
            createMockEvent({ id: 2, title: 'Overlap B', start_time: '2026-03-15T10:30:00Z', end_time: '2026-03-15T11:30:00Z' }),
            createMockEvent({ id: 3, title: 'All day', all_day: true, start_time: '2026-03-15T00:00:00Z', end_time: '2026-03-16T00:00:00Z' }),
        ];

        render(<ListView events={events} />);

        expect(screen.getByTestId('conflict-row')).toHaveTextContent('Overlap A, Overlap B');
        expect(screen.getByText('All day')).toBeInTheDocument();
    });

    it('renders non-overlapping day events as separate rows', () => {
        mockViewMode = 'day';
        const events = [
            createMockEvent({ id: 1, title: 'Morning', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T10:00:00Z' }),
            createMockEvent({ id: 2, title: 'Afternoon', start_time: '2026-03-15T11:30:00Z', end_time: '2026-03-15T12:00:00Z' }),
        ];

        render(<ListView events={events} />);

        expect(screen.getAllByTestId('event-row')).toHaveLength(2);
        expect(screen.queryByTestId('conflict-row')).not.toBeInTheDocument();
    });

    it('opens the page containing today when month view spans multiple day pages', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-08T12:00:00Z'));
        const events = Array.from({ length: 7 }, (_, index) =>
            createMockEvent({
                id: index + 1,
                title: `Event ${index + 1}`,
                start_time: `2026-03-0${index + 2}T10:00:00Z`,
                end_time: `2026-03-0${index + 2}T11:00:00Z`,
            }),
        );

        render(<ListView events={events} />);

        expect(screen.getByText('Event 7')).toBeInTheDocument();
        expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
        expect(screen.getByTestId('pagination')).toHaveTextContent('2/2');
    });

    it('does not reset the current page when month view rerenders with the same mode', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-08T12:00:00Z'));
        const genEvents = (idOffset, titlePrefix, dayOffset) => Array.from({ length: 7 }, (_, i) =>
            createMockEvent({ id: i + idOffset, title: `${titlePrefix} ${i + 1}`, start_time: `2026-03-0${i + dayOffset}T10:00:00Z`, end_time: `2026-03-0${i + dayOffset}T11:00:00Z` })
        );
        const firstEvents = genEvents(1, 'Initial', 2);
        const nextEvents = genEvents(21, 'Updated', 1);

        const { rerender } = render(<ListView events={firstEvents} />);
        expect(screen.getByTestId('pagination')).toHaveTextContent('2/2');

        rerender(<ListView events={nextEvents} />);

        expect(screen.getByTestId('pagination')).toHaveTextContent('2/2');
        expect(screen.getByText('Updated 6')).toBeInTheDocument();
        expect(screen.queryByText('Updated 1')).not.toBeInTheDocument();
    });

    it('auto-scrolls to today in grouped views when today is present', () => {
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
        const events = [
            createMockEvent({ id: 1, title: 'Yesterday', start_time: '2026-03-14T10:00:00Z', end_time: '2026-03-14T11:00:00Z' }),
            createMockEvent({ id: 2, title: 'Today event', start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:00:00Z' }),
        ];

        render(<ListView events={events} />);

        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });

    it('keeps shorter overlapping events in the same conflict group without extending max end time', () => {
        mockViewMode = 'day';
        const events = [
            createMockEvent({ id: 1, title: 'Long overlap', start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T12:00:00Z' }),
            createMockEvent({ id: 2, title: 'Short overlap', start_time: '2026-03-15T10:30:00Z', end_time: '2026-03-15T11:00:00Z' }),
        ];

        render(<ListView events={events} />);

        expect(screen.getByTestId('conflict-row')).toHaveTextContent('Long overlap, Short overlap');
    });

    it('renders all-day day-view events without leaving an unfinished trailing group', () => {
        mockViewMode = 'day';
        const events = [
            createMockEvent({ id: 1, title: 'Timed event', start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:00:00Z' }),
            createMockEvent({ id: 2, title: 'Late all day', all_day: true, start_time: '2026-03-15T23:59:00Z', end_time: '2026-03-16T23:59:00Z' }),
        ];

        render(<ListView events={events} />);

        expect(screen.getAllByTestId('event-row')).toHaveLength(2);
        expect(screen.queryByTestId('conflict-row')).not.toBeInTheDocument();
    });
});
