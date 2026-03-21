/**
 * Tests for ListView - Calendar list view with grouped daily sections.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListView } from '../../../../components/Calendar/ListView/ListView';
import { createMockEvent } from '../mocks/calendarMocks';

let mockViewMode = 'month';
let mockEvents = [];

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: ({ events }) => ({ events: events || mockEvents, viewMode: mockViewMode, selectedDate: new Date(2026, 2, 15) }),
}));

vi.mock('../../../../hooks/usePagination', () => ({
    usePagination: (items, size) => ({ currentPage: 1, totalPages: Math.ceil(items.length / size) || 1, currentItems: items.slice(0, size), setPage: vi.fn() }),
}));

vi.mock('../../../../components/Calendar/ListView/EventRow', () => ({
    EventRow: ({ event }) => <div data-testid="event-row">{event.title}</div>,
}));

vi.mock('../../../../components/Pagination/Pagination', () => ({
    Pagination: ({ currentPage, totalPages }) => <div data-testid="pagination">{currentPage}/{totalPages}</div>,
    BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({
    getEffectiveTagName: (e) => e.tag_name || 'default',
    sortByStartTime: (events) => [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
}));

describe('ListView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEvents = [];
        mockViewMode = 'month';
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders empty state when no events', () => {
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
});
