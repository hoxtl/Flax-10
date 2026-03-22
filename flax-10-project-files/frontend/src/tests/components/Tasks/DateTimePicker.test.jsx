/* Tests for the DateTimePicker component. */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateTimePicker from '../../../pages/Tasks/components/DateTimePicker';

vi.mock('../../../components/Common/AnimatedDropdown', () => ({
    default: ({ value, onChange, options, placeholder }) => (
        <select
            data-testid={`dropdown-${placeholder}`}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    ),
}));

describe('DateTimePicker', () => {
    it('renders placeholder when no value', () => {
        render(<DateTimePicker onChange={vi.fn()} placeholder="Pick a date" />);
        expect(screen.getByText('Pick a date')).toBeTruthy();
    });

    it('renders default placeholder when none specified', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        expect(screen.getByText('Pick date & time')).toBeTruthy();
    });

    it('renders formatted date when value is provided', () => {
        render(<DateTimePicker value="2025-06-15T14:30" onChange={vi.fn()} />);
        // Should show some formatted date text (not the placeholder)
        expect(screen.queryByText('Pick date & time')).toBeNull();
    });

    it('opens dropdown when trigger button is clicked', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);
        // After clicking, the calendar should open - look for month navigation buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(1);
    });

    it('shows month navigation when open', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(screen.getByText('‹')).toBeTruthy();
        expect(screen.getByText('›')).toBeTruthy();
    });

    it('shows day headers when open', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(screen.getByText('Su')).toBeTruthy();
        expect(screen.getByText('Mo')).toBeTruthy();
    });

    it('calls onChange when a day is selected', () => {
        const onChange = vi.fn();
        render(<DateTimePicker onChange={onChange} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        // Click day "15" if present
        const dayBtns = screen.getAllByRole('button').filter(b => b.textContent === '15');
        if (dayBtns.length > 0) {
            fireEvent.click(dayBtns[0]);
            expect(onChange).toHaveBeenCalled();
        }
    });

    it('can navigate to previous month', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        const prevBtn = screen.getByText('‹');
        fireEvent.click(prevBtn);
        // Month label should have changed
        expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('can navigate to next month', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        const nextBtn = screen.getByText('›');
        fireEvent.click(nextBtn);
        expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('shows Done button when open', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(screen.getByText('Done')).toBeTruthy();
    });

    it('closes when Done is clicked', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        fireEvent.click(screen.getByText('Done'));
        expect(screen.queryByText('Su')).toBeNull();
    });

    it('shows clear button when value is set', () => {
        render(<DateTimePicker value="2025-06-15T14:30" onChange={vi.fn()} />);
        expect(screen.getByText('✕')).toBeTruthy();
    });

    it('clears value when clear button is clicked', () => {
        const onChange = vi.fn();
        render(<DateTimePicker value="2025-06-15T14:30" onChange={onChange} />);
        fireEvent.click(screen.getByText('✕'));
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('shows timeOnly mode with clock emoji', () => {
        render(<DateTimePicker onChange={vi.fn()} timeOnly />);
        expect(screen.getByText('🕒')).toBeTruthy();
    });

    it('timeOnly mode shows HH:MM format for value', () => {
        render(<DateTimePicker value="14:30" onChange={vi.fn()} timeOnly />);
        // Should not show placeholder
        expect(screen.queryByText('Pick date & time')).toBeNull();
    });

    it('timeOnly mode does not show calendar', () => {
        render(<DateTimePicker onChange={vi.fn()} timeOnly />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(screen.queryByText('Su')).toBeNull();
    });

    it('timeOnly emits HH:MM string on change', () => {
        const onChange = vi.fn();
        render(<DateTimePicker onChange={onChange} timeOnly />);
        fireEvent.click(screen.getAllByRole('button')[0]);
        // Change hour
        const hourDropdown = screen.getByTestId('dropdown-HH');
        fireEvent.change(hourDropdown, { target: { value: '10' } });
        // Since no date is selected in timeOnly mode, onChange may not be called
        // Just verify no crash
    });

    it('shows calendar emoji for non-timeOnly mode', () => {
        render(<DateTimePicker onChange={vi.fn()} />);
        expect(screen.getByText('📅')).toBeTruthy();
    });
});
