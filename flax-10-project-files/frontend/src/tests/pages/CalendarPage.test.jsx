import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CalendarPage from '../../pages/Calendar/CalendarPage';

const mockDispatch = vi.fn();
const mockCalendarState = {
    filter: 'all',
    allEvents: [],
    selectedDate: new Date('2025-01-15'),
    viewMode: 'month',
};

vi.mock('../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => mockCalendarState),
    useCalendarDispatch: vi.fn(() => mockDispatch),
}));

vi.mock('../../components/Calendar/Calendar', () => ({
    Calendar: () => <div data-testid="calendar" />,
}));

vi.mock('../../components/Tags/PillFilters', () => ({
    default: ({ active, onChange, items }) => (
        <div data-testid="pill-filters">
            <span data-testid="active-filter">{active}</span>
            <button onClick={() => onChange('work')}>Work</button>
        </div>
    ),
}));

vi.mock('../../components/Calendar/CalendarHeader', () => ({
    CalendarHeader: () => <div data-testid="calendar-header" />,
}));

vi.mock('../../components/Calendar/EventPopups', () => ({
    EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock('../../components/Calendar/hooks/useEventPopupListener', () => ({
    useEventPopupListener: vi.fn(),
}));

vi.mock('../../components/Calendar/utils/eventUtils', () => ({
    getVisibleEventsInView: vi.fn(() => []),
}));

import { useCalendar } from '../../context/CalendarContext';

describe('CalendarPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCalendar.mockReturnValue(mockCalendarState);
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    });

    it('renders calendar header', () => {
        render(<CalendarPage />);
        expect(screen.getByTestId('calendar-header')).toBeTruthy();
    });

    it('renders the calendar', () => {
        render(<CalendarPage />);
        expect(screen.getByTestId('calendar')).toBeTruthy();
    });

    it('renders pill filters', () => {
        render(<CalendarPage />);
        expect(screen.getByTestId('pill-filters')).toBeTruthy();
    });

    it('renders event popups', () => {
        render(<CalendarPage />);
        expect(screen.getByTestId('event-popups')).toBeTruthy();
    });

    it('shows active filter', () => {
        render(<CalendarPage />);
        expect(screen.getByTestId('active-filter').textContent).toBe('all');
    });

    it('dispatches SET_FILTER when filter changes', () => {
        render(<CalendarPage />);
        screen.getByText('Work').click();
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_FILTER', payload: 'work' });
    });

    it('redirects week view to day view on mobile', async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 600 });
        useCalendar.mockReturnValue({ ...mockCalendarState, viewMode: 'week' });
        render(<CalendarPage />);
        // Trigger resize event
        act(() => {
            window.dispatchEvent(new Event('resize'));
        });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('does not redirect on desktop even in week view', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
        useCalendar.mockReturnValue({ ...mockCalendarState, viewMode: 'week' });
        render(<CalendarPage />);
        expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('cleans up resize listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(<CalendarPage />);
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        removeSpy.mockRestore();
    });
});
