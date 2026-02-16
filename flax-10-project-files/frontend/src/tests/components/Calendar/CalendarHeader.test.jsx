import { render, screen, fireEvent } from '../../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarHeader } from '../../../components/Calendar/CalendarHeader';
import * as CalendarContextModule from '../../../context/CalendarContext';
import { TagProvider } from '../../../context/TagContext';
import { importTimetable } from '../../../api/timetable_api';
import { getEvents } from '../../../api/event_api';

// Mock API modules
// Mock API modules
vi.mock('../../../api/event_api', () => ({
    getEvents: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/timetable_api', () => ({
    importTimetable: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../api/tagApi', () => ({
    fetchTags: vi.fn(() => Promise.resolve([])),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
}));

vi.mock('../../../components/Notifications/hooks/useReminderNotifications', () => ({
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

    it('should open modal on adding event', () => {
        setup();
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(mockOpenModal).toHaveBeenCalled();
    });

    it('should handle Today button', () => {
        // Ensure today is NOT selectedDate, otherwise button might be hidden
        setup({ ...defaultState, selectedDate: new Date(2020, 1, 1) });
        const todayBtn = screen.getByText('Today');
        fireEvent.click(todayBtn);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
    });

    // Test TodayButton again explicitly to be sure
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
        vi.spyOn(window, 'prompt').mockReturnValue('http://example.com/calendar.ics');
        vi.spyOn(window, 'alert').mockImplementation(() => { });
        fireEvent.click(importBtn);
        await expect.poll(() => importTimetable).toHaveBeenCalledWith('http://example.com/calendar.ics');
        await vi.waitUntil(() => getEvents.mock.calls.length > 0);
        expect(getEvents).toHaveBeenCalled();
        await vi.waitUntil(() => mockDispatch.mock.calls.length > 0);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_EVENTS',
            payload: expect.anything()
        });
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
        const importBtn = screen.getByText('Import timetable');
        vi.spyOn(window, 'prompt').mockReturnValue('bad-url');
        vi.spyOn(window, 'alert');

        importTimetable.mockRejectedValueOnce(new Error('Import failed'));

        fireEvent.click(importBtn);

        await vi.waitUntil(() => window.alert.mock.calls.length > 0);

        expect(window.alert).toHaveBeenCalledWith('Import failed');
    });

    it('should handle import timetable flow (unknown error)', async () => {
        setup();
        const importBtn = screen.getByText('Import timetable');
        vi.spyOn(window, 'prompt').mockReturnValue('bad-url');
        vi.spyOn(window, 'alert');

        importTimetable.mockRejectedValueOnce({}); // No message

        fireEvent.click(importBtn);

        await vi.waitUntil(() => window.alert.mock.calls.length > 0);

        expect(window.alert).toHaveBeenCalledWith('Failed to import timetable');
    });

    it('should open modal with date for day view', () => {
        setup({ ...defaultState, viewMode: 'day' });
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(mockOpenModal).toHaveBeenCalledWith(null, null, defaultState.selectedDate);
    });

    it('should navigate correctly in year view', () => {
        setup({ ...defaultState, viewMode: 'year' });
        const nextBtn = screen.getByText('>');
        fireEvent.click(nextBtn);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date)
        });
        const callArgs = mockDispatch.mock.calls[0][0];
        // 2026 + 1 = 2027
        expect(callArgs.payload.getFullYear()).toBe(2027);
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
});
