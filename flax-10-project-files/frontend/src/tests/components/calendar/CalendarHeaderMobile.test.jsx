import React from 'react';
import { render, screen, fireEvent } from '../../../utils/testUtils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarHeader } from '../../../components/calendar/CalendarHeader';
import * as CalendarContextModule from '../../../context/CalendarContext';
import { TagProvider } from '../../../context/TagContext';

vi.mock('../../../api/eventApi', () => ({
    getEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/timetableApi', () => ({
    importTimetable: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../api/tagApi', () => ({
    getTags: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../components/calendar/header/CalendarHeaderUtils', () => ({
    CalendarNav: ({ onPrev, onNext, onToday, showToday, selectedDate, onDatePick, title }) => (
        <div className="nav">
            <button type="button" onClick={onPrev}>&lt;</button>
            {showToday && <button type="button" className="today" onClick={onToday}>Today</button>}
            <button type="button" onClick={onNext}>&gt;</button>
            <button type="button" onClick={() => onDatePick(selectedDate)}>pick</button>
            {title != null && <h2>{title}</h2>}
        </div>
    ),
    ViewSwitcher: ({ modes, activeMode, onChange }) => (
        <select role="combobox" value={activeMode} onChange={e => onChange(e.target.value)}>
            {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
    ),
    ActionMenu: () => null,
    ViewSettingsMenu: () => null,
    ViewModeButton: ({ modes, activeMode, onChange }) => (
        <select data-testid="mobile-view-mode" value={activeMode} onChange={e => onChange(e.target.value)}>
            {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
    ),
    SearchButton: () => null,
    FilterDropdownButton: () => null,
    ScheduleManagerButton: () => null,
}));

vi.mock('../../../components/notifications/hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockOpenModal = vi.fn();

vi.mock('../../../context/CalendarContext', async () => {
    const actual = await vi.importActual('../../../context/CalendarContext');
    return {
        ...actual,
        useCalendar: vi.fn(),
        useCalendarDispatch: () => mockDispatch,
        useEventModal: () => ({ openModal: mockOpenModal }),
    };
});

// Mock useBreakpoint to control mobile mode
vi.mock('../../../hooks/useBreakpoint', () => ({
    default: vi.fn(() => true),
}));

import useBreakpoint from '../../../hooks/useBreakpoint';

describe('CalendarHeaderMobile', () => {
    const defaultDate = new Date(2026, 1, 15); // Feb 15 2026

    const setup = (state = {}) => {
        const baseState = { selectedDate: defaultDate, viewMode: 'month', ...state };
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(baseState);
        render(
            <TagProvider>
                <CalendarHeader />
            </TagProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useBreakpoint).mockReturnValue(true);
    });

    // Mobile mode (isMobile = true)

    it('renders MobileTitle when isMobile is true', () => {
        setup({ viewMode: 'month' });
        const mobileTitle = document.querySelector('.mobile-title-row');
        expect(mobileTitle).toBeInTheDocument();
        expect(mobileTitle.querySelector('.title')).toBeInTheDocument();
    });

    it('does NOT render DesktopViewSwitcher when isMobile is true', () => {
        setup({ viewMode: 'month' });
        // Desktop switcher renders inside .header-center which contains a combobox
        const headerCenter = document.querySelector('.header-center');
        expect(headerCenter).not.toBeInTheDocument();
    });

    it('renders MobileDateStrip (date-strip-wrapper) when isMobile is true', () => {
        setup({ viewMode: 'day' });
        expect(document.querySelector('.date-strip-wrapper')).toBeInTheDocument();
    });

    it('renders ViewModeButton (mobile-view-mode select) when isMobile is true', () => {
        setup({ viewMode: 'month' });
        expect(screen.getByTestId('mobile-view-mode')).toBeInTheDocument();
    });

    it('does not include week option in mobile view mode selector', () => {
        setup({ viewMode: 'day' });
        const select = screen.getByTestId('mobile-view-mode');
        const options = Array.from(select.querySelectorAll('option')).map(o => o.value);
        expect(options).not.toContain('week');
        expect(options).toContain('day');
        expect(options).toContain('month');
    });

    it('does not dispatch SET_VIEW_MODE for week when isMobile', () => {
        setup({ viewMode: 'day' });
        const select = screen.getByTestId('mobile-view-mode');
        // Attempt to switch to week (even though the option shouldn't be there,
        // we can fire the change directly to test the guard)
        fireEvent.change(select, { target: { value: 'week' } });
        expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'week' });
    });

    it('dispatches SET_VIEW_MODE for day when isMobile', () => {
        setup({ viewMode: 'month' });
        const select = screen.getByTestId('mobile-view-mode');
        fireEvent.change(select, { target: { value: 'day' } });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('does not pass title to CalendarNav on mobile', () => {
        setup({ viewMode: 'month' });
        // CalendarNav only renders <h2> when title != null
        const navH2 = document.querySelector('.nav h2');
        expect(navH2).not.toBeInTheDocument();
    });

    it('renders date cards for each week day in mobile mode', () => {
        setup({ viewMode: 'day', selectedDate: defaultDate });
        const cards = document.querySelectorAll('.date-card');
        expect(cards.length).toBe(7);
    });

    it('applies active class to the date card matching selectedDate', () => {
        setup({ viewMode: 'day', selectedDate: defaultDate });
        const activeCard = document.querySelector('.date-card.active');
        expect(activeCard).toBeInTheDocument();
        // The active card should display the day number 15
        expect(activeCard.querySelector('.day-number').textContent).toBe('15');
    });

    it('clicking a date card dispatches SET_SELECTED_DATE and SET_VIEW_MODE=day', () => {
        setup({ viewMode: 'month', selectedDate: defaultDate });
        const cards = document.querySelectorAll('.date-card');
        fireEvent.click(cards[0]);
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_SELECTED_DATE' }));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('renders day name and day number inside each DateCard', () => {
        setup({ viewMode: 'day', selectedDate: defaultDate });
        const firstCard = document.querySelectorAll('.date-card')[0];
        expect(firstCard.querySelector('.day-name')).toBeInTheDocument();
        expect(firstCard.querySelector('.day-number')).toBeInTheDocument();
    });
});
