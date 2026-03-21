import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
<<<<<<< HEAD
import { NavigationButtons } from '../../../../components/calendar/header/NavigationButtons';
=======
import { NavigationButtons } from '../../../../components/Calendar/header/NavigationButtons';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useCalendar } from '../../../../context/CalendarContext';

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => ({ viewMode: 'week' })),
}));

<<<<<<< HEAD
vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
=======
vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    isSameDay: vi.fn(() => false),
    getWeekDays: vi.fn(() => []),
    isSameMonth: vi.fn(() => false),
}));

<<<<<<< HEAD
vi.mock('../../../../components/calendar/header/DatePickerButton', () => ({
=======
vi.mock('../../../../components/Calendar/header/DatePickerButton', () => ({
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    DatePickerButton: ({ selectedDate, onDatePick }) => (
        <div data-testid="date-picker-button">
            <span data-testid="date-value">{selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate}</span>
            <button onClick={() => onDatePick(new Date(2026, 0, 20))}>Pick Date</button>
        </div>
    ),
}));

<<<<<<< HEAD
import * as dateUtils from '../../../../components/calendar/utils/dateUtils';
=======
import * as dateUtils from '../../../../components/Calendar/utils/dateUtils';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

describe('NavigationButtons', () => {
    const mockNavigate = vi.fn();
    const mockDatePick = vi.fn();
    const defaultProps = {
        selectedDate: new Date(2026, 0, 15),
        onNavigate: mockNavigate,
        onDatePick: mockDatePick
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'week' });
        vi.mocked(dateUtils.isSameDay).mockReturnValue(false);
        vi.mocked(dateUtils.getWeekDays).mockReturnValue([]);
        vi.mocked(dateUtils.isSameMonth).mockReturnValue(false);
    });

    it('should render navigation buttons', () => {
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.getByText('<')).toBeInTheDocument();
        expect(screen.getByText('>')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker-button')).toBeInTheDocument();
    });

    it('should handle Previous button click', () => {
        render(<NavigationButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('<'));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should handle Next button click', () => {
        render(<NavigationButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('>'));
        expect(mockNavigate).toHaveBeenCalledWith(1);
    });

    it('should handle Today button click', () => {
        render(<NavigationButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Today'));
        expect(mockDatePick).toHaveBeenCalled();
    });

    it('should handle DatePicker selection', () => {
        render(<NavigationButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Pick Date'));
        expect(mockDatePick).toHaveBeenCalledWith(new Date(2026, 0, 20));
    });

    it('should hide Today button if today is visible', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'day' });
        vi.mocked(dateUtils.isSameDay).mockReturnValue(true);
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('should hide Today when viewMode is week and week contains today', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'week' });
        vi.mocked(dateUtils.getWeekDays).mockReturnValue([new Date()]);
        vi.mocked(dateUtils.isSameDay).mockReturnValue(true);
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('should hide Today when viewMode is month and same month', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'month' });
        vi.mocked(dateUtils.isSameMonth).mockReturnValue(true);
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('should show Today when viewMode is year', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'year' });
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('Today click passes date at midnight', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 10, 14, 30, 0));
        render(<NavigationButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Today'));
        expect(mockDatePick).toHaveBeenCalledWith(expect.any(Date));
        const arg = mockDatePick.mock.calls[0][0];
        expect(arg.getHours()).toBe(0);
        expect(arg.getMinutes()).toBe(0);
        expect(arg.getDate()).toBe(10);
        expect(arg.getMonth()).toBe(2);
        vi.useRealTimers();
    });
});
