import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../../../components/Calendar/Calendar';

vi.mock('../../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => ({ viewMode: 'month' })),
    CalendarProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../context/ResizeHighlightContext', () => ({
    ResizeHighlightProvider: ({ children }) => <div data-testid="resize-provider">{children}</div>,
}));

vi.mock('../../../components/Calendar/hooks/useCalendarEvents', () => ({
    useCalendarEvents: vi.fn(),
}));

vi.mock('../../../components/Calendar/DayView/DayView', () => ({
    DayView: () => <div data-testid="day-view">Day View</div>,
}));

vi.mock('../../../components/Calendar/WeekView/WeekView', () => ({
    WeekView: () => <div data-testid="week-view">Week View</div>,
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
    MonthView: () => <div data-testid="month-view">Month View</div>,
}));

vi.mock('../../../components/Calendar/YearView/YearView', () => ({
    YearView: () => <div data-testid="year-view">Year View</div>,
}));

import { useCalendar } from '../../../context/CalendarContext';

describe('Calendar', () => {
    it('renders ResizeHighlightProvider', () => {
        render(<Calendar />);
        expect(screen.getByTestId('resize-provider')).toBeTruthy();
    });

    it('renders MonthView when viewMode is month', () => {
        useCalendar.mockReturnValue({ viewMode: 'month' });
        render(<Calendar />);
        expect(screen.getByTestId('month-view')).toBeTruthy();
    });

    it('renders WeekView when viewMode is week', () => {
        useCalendar.mockReturnValue({ viewMode: 'week' });
        render(<Calendar />);
        expect(screen.getByTestId('week-view')).toBeTruthy();
    });

    it('renders DayView when viewMode is day', () => {
        useCalendar.mockReturnValue({ viewMode: 'day' });
        render(<Calendar />);
        expect(screen.getByTestId('day-view')).toBeTruthy();
    });

    it('renders YearView when viewMode is year', () => {
        useCalendar.mockReturnValue({ viewMode: 'year' });
        render(<Calendar />);
        expect(screen.getByTestId('year-view')).toBeTruthy();
    });

    it('renders nothing for unknown viewMode', () => {
        useCalendar.mockReturnValue({ viewMode: 'unknown' });
        render(<Calendar />);
        expect(screen.queryByTestId('month-view')).toBeNull();
        expect(screen.queryByTestId('week-view')).toBeNull();
    });
});
