import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationButtons } from '../../../../components/Calendar/header/NavigationButtons';
import * as dateUtils from '../../../../components/Calendar/utils/dateUtils';
import { useCalendar } from '../../../../context/CalendarContext';

vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
    getWeekRange: vi.fn(() => 'Jan 15 - 21, 2026'),
    formatMonthYear: vi.fn(() => 'January 2026'),
    parseDateInput: vi.fn(),
    isSameDay: vi.fn(() => false),
    getWeekDays: vi.fn(() => []),
    isSameMonth: vi.fn(() => false),
}));

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => ({ viewMode: 'week' })),
}));

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

    it('should handle DatePicker input change', () => {
        const targetDate = new Date(2026, 0, 20);
        vi.mocked(dateUtils.parseDateInput).mockReturnValue(targetDate);

        render(<NavigationButtons {...defaultProps} />);
        const input = screen.getByDisplayValue('2026-01-15');
        fireEvent.change(input, { target: { value: '2026-01-20' } });

        expect(dateUtils.parseDateInput).toHaveBeenCalledWith('2026-01-20');
        expect(mockDatePick).toHaveBeenCalledWith(targetDate);
    });

    it('should hide Today button if today is visible', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'day' });
        vi.mocked(dateUtils.isSameDay).mockReturnValue(true);
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('should hide Today when viewMode is week and week contains today', () => {
        vi.mocked(useCalendar).mockReturnValue({ viewMode: 'week' });
        const weekDays = [new Date(2026, 0, 12), new Date(2026, 0, 13), new Date(2026, 0, 14), new Date(2026, 0, 15), new Date(2026, 0, 16), new Date(2026, 0, 17), new Date(2026, 0, 18)];
        vi.mocked(dateUtils.getWeekDays).mockReturnValue(weekDays);
        vi.mocked(dateUtils.isSameDay).mockImplementation((d) => d.getDate() === 15);
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

    it('should open date picker on calendar click', async () => {
        const showPickerSpy = vi.fn();
        HTMLInputElement.prototype.showPicker = showPickerSpy;
        render(<NavigationButtons {...defaultProps} />);
        const calendarBtn = screen.getByText('🗓️');
        fireEvent.click(calendarBtn);
        expect(showPickerSpy).toHaveBeenCalled();
    });
});
