import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: vi.fn(({ selectedDate, events }) => ({
        selectedDate: selectedDate || new Date('2024-03-04'),
        events: events || [],
    })),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../components/Calendar/WeekView/DayColumn', () => ({
    DayColumn: ({ date }) => <div data-testid="day-column" data-date={date.toISOString().slice(0, 10)} />,
}));

vi.mock('../../../../components/Calendar/WeekView/components/AllDayRow', () => ({
    AllDayRow: ({ days }) => <div data-testid="all-day-row" data-days={days.length} />,
}));

vi.mock('../../../../components/Calendar/WeekView/TimeLabels', () => ({
    TimeLabels: () => <div data-testid="time-labels" />,
}));

vi.mock('../../../../components/Calendar/hooks/useAutoScroll', () => ({
    useAutoScroll: vi.fn(),
}));

vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
    getWeekDays: vi.fn(() => [
        new Date('2024-03-04'),
        new Date('2024-03-05'),
        new Date('2024-03-06'),
        new Date('2024-03-07'),
        new Date('2024-03-08'),
        new Date('2024-03-09'),
        new Date('2024-03-10'),
    ]),
    isSameDay: vi.fn((a, b) => a.toDateString() === b.toDateString()),
    overlapsDay: vi.fn(() => true),
}));

vi.mock('../../../../components/Calendar/utils/eventDisplayUtils', () => ({
    shouldShowInTimeGrid: vi.fn(() => true),
}));

vi.mock('../../../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { WeekView } from '../../../../components/Calendar/WeekView/WeekView';

const date = new Date('2024-03-04');

describe('WeekView', () => {
    it('renders without crashing', () => {
        const { container } = render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders AllDayRow', () => {
        const { getByTestId } = render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        expect(getByTestId('all-day-row')).toBeTruthy();
    });

    it('renders TimeLabels', () => {
        const { getByTestId } = render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        expect(getByTestId('time-labels')).toBeTruthy();
    });

    it('renders 7 DayColumns', () => {
        const { getAllByTestId } = render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        const cols = getAllByTestId('day-column');
        expect(cols.length).toBe(7);
    });

    it('renders in readOnly mode', () => {
        const { container } = render(<WeekView selectedDate={date} events={[]} readOnly={true} />);
        expect(container.firstChild).toBeTruthy();
    });
});
