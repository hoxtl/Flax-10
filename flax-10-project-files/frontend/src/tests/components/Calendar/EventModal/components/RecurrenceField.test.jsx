import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecurrenceField } from '../../../../../components/Calendar/EventModal/components/RecurrenceField';

vi.mock('../../../../../components/ui/AnimatedDropdown', () => ({
    default: ({ value, onChange, options }) => (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    )
}));

vi.mock('../../../../../components/common/inputs/DateTimePicker', () => ({
    default: ({ value, onChange }) => (
        <input
            type="date"
            className="end-date-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

describe('RecurrenceField', () => {
    const mockOnChange = vi.fn();

    it('should render default state', () => {
        render(<RecurrenceField value={{}} onChange={mockOnChange} />);
        expect(screen.getByText('Repeat')).toBeInTheDocument();
        expect(screen.getByDisplayValue('None')).toBeInTheDocument();
        expect(screen.queryByText('Every')).not.toBeInTheDocument();
    });

    it('should show interval input when frequency is not none', () => {
        render(<RecurrenceField value={{ frequency: 'daily' }} onChange={mockOnChange} />);
        expect(screen.getByText('Every')).toBeInTheDocument();
    });

    it('should call onChange when frequency changes', () => {
        render(<RecurrenceField value={{}} onChange={mockOnChange} />);
        const frequencySelect = screen.getByDisplayValue('None');
        fireEvent.change(frequencySelect, { target: { value: 'daily' } });

        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ frequency: 'daily' }));
    });

    it('should call onChange when interval changes', () => {
        render(<RecurrenceField value={{ frequency: 'daily', interval: 1 }} onChange={mockOnChange} />);
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '2' } });
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ interval: '2' }));
    });

    it('should show end repeat section when recurring', () => {
        render(<RecurrenceField value={{ frequency: 'daily' }} onChange={mockOnChange} />);
        expect(screen.getByText('End repeat')).toBeInTheDocument();
    });

    it('should toggle end repeat type', () => {
        render(<RecurrenceField value={{ frequency: 'daily', end_date: null }} onChange={mockOnChange} />);
        const selects = screen.getAllByRole('combobox');
        const endTypeSelect = selects[1];
        fireEvent.change(endTypeSelect, { target: { value: 'on_date' } });
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
            end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        }));
    });

    it('should call onChange when end date changes', () => {
        render(<RecurrenceField value={{ frequency: 'daily', end_date: '2025-01-01' }} onChange={mockOnChange} />);
        const dateInput = document.querySelector('.end-date-input');
        expect(dateInput).toBeInTheDocument();
        fireEvent.change(dateInput, { target: { value: '2025-02-01' } });
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ end_date: '2025-02-01' }));
        fireEvent.change(dateInput, { target: { value: '' } });
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ end_date: null }));
    });

    it('should handle null value prop gracefully', () => {
        render(<RecurrenceField value={null} onChange={mockOnChange} />);
        expect(screen.getByText('Repeat')).toBeInTheDocument();
    });
});
