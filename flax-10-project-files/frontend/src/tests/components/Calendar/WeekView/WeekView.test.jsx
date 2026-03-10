import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const dispatchMock = vi.fn();
vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarData: vi.fn(({ selectedDate, events }) => ({
        selectedDate: selectedDate || new Date('2024-03-04'),
        events: events || [],
    })),
    useCalendarDispatch: vi.fn(() => dispatchMock),
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
import * as dateUtils from '../../../../components/Calendar/utils/dateUtils';

const date = new Date('2024-03-04');

describe('WeekView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    it('day header click calls onDateSelect when provided', () => {
        const onDateSelect = vi.fn();
        render(<WeekView selectedDate={date} events={[]} onDateSelect={onDateSelect} readOnly={false} />);
        const dayNumbers = document.querySelectorAll('.day-number');
        expect(dayNumbers.length).toBe(7);
        fireEvent.click(dayNumbers[1]);
        expect(onDateSelect).toHaveBeenCalledTimes(1);
        expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
        expect(onDateSelect.mock.calls[0][0].toISOString().slice(0, 10)).toBe('2024-03-05');
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it('day header click dispatches when onDateSelect not provided', () => {
        render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        const dayNumbers = document.querySelectorAll('.day-number');
        fireEvent.click(dayNumbers[0]);
        expect(dispatchMock).toHaveBeenCalledWith({ type: 'SET_SELECTED_DATE', payload: expect.any(Date) });
        expect(dispatchMock).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
        expect(dispatchMock.mock.calls[0][0].payload.toISOString().slice(0, 10)).toBe('2024-03-04');
    });

    it('applies is-today class when day matches today', () => {
        vi.mocked(dateUtils.isSameDay).mockImplementation((day) => day.getDate() === 5);
        const { container } = render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        const todayCells = container.querySelectorAll('.day-header.is-today');
        expect(todayCells.length).toBe(1);
        expect(todayCells[0].querySelector('.day-number').textContent).toBe('5');
    });

    it('renders week header with day names', () => {
        render(<WeekView selectedDate={date} events={[]} readOnly={false} />);
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('filters events for week via getEventsForWeek', () => {
        const weekStart = new Date('2024-03-04T00:00:00');
        const weekEnd = new Date('2024-03-10T23:59:59');
        const eventsInWeek = [
            { id: 1, start_time: new Date('2024-03-05T10:00:00').toISOString(), end_time: new Date('2024-03-05T11:00:00').toISOString() },
            { id: 2, start_time: new Date('2024-03-07T14:00:00').toISOString(), end_time: new Date('2024-03-07T15:00:00').toISOString() },
        ];
        vi.mocked(dateUtils.overlapsDay).mockImplementation((start, end, d) => {
            const dayStr = d.toISOString().slice(0, 10);
            return [1, 2].some(id => {
                const s = eventsInWeek.find(e => e.id === id);
                if (!s) return false;
                const es = new Date(s.start_time);
                const ee = new Date(s.end_time);
                return es.toISOString().slice(0, 10) <= dayStr && ee.toISOString().slice(0, 10) >= dayStr;
            });
        });
        const { getAllByTestId } = render(<WeekView selectedDate={date} events={eventsInWeek} readOnly={false} />);
        expect(getAllByTestId('day-column').length).toBe(7);
    });
});
