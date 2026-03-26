import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../context/CalendarContext', () => ({
    useEventPopup: vi.fn(() => ({ openPopup: vi.fn() })),
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => []),
}));

vi.mock('../../../../components/calendar/utils/eventStyleUtils', () => ({
    getEventTheme: vi.fn(() => ({ color: '#9E7E5D' })),
}));

vi.mock('../../../../components/calendar/week_view/components/allDayRowHelpers', () => ({
    calculateEventLayout: vi.fn((events) =>
        events.map((e, i) => ({ event: e, startCol: i + 1, endCol: i + 2, row: 1 }))
    ),
}));

import { AllDayRow } from '../../../../components/calendar/week_view/components/AllDayRow';
import { useEventPopup } from '../../../../context/CalendarContext';

const monday = new Date('2024-03-04T00:00:00Z');
const tuesday = new Date('2024-03-05T00:00:00Z');
const days = [monday, tuesday];

describe('AllDayRow', () => {
    it('renders the all-day label', () => {
        render(<AllDayRow days={days} events={[]} />);
        expect(screen.getByText('All-day')).toBeTruthy();
    });

    it('renders a cell for each day', () => {
        const { container } = render(<AllDayRow days={days} events={[]} />);
        const cells = container.querySelectorAll('.all-day-cell');
        expect(cells.length).toBe(2);
    });

    it('renders event bars for events', () => {
        const events = [
            { id: 1, title: 'Full Day Event', start_time: monday.toISOString() },
        ];
        render(<AllDayRow days={days} events={events} />);
        expect(screen.getByText('Full Day Event')).toBeTruthy();
    });

    it('clicking an event bar calls openPopup', () => {
        const openPopup = vi.fn();
        useEventPopup.mockReturnValue({ openPopup });
        const events = [
            { id: 2, title: 'Clickable Event', start_time: monday.toISOString() },
        ];
        render(<AllDayRow days={days} events={events} />);
        fireEvent.click(screen.getByText('Clickable Event'));
        expect(openPopup).toHaveBeenCalledWith(events[0], expect.any(Object));
    });
});
