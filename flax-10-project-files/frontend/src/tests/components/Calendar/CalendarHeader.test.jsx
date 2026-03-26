import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarHeader } from '../../../components/calendar/CalendarHeader';
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

vi.mock('../../../components/calendar/header/calendarHeaderUtils', () => ({
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
        <select value={activeMode} onChange={e => onChange(e.target.value)}>
            {modes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
    ),
    SearchButton: ({ value, onChange }) => (
        <input placeholder="Search" value={value} onChange={e => onChange(e.target.value)} />
    ),
    FilterDropdownButton: ({ active, onChange }) => (
        <button type="button" onClick={() => onChange('work')}>Filter {Array.isArray(active) ? active.join(',') : active}</button>
    ),
    ScheduleManagerButton: () => <button type="button">Reschedule my events</button>,
}));

vi.mock('../../../components/notifications/hooks/useReminderNotifications', () => ({
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

describe('CalendarHeader', () => {
    const defaultState = {
        selectedDate: new Date(2026, 1, 15),
        viewMode: 'month',
    };

    const setup = (state = defaultState) => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(state);
        render(
            <TagProvider>
                <CalendarHeader />
            </TagProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render title correctly for month view', () => {
        setup({ ...defaultState, viewMode: 'month' });
        expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('should handle navigation (next/prev)', () => {
        setup();
        const prevBtn = screen.getByText('<');
        const nextBtn = screen.getByText('>');

        fireEvent.click(prevBtn);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });

        fireEvent.click(nextBtn);
        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('should handle view mode toggle via dropdown', () => {
        setup();
        const select = screen.getByRole('combobox');

        fireEvent.change(select, { target: { value: 'week' } });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_VIEW_MODE',
            payload: 'week',
        });
    });

    it('renders reschedule control', () => {
        setup();
        expect(screen.getByText('Reschedule my events')).toBeInTheDocument();
    });

    it('hides add and schedule actions when viewing a shared calendar', () => {
        setup({ ...defaultState, sharedCalendarUserId: '44', sharedCalendarName: 'Jane Doe' });
        expect(screen.queryByText('Reschedule my events')).not.toBeInTheDocument();
        expect(screen.queryByText('+')).not.toBeInTheDocument();
        expect(screen.queryByText('Import timetable')).not.toBeInTheDocument();
    });

    it('should open modal on adding event', () => {
        setup();
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(mockOpenModal).toHaveBeenCalled();
    });

    it('should open modal with no args for week view (not day)', () => {
        setup({ ...defaultState, viewMode: 'week' });
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(mockOpenModal).toHaveBeenCalledWith();
    });

    it('should handle Today button', () => {
        setup({ ...defaultState, selectedDate: new Date(2020, 1, 1) });
        const todayBtn = screen.getByText('Today');
        fireEvent.click(todayBtn);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
    });

    it('should set date to today when Today clicked', () => {
        vi.useFakeTimers();
        const today = new Date(2025, 0, 1); // Jan 1 2025
        vi.setSystemTime(today);

        setup();
        const todayBtn = screen.getByText('Today');
        fireEvent.click(todayBtn);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
        const callArgs = mockDispatch.mock.calls[0][0];
        expect(callArgs.payload.toISOString()).toContain('2025-01-01');

        vi.useRealTimers();
    });

    it('should handle import timetable flow (success)', async () => {
        setup();
        const importBtn = screen.getByText('Import timetable');
        fireEvent.click(importBtn);
        const urlInput = await screen.findByPlaceholderText(/timetable\.ics/i);
        fireEvent.change(urlInput, { target: { value: 'http://example.com/calendar.ics' } });
        const submitBtn = screen.getByRole('button', { name: /^import$/i });
        fireEvent.click(submitBtn);
        await waitFor(() => expect(importTimetable).toHaveBeenCalledWith('http://example.com/calendar.ics'));
    });

    it('should handle import timetable flow (cancel)', async () => {
        setup();
        const importBtn = screen.getByText('Import timetable');
        vi.spyOn(window, 'prompt').mockReturnValue(null);

        fireEvent.click(importBtn);
        expect(importTimetable).not.toHaveBeenCalled();
    });

    it('should handle import timetable flow (error)', async () => {
        setup();
        importTimetable.mockRejectedValueOnce(new Error('Import failed'));
        fireEvent.click(screen.getByText('Import timetable'));
        await screen.findByText('Import Timetable');
        expect(importTimetable).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText(/timetable/i)).toBeInTheDocument();
    });

    it('should handle import timetable flow (unknown error)', async () => {
        setup();
        fireEvent.click(screen.getByText('Import timetable'));
        await screen.findByText('Import Timetable');
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(screen.queryByText('Import Timetable')).not.toBeInTheDocument();
    });

    it('should open modal with date for day view', () => {
        setup({ ...defaultState, viewMode: 'day' });
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(mockOpenModal).toHaveBeenCalledWith(null, null, defaultState.selectedDate);
    });

    it('should navigate correctly in week view', () => {
        setup({ ...defaultState, viewMode: 'week' });
        const nextBtn = screen.getByText('>');
        fireEvent.click(nextBtn);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date)
        });
        // 1 week ahead
        const callArgs = mockDispatch.mock.calls[0][0];
        // Jan 15 + 7 = Jan 22
        expect(callArgs.payload.getDate()).toBe(22);
    });

    it('should navigate correctly in day view', () => {
        setup({ ...defaultState, viewMode: 'day' });
        const prevBtn = screen.getByText('<');
        fireEvent.click(prevBtn);

        const callArgs = mockDispatch.mock.calls[0][0];
        // Jan 15 - 1 = Jan 14
        expect(callArgs.payload.getDate()).toBe(14);
    });

    it('should dispatch SET_SELECTED_DATE and SET_VIEW_MODE when clicking a date card in day view on mobile', () => {
        const originalInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 500 });
        setup({ ...defaultState, viewMode: 'day' });
        const dateCards = document.querySelectorAll('.date-card');
        expect(dateCards.length).toBeGreaterThan(0);
        fireEvent.click(dateCards[0]);
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_SELECTED_DATE' }));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
        Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: originalInnerWidth });
    });

    it('hides Today button when the selected date is today', () => {
        const now = new Date();
        setup({ selectedDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), viewMode: 'month' });
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('shows mobile layout when window is narrow', () => {
        const originalInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
        setup({ ...defaultState, viewMode: 'day' });
        const mobileTitle = document.querySelector('.mobile-title-row');
        expect(mobileTitle).toBeInTheDocument();
        expect(mobileTitle?.querySelector('.title')).toHaveTextContent(/Feb|15/);
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    });

});
