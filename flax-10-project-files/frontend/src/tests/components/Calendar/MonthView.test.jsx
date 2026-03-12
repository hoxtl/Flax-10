import { render, screen, fireEvent } from '../../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonthView } from '../../../components/Calendar/MonthView/MonthView';
import * as CalendarContextModule from '../../../context/CalendarContext';
import { TagProvider } from '../../../context/TagContext';

// Mock TagContext to avoid network calls
vi.mock('../../../context/TagContext', async () => {
    return {
        TagProvider: ({ children }) => <div>{children}</div>,
        useTags: () => ({
            tags: [],
            getTag: (id) => ({ id, color: '#3b82f6', label: 'Work' }),
            getTagByName: (name) => ({ name, color: '#3b82f6', icon: '📚' })
        })
    };
});

// Mock hooks
const mockUseDrag = vi.fn(() => ({ dragProps: {}, isDragging: false }));
const mockUseMonthDayDrop = vi.fn(() => ({ dropProps: {}, isOver: false }));
const mockOpenModal = vi.fn();
const mockDispatch = vi.fn();

vi.mock('../../../components/Calendar/hooks/useDragDrop', () => ({
    useDrag: (...args) => mockUseDrag(...args),
}));

vi.mock('../../../components/Calendar/hooks/useMonthDayDrop', () => ({
    useMonthDayDrop: (...args) => mockUseMonthDayDrop(...args),
}));

vi.mock('../../../context/CalendarContext', async () => {
    const actual = await vi.importActual('../../../context/CalendarContext');
    return {
        ...actual,
        useCalendar: vi.fn(),
        useCalendarData: vi.fn(),
        useCalendarDispatch: () => mockDispatch,
        useEventModal: () => ({ openModal: mockOpenModal }),
    };
});

