import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCalendar } from '../../../pages/profile/ProfileCalendar';
import { useCalendarDispatch } from '../../../context/CalendarContext';

vi.mock('../../../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
    useCalendar: vi.fn(() => ({ selectedDate: new Date('2024-03-08') })),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../../context/ResizeHighlightContext', () => ({
    ResizeHighlightProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/calendar/month_view/MonthView', () => ({
    MonthView: ({ readOnly, onMoreClick }) => (
        <div data-testid="month-view" data-readonly={String(readOnly)}>
            <button type="button" onClick={() => onMoreClick && onMoreClick(new Date('2024-03-08'))}>
                Open day summary
            </button>
        </div>
    ),
}));

vi.mock('../../../components/calendar/EventPopups', () => ({
    EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock('../../../components/calendar/events_summary_modal/EventsSummaryModal', () => ({
    EventsSummaryModal: ({ isOpen }) => isOpen ? <div data-testid="summary-modal" /> : null,
}));

vi.mock('../../../components/calendar/header/NavigationButtons', () => ({
    NavigationButtons: () => <div data-testid="nav-buttons" />,
}));

vi.mock('../../../components/calendar/header/calendarHeaderUtils', () => ({
    CalendarNav: ({ onPrev, onNext, onToday, title }) => (
        <div data-testid="nav-buttons">
            <span>{title}</span>
            <button type="button" onClick={() => onPrev?.()}>Prev</button>
            <button type="button" onClick={() => onNext?.()}>Next</button>
            <button type="button" onClick={() => onToday?.()}>Today</button>
        </div>
    ),
}));

vi.mock('../../../components/calendar/utils/dateUtils', () => ({
    addMonths: vi.fn((d, n) => d),
    formatMonthYear: vi.fn(() => 'March 2024'),
    isSameMonth: vi.fn(() => false),
}));

describe('ProfileCalendar', () => {
    it('renders within CalendarProvider', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.getByTestId('calendar-provider')).toBeTruthy();
    });

    it('renders MonthView in readOnly mode', () => {
        render(<ProfileCalendar allEvents={[]} />);
        const monthView = screen.getByTestId('month-view');
        expect(monthView.getAttribute('data-readonly')).toBe('true');
    });

    it('renders EventPopups', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.getByTestId('event-popups')).toBeTruthy();
    });

    it('renders navigation buttons', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.getByTestId('nav-buttons')).toBeTruthy();
    });

    it('renders month/year title', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.getByText('March 2024')).toBeTruthy();
    });

    it('summary modal is not visible by default', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.queryByTestId('summary-modal')).toBeNull();
    });

    it('summary modal opens when onMoreClick is triggered', () => {
        render(<ProfileCalendar allEvents={[]} />);
        expect(screen.queryByTestId('summary-modal')).toBeNull();
        fireEvent.click(screen.getByText('Open day summary'));
        expect(screen.getByTestId('summary-modal')).toBeTruthy();
    });

    it('calendar nav prev/next/today call dispatch', () => {
        const dispatch = vi.fn();
        vi.mocked(useCalendarDispatch).mockReturnValue(dispatch);
        render(<ProfileCalendar allEvents={[]} />);
        fireEvent.click(screen.getByText('Prev'));
        expect(dispatch).toHaveBeenCalled();
        fireEvent.click(screen.getByText('Next'));
        expect(dispatch).toHaveBeenCalled();
        fireEvent.click(screen.getByText('Today'));
        expect(dispatch).toHaveBeenCalled();
    });
});
