import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecurrenceField } from '../../../../../components/calendar/event_modal/components/RecurrenceField';

vi.mock('../../../../../components/common/animated_dropdown', () => ({
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
        expect(screen.getByDisplayValue('Does not repeat')).toBeInTheDocument();
        expect(screen.queryByText('Every')).not.toBeInTheDocument();
    });

    it('should show interval input when frequency is not none', () => {
        render(<RecurrenceField value={{ frequency: 'daily' }} onChange={mockOnChange} />);
        expect(screen.getAllByText('Every').length).toBeGreaterThan(0);
    });

    it('should call onChange when frequency changes', () => {
        render(<RecurrenceField value={{}} onChange={mockOnChange} />);
        const frequencySelect = screen.getByDisplayValue('Does not repeat');
        fireEvent.change(frequencySelect, { target: { value: 'daily' } });

        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ frequency: 'daily' }));
    });

    it('should call onChange when interval changes', () => {
        render(<RecurrenceField value={{ frequency: 'daily', interval: 1 }} onChange={mockOnChange} />);
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[0], { target: { value: '2' } });
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

    it('returns null when hideFrequency is enabled without recurrence', () => {
        const { container } = render(<RecurrenceField value={{ frequency: 'none' }} hideFrequency onChange={mockOnChange} />);
        expect(container.firstChild).toBeNull();
    });

    it('clears the end date when switching back to never', () => {
        render(<RecurrenceField value={{ frequency: 'daily', end_date: '2025-02-01' }} onChange={mockOnChange} />);
        const endTypeSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(endTypeSelect, { target: { value: 'never' } });
        expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ end_date: null }));
    });
});
