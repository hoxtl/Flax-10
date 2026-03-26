import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../../context/CalendarContext', () => ({
    useCalendarData: vi.fn(({ selectedDate, events }) => ({
        selectedDate: selectedDate || new Date('2024-03-04'),
        events: events || [],
    })),
    useEventPopup: vi.fn(() => ({ openPopup: vi.fn() })),
}));

vi.mock('../../../components/Calendar/hooks/useAutoScroll', () => ({
    useAutoScroll: vi.fn(() => ({ scrollRef: { current: null } })),
}));

vi.mock('../../../components/Calendar/week_view/components/AllDayRow', () => ({
    AllDayRow: ({ days, events }) => (
        <div data-testid="all-day-row" data-days={days.length} data-events={events.length} />
    ),
}));

vi.mock('../../../components/Calendar/DraggableEvent', () => ({
    DraggableEvent: ({ event, readOnly }) => (
        <div data-testid="draggable-event" data-readonly={String(readOnly)}>{event.title}</div>
    ),
}));

vi.mock('../../../components/Calendar/day_view/dayViewHelpers', () => ({
    getHoursOfDay: vi.fn(() => [8, 9, 10]),
    calculateEventStyle: vi.fn(() => ({ top: 0, height: 60 })),
    formatHour: vi.fn(h => `${h}:00`),
}));

vi.mock('../../../components/Calendar/day_view/TimeSlot', () => ({
    TimeSlot: ({ hour, readOnly }) => (
        <div data-testid="time-slot" data-hour={hour} data-readonly={String(readOnly)} />
    ),
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
    overlapsDay: vi.fn(() => true),
    isSameDay: vi.fn(() => true),
}));

vi.mock('../../../components/Calendar/utils/eventDisplayUtils', () => ({
    shouldShowInTimeGrid: vi.fn(() => true),
    getAllDayVisualRange: vi.fn(() => ({ startCol: 1, endCol: 2 })),
}));

vi.mock('../../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { DayView } from '../../../components/Calendar/day_view/DayView';

const date = new Date('2024-03-04');

describe('DayView', () => {
    it('renders without crashing', () => {
        const { container } = render(<DayView selectedDate={date} events={[]} readOnly={false} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders AllDayRow', () => {
        const { getByTestId } = render(<DayView selectedDate={date} events={[]} readOnly={false} />);
        expect(getByTestId('all-day-row')).toBeTruthy();
    });

    it('renders time slots for each hour', () => {
        const { getAllByTestId } = render(<DayView selectedDate={date} events={[]} readOnly={false} />);
        const slots = getAllByTestId('time-slot');
        expect(slots.length).toBe(3); // mocked 3 hours
    });

    it('renders in readOnly mode', () => {
        const { container } = render(<DayView selectedDate={date} events={[]} readOnly={true} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders events', () => {
        const events = [
            { id: 1, title: 'Meeting', start_time: '2024-03-04T09:00:00Z', end_time: '2024-03-04T10:00:00Z' },
        ];
        const { getByTestId } = render(<DayView selectedDate={date} events={events} readOnly={false} />);
        expect(getByTestId('draggable-event')).toBeTruthy();
    });
});