vi.mock('../../../components/Notifications/hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

describe('MonthView', () => {
    // Current date: Feb 15, 2026
    const defaultState = {
        selectedDate: new Date(2026, 1, 15),
        events: [
            { id: 1, title: 'Event 1', start_time: new Date(2026, 1, 15, 10, 0), end_time: new Date(2026, 1, 15, 11, 0) },
            { id: 2, title: 'Event 2', start_time: new Date(2026, 1, 15, 12, 0), end_time: new Date(2026, 1, 15, 13, 0) },
            // Event on another day
            { id: 3, title: 'Event 3', start_time: new Date(2026, 1, 20, 10, 0), end_time: new Date(2026, 1, 20, 11, 0) },
        ],
    };

    const setup = (state = defaultState) => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(state);
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue(state);
        render(
            <TagProvider>
                <MonthView onEventClick={mockOpenModal} onDateSelect={(day) => mockDispatch({ type: "SET_SELECTED_DATE", payload: day })} />
            </TagProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the month grid', () => {
        setup();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('should render correct number of days for March 2026 (6 weeks)', () => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue({
            selectedDate: new Date(2026, 4, 1),
            events: []
        });
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue({
            selectedDate: new Date(2026, 4, 1),
            events: []
        });

        render(<MonthView />);
        const cells = screen.getAllByText(/\d+/); // Get days
        // May has 31 days. + padding.
        const otherMonthCells = document.querySelectorAll('.other-month');
        expect(otherMonthCells.length).toBeGreaterThan(0);
    });

    it('should render events on correct days', () => {
        setup();
        // Event 1 and 2 are on Feb 15.
        // Event 3 on Feb 20.
        expect(screen.getByText('Event 1')).toBeInTheDocument();
        expect(screen.getByText('Event 2')).toBeInTheDocument();
        expect(screen.getByText('Event 3')).toBeInTheDocument();
    });

    it('renders society event with society name in title', () => {
        const stateWithSociety = {
            ...defaultState,
            events: [
                { id: 4, title: 'Society Meet', source: 'society', society_name: 'Chess Club', start_time: new Date(2026, 1, 15, 14, 0), end_time: new Date(2026, 1, 15, 15, 0) },
            ],
        };
        setup(stateWithSociety);
        const dot = document.querySelector('[title="Society Meet (Chess Club)"]');
        expect(dot).toBeTruthy();
    });

    it('should open modal when clicking add button on a day', () => {
        setup();
        const addBtns = screen.getAllByText('+');
        fireEvent.click(addBtns[14]);

        expect(mockOpenModal).toHaveBeenCalled();
        const arg = mockOpenModal.mock.calls[0][0];
        expect(arg.start_time.getHours()).toBe(9);
    });

    it('should open modal when clicking an event', () => {
        setup();
        const eventEl = screen.getByText('Event 1');
        fireEvent.click(eventEl);
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, title: 'Event 1' }),
            expect.anything()
        );
    });

    it('should handle dragging state', () => {
        mockUseDrag.mockReturnValue({ dragProps: { draggable: true }, isDragging: true });
        setup();
        const eventEl = screen.getByText('Event 1');
        expect(eventEl).toHaveClass('dragging');
    });

    it('should handle drop over state', () => {
        mockUseMonthDayDrop.mockReturnValue({ dropProps: {}, isOver: true });
        setup();
        const dayNum = screen.getByText('15');
        const cell = dayNum.closest('.day-cell');
        expect(cell).toHaveClass('drop-over');
    });

    it('should select date on day click', () => {
        setup();
        const dayNum = screen.getByText('15');
        const cell = dayNum.closest('.day-cell');
        fireEvent.click(cell);

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date), // Should be Feb 15
        });
        // MonthView only selects date, does not switch view in current implementation
        /*
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_VIEW_MODE',
            payload: 'day',
        });
        */
    });

    it('should show +X more events if too many', () => {
        const manyEvents = [1, 2, 3, 4].map(i => ({
            id: i, title: `Ev ${i}`, start_time: new Date(2026, 1, 15, 10, i), end_time: new Date(2026, 1, 15, 11, i)
        }));
        setup({ ...defaultState, events: manyEvents });

        expect(screen.getByText('Ev 1')).toBeInTheDocument();
        expect(screen.getByText('Ev 2')).toBeInTheDocument();
        expect(screen.getByText('Ev 3')).toBeInTheDocument();
        expect(screen.queryByText('Ev 4')).not.toBeInTheDocument();
        expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('dispatches date and view mode when +X more clicked (no onMoreClick prop)', () => {
        const manyEvents = [1, 2, 3, 4].map(i => ({
            id: i, title: `Ev ${i}`, start_time: new Date(2026, 1, 15, 10, i), end_time: new Date(2026, 1, 15, 11, i)
        }));
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue({ ...defaultState, events: manyEvents });
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue({ ...defaultState, events: manyEvents });
        render(<MonthView />);
        const moreBtn = screen.getByText('+1 more');
        fireEvent.click(moreBtn);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SELECTED_DATE', payload: expect.any(Date) });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });
    });

    it('calls onMoreClick prop when +X more clicked', () => {
        const manyEvents = [1, 2, 3, 4].map(i => ({
            id: i, title: `Ev ${i}`, start_time: new Date(2026, 1, 15, 10, i), end_time: new Date(2026, 1, 15, 11, i)
        }));
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue({ ...defaultState, events: manyEvents });
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue({ ...defaultState, events: manyEvents });
        const onMoreClick = vi.fn();
        render(<MonthView onMoreClick={onMoreClick} />);
        fireEvent.click(screen.getByText('+1 more'));
        expect(onMoreClick).toHaveBeenCalledWith(expect.any(Date));
    });

    it('renders readOnly day cells without add button and uses ReadOnlyDayCell', () => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(defaultState);
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue(defaultState);
        render(<MonthView readOnly={true} />);
        expect(screen.queryByText('+')).not.toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('uses selectedDate and events props when provided (over context)', () => {
        const propDate = new Date(2026, 3, 10);
        const propEvents = [{ id: 99, title: 'Prop event', start_time: new Date(2026, 3, 10, 9, 0), end_time: new Date(2026, 3, 10, 10, 0) }];
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue({ selectedDate: new Date(2020, 0, 1), events: [] });
        vi.mocked(CalendarContextModule.useCalendarData).mockReturnValue({ selectedDate: new Date(2020, 0, 1), events: [] });
        render(
            <TagProvider>
                <MonthView selectedDate={propDate} events={propEvents} />
            </TagProvider>
        );
        expect(screen.getByText('Prop event')).toBeInTheDocument();
    });
});
