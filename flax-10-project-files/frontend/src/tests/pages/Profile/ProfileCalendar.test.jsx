import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileCalendar } from '../../../pages/Profile/ProfileCalendar';

vi.mock('../../../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
    useCalendar: vi.fn(() => ({ selectedDate: new Date('2024-03-08') })),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../../context/ResizeHighlightContext', () => ({
    ResizeHighlightProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/Calendar/MonthView/MonthView', () => ({
    MonthView: ({ readOnly }) => <div data-testid="month-view" data-readonly={String(readOnly)} />,
}));

vi.mock('../../../components/Calendar/EventPopups', () => ({
    EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock('../../../components/Calendar/EventsSummaryModal/EventsSummaryModal', () => ({
    EventsSummaryModal: ({ isOpen }) => isOpen ? <div data-testid="summary-modal" /> : null,
}));

vi.mock('../../../components/Calendar/header/NavigationButtons', () => ({
    NavigationButtons: () => <div data-testid="nav-buttons" />,
}));

vi.mock('../../../components/Calendar/header/CalendarHeaderUtils', () => ({
    CalendarNav: ({ title }) => <div data-testid="nav-buttons">{title}</div>,
}));

vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
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
});
