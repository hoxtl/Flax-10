import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '../../../components/calendar/Calendar';

vi.mock('../../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => ({ viewMode: 'month' })),
    useCalendarDispatch: vi.fn(() => vi.fn()),
    CalendarProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../context/ResizeHighlightContext', () => ({
    ResizeHighlightProvider: ({ children }) => <div data-testid="resize-provider">{children}</div>,
}));

vi.mock('../../../components/calendar/hooks/useCalendarEvents', () => ({
    useCalendarEvents: vi.fn(),
}));

vi.mock('../../../components/calendar/day_view/DayView', () => ({
    DayView: ({ readOnly }) => <div data-testid="day-view">{`Day View ${String(readOnly)}`}</div>,
}));

vi.mock('../../../components/calendar/week_view/WeekView', () => ({
    WeekView: ({ readOnly }) => <div data-testid="week-view">{`Week View ${String(readOnly)}`}</div>,
}));

vi.mock('../../../components/calendar/month_view/SwipeMonthView', () => ({
    SwipeMonthView: ({ readOnly }) => <div data-testid="month-view">{`Month View ${String(readOnly)}`}</div>,
}));

vi.mock('../../../components/calendar/list_view/ListView', () => ({
    ListView: ({ readOnly }) => <div data-testid="list-view">{`List View ${String(readOnly)}`}</div>,
}));

vi.mock('../../../components/calendar/table_view/TableView', () => ({
    TableView: ({ readOnly }) => <div data-testid="table-view">{`Table View ${String(readOnly)}`}</div>,
}));

import { useCalendar } from '../../../context/CalendarContext';
import { useCalendarEvents } from '../../../components/calendar/hooks/useCalendarEvents';

describe('Calendar', () => {
    it('renders ResizeHighlightProvider', () => {
        render(<Calendar />);
        expect(screen.getByTestId('resize-provider')).toBeTruthy();
    });

    it('renders MonthView when viewMode is month', () => {
        useCalendar.mockReturnValue({ viewMode: 'month', displayMode: 'grid', readOnly: false });
        render(<Calendar />);
        expect(screen.getByTestId('month-view')).toBeTruthy();
    });

    it('renders WeekView when viewMode is week', () => {
        useCalendar.mockReturnValue({ viewMode: 'week', displayMode: 'grid', readOnly: false });
        render(<Calendar />);
        expect(screen.getByTestId('week-view')).toBeTruthy();
    });

    it('renders DayView when viewMode is day', () => {
        useCalendar.mockReturnValue({ viewMode: 'day', displayMode: 'grid', readOnly: true });
        render(<Calendar />);
        expect(screen.getByTestId('day-view')).toBeTruthy();
        expect(screen.getByText('Day View true')).toBeInTheDocument();
    });

    it('renders the list display mode over grid modes', () => {
        useCalendar.mockReturnValue({ viewMode: 'month', displayMode: 'list', readOnly: true });
        render(<Calendar />);
        expect(screen.getByText('List View true')).toBeInTheDocument();
    });

    it('renders the table display mode over grid modes', () => {
        useCalendar.mockReturnValue({ viewMode: 'week', displayMode: 'table', readOnly: false });
        render(<Calendar />);
        expect(screen.getByText('Table View false')).toBeInTheDocument();
    });

    it('subscribes to calendar events when rendering content', () => {
        useCalendar.mockReturnValue({ viewMode: 'month', displayMode: 'grid', readOnly: false });
        render(<Calendar />);
        expect(useCalendarEvents).toHaveBeenCalled();
    });

    it('renders nothing for unknown viewMode', () => {
        useCalendar.mockReturnValue({ viewMode: 'unknown', displayMode: 'grid', readOnly: false });
        render(<Calendar />);
        expect(screen.queryByTestId('month-view')).toBeNull();
        expect(screen.queryByTestId('week-view')).toBeNull();
    });
});
