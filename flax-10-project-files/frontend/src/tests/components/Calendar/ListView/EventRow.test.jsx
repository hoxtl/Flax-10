/**
 * Tests for EventRow - Expandable event row for list view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictRow, EventRow, TagBadge, formatEventTime, getTagBadges } from '../../../../components/Calendar/ListView/EventRow';
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

vi.mock('../../../../components/common/Badge/Badge', () => ({
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

    it('formats time and badges using fallback fields', () => {
        expect(formatEventTime(createMockEvent({ all_day: true }))).toBe('All day');
        expect(formatEventTime(createMockEvent({ start_time: '2026-03-15T09:05:00Z' }))).toMatch(/9:05/);
        expect(getTagBadges(createMockEvent({ tag: { name: 'Seminar' } }), '#123456')).toEqual([
            { label: 'Seminar', type: 'tag', color: '#123456' },
        ]);
        expect(getTagBadges(createMockEvent({ society_name: 'Chess Club', society_color: '#abcdef' }), '#111111')).toContainEqual({
            label: 'Chess Club',
            type: 'source',
            color: '#abcdef',
        });
    });

    it('renders standalone badge styles for source and tag badges', () => {
        const { rerender } = render(<TagBadge badge={{ label: 'Tag', type: 'tag', color: '#101010' }} />);
        expect(screen.getByTestId('badge')).toHaveTextContent('Tag');

        rerender(<TagBadge badge={{ label: 'Source', type: 'source' }} />);
        expect(screen.getByTestId('badge')).toHaveTextContent('Source');
    });

    it('renders conflict rows and opens the popup for the clicked conflict event', () => {
        const first = createMockEvent({ id: 1, title: 'First clash' });
        const second = createMockEvent({ id: 2, title: 'Second clash', society_name: 'Debate Club' });

        render(<ConflictRow events={[first, second]} />);

        fireEvent.click(screen.getByText('Second clash'));
        expect(mockOpenPopup).toHaveBeenCalledWith(second, expect.any(Object));
    });
});
