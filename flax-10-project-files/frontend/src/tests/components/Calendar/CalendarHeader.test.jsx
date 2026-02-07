import { render, screen, fireEvent } from '../../../utils/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { CalendarHeader } from '../../../components/Calendar/CalendarHeader';
import * as CalendarContextModule from '../../../context/CalendarContext';

// Mock context values
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
        selectedDate: new Date(2026, 1, 15), // Feb 15, 2026
        viewMode: 'month',
    };

    const setup = (state = defaultState) => {
        vi.mocked(CalendarContextModule.useCalendar).mockReturnValue(state);
        render(<CalendarHeader />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render title correctly for month view', () => {
        setup({ ...defaultState, viewMode: 'month' });
        expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('should render title correctly for week view', () => {
        setup({ ...defaultState, viewMode: 'week' });
        // Week of Feb 15 (Sunday) to Feb 21 (Saturday)
        // Assuming getWeekDays starts on Sunday.
        // Feb 15 is Sunday.
        expect(screen.getByText(/Feb 15 – Feb 21/)).toBeInTheDocument();
    });

    it('should render title correctly for day view', () => {
        setup({ ...defaultState, viewMode: 'day' });
        // Feb 15, 2026
        // Expected format depends on formatDate impl. usually "Sunday, February 15, 2026" or similar.
        // Let's use loose match or check dateUtils mock if we mock it.
        // For now, assume it contains "15" and "Feb".
        expect(screen.getByRole('heading')).toHaveTextContent(/Feb/);
        expect(screen.getByRole('heading')).toHaveTextContent(/15/);
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

        // Add passing expectation for prev
        // And then click NEXT
        fireEvent.click(nextBtn);
        // Verify call count or arg.
        // navigate(1).
        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('should trigger date picker', () => {
        setup();
        // Mock showPicker on HTMLInputElement prototype because it's not in JSDOM
        // We use a spy to verify it's called
        const showPickerSpy = vi.fn();
        HTMLInputElement.prototype.showPicker = showPickerSpy;

        fireEvent.click(screen.getByText('📅'));
        expect(showPickerSpy).toHaveBeenCalled();

        // Also test change
        const input = screen.getByDisplayValue(new Date(2026, 1, 15).toISOString().slice(0, 10)); // Feb 15
        fireEvent.change(input, { target: { value: '2026-03-01' } });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
    });

    it('should handle view mode toggle', () => {
        setup();
        const weekBtn = screen.getByText('Week');
        fireEvent.click(weekBtn);
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
        setup();
        const todayBtn = screen.getByText('Today');
        fireEvent.click(todayBtn);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
    });

    it('should handle date picker change', () => {
        setup();
        // The input has class hidden-date-input
        // and type="date"
        // We can find by selector or display value?
        // Default selectedDate is Feb 15, 2026. value="2026-02-15"
        const input = screen.getByDisplayValue('2026-02-15');
        fireEvent.change(input, { target: { value: '2026-03-01' } });

        // dateUtils parseDateInput likely creates date from string.
        // We expect SET_SELECTED_DATE with a date object corresponding to 2026-03-01.
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_SELECTED_DATE',
            payload: expect.any(Date),
        });
        // We could be more specific:
        const callArgs = mockDispatch.mock.calls[0][0]; // First call
        expect(callArgs.payload.toISOString()).toContain('2026-03-01');
    });

    it('should apply active class to current view mode', () => {
        setup({ ...defaultState, viewMode: 'week' });
        const weekBtn = screen.getByText('Week');
        expect(weekBtn).toHaveClass('active');
        const monthBtn = screen.getByText('Month');
        expect(monthBtn).not.toHaveClass('active');
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
});
