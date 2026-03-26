import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePickerButton } from '../../../../components/calendar/header/DatePickerButton';

vi.mock('../../../../components/common/inputs/DateTimePicker', () => ({
    default: ({ value, onChange, customTrigger }) => (
        <div data-testid="datetime-picker">
            <span data-testid="picker-value">{value}</span>
            <button onClick={() => onChange('2026-01-20')}>Change</button>
            {customTrigger}
        </div>
    ),
}));

describe('DatePickerButton', () => {
    it('renders and passes value from Date object', () => {
        const date = new Date(2026, 0, 15); // Jan 15
        render(<DatePickerButton selectedDate={date} onDatePick={vi.fn()} />);
        expect(screen.getByTestId('picker-value').textContent).toBe('2026-01-15');
        expect(screen.getByTitle('Choose date')).toBeInTheDocument();
    });

    it('renders and passes value from string', () => {
        render(<DatePickerButton selectedDate="2026-03-10" onDatePick={vi.fn()} />);
        expect(screen.getByTestId('picker-value').textContent).toBe('2026-03-10');
    });

    it('calls onDatePick with new Date when DateTimePicker changes', () => {
        const onDatePick = vi.fn();
        render(<DatePickerButton selectedDate="2026-01-15" onDatePick={onDatePick} />);
        fireEvent.click(screen.getByText('Change'));
        expect(onDatePick).toHaveBeenCalledWith(expect.any(Date));
        const callDate = onDatePick.mock.calls[0][0];
        expect(callDate.getFullYear()).toBe(2026);
        expect(callDate.getMonth()).toBe(0);
        expect(callDate.getDate()).toBe(20);
    });

    it('handles null selectedDate gracefully', () => {
        render(<DatePickerButton selectedDate={null} onDatePick={vi.fn()} />);
        expect(screen.getByTestId('picker-value').textContent).toBe('');
    });
});
