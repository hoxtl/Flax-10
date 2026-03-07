
import { render, screen, fireEvent, within, act } from '../../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YearView } from '../../../components/Calendar/YearView/YearView';
import * as CalendarContextModule from '../../../context/CalendarContext';
import { TagProvider } from '../../../context/TagContext';

const mockDispatch = vi.fn();

vi.mock('../../../context/CalendarContext', async () => {
    const actual = await vi.importActual('../../../context/CalendarContext');
    return {
        ...actual,
        useCalendar: vi.fn(),
        useCalendarDispatch: () => mockDispatch,
    };
});

vi.mock('../../../components/Notifications/hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

// Mock TagContext to ensure useTags works without real provider issues
vi.mock('../../../context/TagContext', async () => {
    return {
        TagProvider: ({ children }) => <div>{children}</div>,
        useTags: () => ({
            tags: [
                { id: 'tag1', color: '#ff0000', label: 'Work' }
            ],
            getTag: (id) => ({ id, color: '#ff0000', label: 'Work' }),
            getTagByName: (name) => ({ name, color: '#ff0000', icon: '📚' })
        })
    };
});

const mockBinder = {
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
};

vi.mock('../../../components/Calendar/hooks/useHoverSummary', () => ({
    useHoverSummary: () => ({
        isHovered: true,
        showSummary: true,
        binder: mockBinder
    })
}));

vi.mock('../../../hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

describe('YearView', () => {
    const defaultState = {
        selectedDate: new Date(2026, 0, 15), // Jan 15, 2026
        events: [
            { id: 1, title: 'Jan Event', start_time: new Date(2026, 0, 15, 10, 0), end_time: new Date(2026, 0, 15, 11, 0), tag: 'tag1' },
            { id: 2, title: 'Feb Event', start_time: new Date(2026, 1, 20, 10, 0), end_time: new Date(2026, 1, 20, 11, 0), tag: 'tag1' },
        ],
    };

    const setup = (state = defaultState) => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(state);
        render(
            <TagProvider>
                <YearView />
            </TagProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render 12 months', () => {
        setup();
        expect(screen.getByText('January')).toBeInTheDocument();
        expect(screen.getByText('December')).toBeInTheDocument();
        const monthTitles = document.querySelectorAll('.year-month-title');
        expect(monthTitles).toHaveLength(12);
    });

    it('should switch to day view on day click', () => {
        setup();
        const month = screen.getByText('January').closest('.year-month');
        const day15 = within(month).getByText('15');

        fireEvent.click(day15);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_VIEW_MODE',
            payload: 'day',
        });

        const callArgs = mockDispatch.mock.calls[0][0];
        expect(callArgs.payload.getMonth()).toBe(0);
        expect(callArgs.payload.getDate()).toBe(15);
        expect(callArgs.payload.getFullYear()).toBe(2026);
    });

    it('should show hover summary on mouse enter', async () => {
        setup();
        const month = screen.getByText('January').closest('.year-month');
        const day15 = within(month).getByText('15');
        expect(within(day15).getByText('Jan Event')).toBeInTheDocument();
        fireEvent.mouseEnter(day15);
        expect(mockBinder.onMouseEnter).toHaveBeenCalled();
    });

    it('should show empty summary for empty days', async () => {
        setup();
        const month = screen.getByText('January').closest('.year-month');
        const day1 = within(month).getByText('1');
        expect(within(day1).queryByText('Jan Event')).not.toBeInTheDocument();
        expect(within(day1).getByText('No events')).toBeInTheDocument();
    });

    it('should switch to month view on month title click', () => {
        setup();
        const monthTitle = screen.getByText('January');
        fireEvent.click(monthTitle);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_VIEW_MODE',
            payload: 'month',
        });

        const callArgs = mockDispatch.mock.calls[0][0];
        // Should select Jan 1st 2026? Or similar.
        expect(callArgs.payload.getMonth()).toBe(0);
        expect(callArgs.payload.getFullYear()).toBe(2026);
    });

    it('should display different time formats in summary', async () => {
        // Setup with varied events
        const variedState = {
            selectedDate: new Date(2026, 0, 15),
            events: [
                // All Day Event
                { id: 1, title: 'All Day', start_time: new Date(2026, 0, 15), end_time: new Date(2026, 0, 16), all_day: true },
                // Event spanning days
                { id: 2, title: 'Spanning', start_time: new Date(2026, 0, 15, 23, 0), end_time: new Date(2026, 0, 16, 1, 0) },
                // Normal event
                { id: 3, title: 'Normal', start_time: new Date(2026, 0, 15, 10, 0), end_time: new Date(2026, 0, 15, 11, 0) },
            ]
        };
        setup(variedState);
        const month = screen.getByText('January').closest('.year-month');
        const day15 = within(month).getByText('15');
        expect(within(day15).getByText('All Day', { selector: '.event-title' })).toBeInTheDocument();
        expect(within(day15).getByText('All Day', { selector: '.event-time' })).toBeInTheDocument();
        expect(within(day15).getByText(/11:00 pm|11:00 PM/i, { selector: '.event-time' })).toBeInTheDocument();
        expect(within(day15).getByText('Normal', { selector: '.event-title' })).toBeInTheDocument();
        expect(within(day15).getByText(/10:00 am|10:00 AM/i, { selector: '.event-time' })).toBeInTheDocument();
    });
});
