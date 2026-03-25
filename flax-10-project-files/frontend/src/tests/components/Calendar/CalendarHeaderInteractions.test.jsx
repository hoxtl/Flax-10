import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarHeader } from '../../../components/Calendar/CalendarHeader';
import * as CalendarContextModule from '../../../context/CalendarContext';
import { TagProvider } from '../../../context/TagContext';
import { importTimetable } from '../../../api/timetableApi';
import { getEvents } from '../../../api/eventApi';

vi.mock('../../../api/eventApi', () => ({
    getEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/timetableApi', () => ({
    importTimetable: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../api/tagApi', () => ({
    getTags: vi.fn(() => Promise.resolve([])),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
}));

vi.mock('../../../components/Calendar/header/CalendarHeaderUtils', () => ({
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
    ActionMenu: ({ onAddEvent, onImport }) => (
        <>
            <button type="button" onClick={onAddEvent}>+</button>
            <button type="button" onClick={onImport}>Import timetable</button>
        </>
    ),
    ViewSettingsMenu: () => null,
    ViewModeButton: ({ modes, activeMode, onChange }) => (
        <select data-testid="mobile-view-mode" value={activeMode} onChange={e => onChange(e.target.value)}>
            {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
    ),
    SearchButton: ({ value, onChange }) => (
        <input placeholder="Search" value={value} onChange={e => onChange(e.target.value)} />
    ),
    FilterDropdownButton: ({ active, onChange, allowManageTags }) => (
        <button type="button" onClick={() => onChange('work')}>
            Filter {Array.isArray(active) ? active.join(',') : active}
        </button>
    ),
    ScheduleManagerButton: () => <button type="button">Reschedule my events</button>,
}));

vi.mock('../../../components/Notifications/hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

vi.mock('../../../components/TimetableImportModal', () => {
    const React = require('react');
    function MockTimetableImportModal({ onClose, onImport }) {
        const [url, setUrl] = React.useState('');
        return (
            <div>
                <h2>Import Timetable</h2>
                <input placeholder="https://example.com/timetable.ics" value={url} onChange={e => setUrl(e.target.value)} />
                <button type="button" onClick={onClose}>Close</button>
                <button type="button" onClick={() => onImport(url)}>Import</button>
            </div>
        );
    }
    return { default: MockTimetableImportModal };
});

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
    default: vi.fn(() => false),
}));

import useBreakpoint from '../../../hooks/useBreakpoint';

