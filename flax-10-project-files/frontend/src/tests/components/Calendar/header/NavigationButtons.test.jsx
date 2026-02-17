import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavigationButtons } from '../../../../components/Calendar/header/NavigationButtons';
import { isSameDay, parseDateInput } from '../../../../utils/dateUtils';
import { useCalendar } from '../../../../context/CalendarContext';

vi.mock('../../../../utils/dateUtils', () => ({
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
        parseDateInput.mockReturnValue(targetDate);

        render(<NavigationButtons {...defaultProps} />);
        const input = screen.getByDisplayValue('2026-01-15');
        fireEvent.change(input, { target: { value: '2026-01-20' } });

        expect(parseDateInput).toHaveBeenCalledWith('2026-01-20');
        expect(mockDatePick).toHaveBeenCalledWith(targetDate);
    });

    it('should hide Today button if today is visible', () => {
        useCalendar.mockReturnValue({ viewMode: 'day' });
        isSameDay.mockReturnValue(true);
        render(<NavigationButtons {...defaultProps} />);
        expect(screen.queryByText('Today')).not.toBeInTheDocument();

        isSameDay.mockReturnValue(false);
        isSameDay.mockReturnValue(false);
        useCalendar.mockReturnValue({ viewMode: 'week' }); // Reset
    });

    it('should open date picker on calendar click', () => {
        const showPickerSpy = vi.fn();
        HTMLInputElement.prototype.showPicker = showPickerSpy;
        render(<NavigationButtons {...defaultProps} />);
        const calendarBtn = screen.getByText('🗓️');
        fireEvent.click(calendarBtn);
        expect(showPickerSpy).toHaveBeenCalled();
    });
});
