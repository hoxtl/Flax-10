/**
 * Tests for EventRow - Expandable event row for list view.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventRow } from '../../../../components/Calendar/ListView/EventRow';
import { createMockEvent } from '../mocks/calendarMocks';

const mockOpenModal = vi.fn();
const mockQuickAction = { label: 'Join Meeting', onClick: vi.fn() };

vi.mock('../../../../context/CalendarContext', () => ({
    useEventModal: () => ({ openModal: mockOpenModal }),
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, name: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../components/Calendar/hooks/useQuickActions', () => ({
    useQuickActions: (event) => event.module ? mockQuickAction : null,
}));

vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: (e) => e.module ? 'module' : e.society_name ? 'society' : 'personal',
    isReadOnlyEvent: (e) => !!e.module || !!e.society_name,
    isAllDay: (e) => e.all_day,
}));

vi.mock('../../../../components/Calendar/utils/eventStyleUtils', () => ({
    getEventTheme: () => ({ color: '#7B6751' }),
}));

vi.mock('../../../../components/common/Badge/Badge', () => ({
    default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

vi.mock('../../../../components/common/PrimaryButton/PrimaryButton', () => ({
    default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

describe('EventRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.open = vi.fn();
    });

    it('renders event title', () => {
        render(<EventRow event={createMockEvent({ title: 'Meeting' })} />);
        expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    it('renders formatted time', () => {
        render(<EventRow event={createMockEvent({ start_time: '2026-03-15T14:30:00Z' })} />);
        expect(screen.getByText(/2:30/)).toBeInTheDocument();
    });

    it('renders All day for all-day events', () => {
        render(<EventRow event={createMockEvent({ all_day: true })} />);
        expect(screen.getByText('All day')).toBeInTheDocument();
    });

    it('expands on click to show details', () => {
        render(<EventRow event={createMockEvent({ description: 'Details here' })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Details here')).toBeInTheDocument();
    });

    it('collapses on second click', () => {
        render(<EventRow event={createMockEvent({ description: 'Details here' })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Details here')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.queryByText('Details here')).not.toBeInTheDocument();
    });

    it('shows Edit button for personal events', () => {
        render(<EventRow event={createMockEvent()} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('hides Edit button for read-only events', () => {
        render(<EventRow event={createMockEvent({ module: { id: 1, name: 'CS101' } })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('calls openModal when Edit clicked', () => {
        const event = createMockEvent();
        render(<EventRow event={event} />);
        fireEvent.click(screen.getByText('Test Event'));
        fireEvent.click(screen.getByText('Edit'));
        expect(mockOpenModal).toHaveBeenCalledWith(event);
    });

    it('renders Get directions button', () => {
        render(<EventRow event={createMockEvent()} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Get directions')).toBeInTheDocument();
    });

    it('opens map on Get directions click', () => {
        render(<EventRow event={createMockEvent()} />);
        fireEvent.click(screen.getByText('Test Event'));
        fireEvent.click(screen.getByText('Get directions'));
        expect(window.open).toHaveBeenCalledWith('/map', '_blank', 'noopener,noreferrer');
    });

    it('shows quick action for module events', () => {
        render(<EventRow event={createMockEvent({ module: { id: 1, name: 'CS101' } })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Join Meeting')).toBeInTheDocument();
    });

    it('calls quick action onClick when clicked', () => {
        render(<EventRow event={createMockEvent({ module: { id: 1, name: 'CS101' } })} />);
        fireEvent.click(screen.getByText('Test Event'));
        fireEvent.click(screen.getByText('Join Meeting'));
        expect(mockQuickAction.onClick).toHaveBeenCalled();
    });

    it('renders tag badge when tag_name present', () => {
        render(<EventRow event={createMockEvent({ tag_name: 'Lecture' })} />);
        expect(screen.getByText('Lecture')).toBeInTheDocument();
    });

    it('renders source badge for module events', () => {
        render(<EventRow event={createMockEvent({ module: { id: 1, name: 'CS101' } })} />);
        expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('renders source badge for society events', () => {
        render(<EventRow event={createMockEvent({ society_name: 'Chess Club' })} />);
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('shows location in detail view', () => {
        render(<EventRow event={createMockEvent({ location: 'Room 101' })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('Room 101')).toBeInTheDocument();
    });

    it('shows dash for empty location', () => {
        render(<EventRow event={createMockEvent({ location: '' })} />);
        fireEvent.click(screen.getByText('Test Event'));
        const locationValue = screen.getAllByText('-')[0];
        expect(locationValue).toBeInTheDocument();
    });

    it('renders time range in detail view', () => {
        render(<EventRow event={createMockEvent({ start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:30:00Z' })} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
    });

    it('renders chevron indicating expand state', () => {
        render(<EventRow event={createMockEvent()} />);
        expect(screen.getByText('▼')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Test Event'));
        expect(screen.getByText('▲')).toBeInTheDocument();
    });

    it('stops propagation on Edit click', () => {
        const event = createMockEvent();
        render(<EventRow event={event} />);
        fireEvent.click(screen.getByText('Test Event'));
        const collapseCheck = screen.getByText('▲');
        fireEvent.click(screen.getByText('Edit'));
        expect(collapseCheck).toBeInTheDocument();
    });
});