describe('CalendarHeader extra coverage', () => {
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
        vi.mocked(useBreakpoint).mockReturnValue(false);
    });

    // -----------------------------------------------------------------------
    // getDayDelta / navigateDate in day view
    // -----------------------------------------------------------------------

    it('navigates forward by 1 day in day view', () => {
        setup({ viewMode: 'day' });
        fireEvent.click(screen.getByText('>'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getDate()).toBe(16);
    });

    it('navigates backward by 1 day in day view', () => {
        setup({ viewMode: 'day' });
        fireEvent.click(screen.getByText('<'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getDate()).toBe(14);
    });

    it('navigates forward by 7 days in week view', () => {
        setup({ viewMode: 'week' });
        fireEvent.click(screen.getByText('>'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getDate()).toBe(22); // 15 + 7
    });

    it('navigates backward by 7 days in week view', () => {
        setup({ viewMode: 'week' });
        fireEvent.click(screen.getByText('<'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getDate()).toBe(8); // 15 - 7
    });

    it('navigates months in month view (next)', () => {
        setup({ viewMode: 'month' });
        fireEvent.click(screen.getByText('>'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getMonth()).toBe(2); // March
    });

    it('navigates months in month view (prev)', () => {
        setup({ viewMode: 'month' });
        fireEvent.click(screen.getByText('<'));
        const call = mockDispatch.mock.calls[0][0];
        expect(call.type).toBe('SET_SELECTED_DATE');
        expect(call.payload.getMonth()).toBe(0); // January
    });

    // -----------------------------------------------------------------------
    // isTodayVisible for day view
    // -----------------------------------------------------------------------

    it('hides Today button when day view shows today', () => {
        const today = new Date();
        setup({ viewMode: 'day', selectedDate: today });
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('shows Today button when day view shows a different day', () => {
        setup({ viewMode: 'day', selectedDate: new Date(2020, 0, 1) });
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // isTodayVisible for week view
    // -----------------------------------------------------------------------

    it('hides Today button when week view contains today', () => {
        // Use today's date so the week definitely includes today
        const today = new Date();
        setup({ viewMode: 'week', selectedDate: today });
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('shows Today button when week view does not contain today', () => {
        setup({ viewMode: 'week', selectedDate: new Date(2020, 0, 1) });
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // title in day view uses formatDate
    // -----------------------------------------------------------------------

    it('renders title string for day view (desktop, title passed to CalendarNav)', () => {
        vi.mocked(useBreakpoint).mockReturnValue(false);
        setup({ viewMode: 'day', selectedDate: new Date(2026, 1, 15) });
        // CalendarNav renders the title in an h2 when not mobile
        const h2 = document.querySelector('.nav h2');
        expect(h2).toBeInTheDocument();
        expect(h2.textContent).toMatch(/2026|Feb|15/);
    });


    // -----------------------------------------------------------------------
    // ScheduleActions – hidden when sharedCalendar, shown otherwise
    // -----------------------------------------------------------------------

    it('shows ScheduleManagerButton and ActionMenu when not shared calendar', () => {
        setup({ viewMode: 'month' });
        expect(screen.getByText('Reschedule my events')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
        expect(screen.getByText('Import timetable')).toBeInTheDocument();
    });

    it('hides ScheduleManagerButton and ActionMenu when sharedCalendar', () => {
        setup({ viewMode: 'month', sharedCalendarUserId: '99' });
        expect(screen.queryByText('Reschedule my events')).not.toBeInTheDocument();
        expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    // -----------------------------------------------------------------------
    // openForView – day view passes selectedDate to openModal
    // -----------------------------------------------------------------------

    it('calls openModal with (null, null, selectedDate) in day view', () => {
        setup({ viewMode: 'day', selectedDate: defaultDate });
        fireEvent.click(screen.getByText('+'));
        expect(mockOpenModal).toHaveBeenCalledWith(null, null, defaultDate);
    });

    it('calls openModal with no args in month view', () => {
        setup({ viewMode: 'month' });
        fireEvent.click(screen.getByText('+'));
        expect(mockOpenModal).toHaveBeenCalledWith();
    });

    // -----------------------------------------------------------------------
    // reloadEvents – dispatches SET_EVENTS after importTimetable
    // -----------------------------------------------------------------------

    it('dispatches SET_EVENTS after successful import', async () => {
        const events = [{ id: 1, title: 'Imported' }];
        vi.mocked(getEvents).mockResolvedValueOnce(events);
        setup({ viewMode: 'month' });

        fireEvent.click(screen.getByText('Import timetable'));
        const urlInput = await screen.findByPlaceholderText(/timetable\.ics/i);
        fireEvent.change(urlInput, { target: { value: 'http://example.com/cal.ics' } });
        fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

        await waitFor(() => {
            expect(importTimetable).toHaveBeenCalledWith('http://example.com/cal.ics');
            expect(getEvents).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_EVENTS', payload: events });
        });
    });

    // -----------------------------------------------------------------------
    // ImportModal visibility – opens and closes
    // -----------------------------------------------------------------------

    it('shows ImportModal after clicking Import timetable button', async () => {
        setup();
        expect(screen.queryByText('Import Timetable')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Import timetable'));
        expect(await screen.findByText('Import Timetable')).toBeInTheDocument();
    });

    it('hides ImportModal after clicking Close', async () => {
        setup();
        fireEvent.click(screen.getByText('Import timetable'));
        await screen.findByText('Import Timetable');
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(screen.queryByText('Import Timetable')).not.toBeInTheDocument();
    });
    });

    // -----------------------------------------------------------------------
    // onDatePick (pick button in CalendarNav) dispatches SET_SELECTED_DATE
    // -----------------------------------------------------------------------

    it('dispatches SET_SELECTED_DATE when date picker pick button is clicked', () => {
        setup({ viewMode: 'month' });
        fireEvent.click(screen.getByText('pick'));
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: defaultDate,
        });
    });

    // -----------------------------------------------------------------------
    // Search and filter dispatch
    // -----------------------------------------------------------------------

    it('dispatches SET_SEARCH_QUERY when search input changes', () => {
        setup();
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'test query' } });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SEARCH_QUERY', payload: 'test query' });
    });

    it('dispatches SET_FILTER when filter button is clicked', () => {
        setup();
        fireEvent.click(screen.getByText(/Filter/));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_FILTER', payload: 'work' });
    });
});
