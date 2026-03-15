import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePickerButton } from '../../../../components/Calendar/header/DatePickerButton';

const parseDateInputMock = vi.fn();
vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
    parseDateInput: (...args) => parseDateInputMock(...args),
}));

describe('DatePickerButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders button and hidden date input with value from Date selectedDate', () => {
        const date = new Date(2026, 0, 15);
        render(<DatePickerButton selectedDate={date} onDatePick={vi.fn()} />);
        expect(screen.getByTitle('Choose date')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
    });

    it('uses string selectedDate and converts to date', () => {
        render(<DatePickerButton selectedDate="2026-03-10" onDatePick={vi.fn()} />);
        expect(screen.getByDisplayValue('2026-03-10')).toBeInTheDocument();
    });

    it('shows empty value when date is invalid', () => {
        render(<DatePickerButton selectedDate={new Date('invalid')} onDatePick={vi.fn()} />);
        const input = document.querySelector('input[type="date"]');
        expect(input.value).toBe('');
    });

    it('calls onDatePick with parsed date when input value changes', () => {
        const onDatePick = vi.fn();
        const parsed = new Date(2026, 0, 20);
        parseDateInputMock.mockReturnValue(parsed);
        render(<DatePickerButton selectedDate={new Date(2026, 0, 15)} onDatePick={onDatePick} />);
        const input = screen.getByDisplayValue('2026-01-15');
        fireEvent.change(input, { target: { value: '2026-01-20' } });
        expect(parseDateInputMock).toHaveBeenCalledWith('2026-01-20');
        expect(onDatePick).toHaveBeenCalledWith(parsed);
    });

    it('does not call onDatePick when change value is empty', () => {
        const onDatePick = vi.fn();
        render(<DatePickerButton selectedDate={new Date(2026, 0, 15)} onDatePick={onDatePick} />);
        const input = screen.getByDisplayValue('2026-01-15');
        fireEvent.change(input, { target: { value: '' } });
        expect(parseDateInputMock).not.toHaveBeenCalled();
        expect(onDatePick).not.toHaveBeenCalled();
    });

    it('calls showPicker on calendar button click when input has showPicker', () => {
        const showPickerFn = vi.fn();
        render(<DatePickerButton selectedDate={new Date(2026, 0, 15)} onDatePick={vi.fn()} />);
        const input = document.querySelector('input[type="date"]');
        input.showPicker = showPickerFn;
        fireEvent.click(screen.getByTitle('Choose date'));
        expect(showPickerFn).toHaveBeenCalled();
    });

    it('does not throw when ref.current is null on button click', () => {
        render(<DatePickerButton selectedDate={new Date(2026, 0, 15)} onDatePick={vi.fn()} />);
        const btn = screen.getByTitle('Choose date');
        expect(() => fireEvent.click(btn)).not.toThrow();
    });
});
