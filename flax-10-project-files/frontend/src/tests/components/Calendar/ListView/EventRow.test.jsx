/**
 * Tests for EventRow - Expandable event row for list view.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventRow } from '../../../../components/Calendar/ListView/EventRow';
import { createMockEvent } from '../mocks/calendarMocks';

const mockOpenPopup = vi.fn();
const mockOpenModal = vi.fn();

vi.mock('../../../../context/CalendarContext', () => ({
    useEventModal: () => ({ openModal: mockOpenModal }),
    useEventPopup: () => ({ openPopup: mockOpenPopup }),
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, name: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: (e) => e.module ? 'module' : e.society_name ? 'society' : 'personal',
    isReadOnlyEvent: (e) => !!e.module || !!e.society_name,
    isAllDay: (e) => e.all_day,
}));

vi.mock('../../../../components/Calendar/utils/eventStyleUtils', () => ({
    getEventTheme: () => ({ color: '#7B6751' }),
}));

vi.mock('../../../../components/Common/Badge/Badge', () => ({
    default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

describe('EventRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('calls openPopup on click', () => {
        const event = createMockEvent({ title: 'Test Event' });
        render(<EventRow event={event} />);
        fireEvent.click(screen.getByText('Test Event'));
        expect(mockOpenPopup).toHaveBeenCalledWith(event, expect.any(Object));
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
});
