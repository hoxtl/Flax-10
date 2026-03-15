import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarNav, ViewSwitcher, ActionMenu, ViewSettingsMenu } from '../../../../components/Calendar/header/CalendarHeaderUtils';

vi.mock('lucide-react', () => ({
    ChevronLeft: () => <span data-testid="chevron-left" />,
    ChevronRight: () => <span data-testid="chevron-right" />,
    Settings2: () => <span data-testid="settings-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
}));

vi.mock('../../../../components/Calendar/header/DatePickerButton', () => ({
    DatePickerButton: ({ selectedDate, onDatePick }) => (
        <button type="button" onClick={() => onDatePick?.(selectedDate)} data-testid="date-picker">Pick</button>
    ),
}));

vi.mock('../../../../components/ui/SegmentedControl', () => ({
    SegmentedControl: ({ options, value, onChange }) => (
        <div data-testid="segmented-control">
            {options.map((o) => (
                <button key={o.value} type="button" onClick={() => onChange(o.value)}>{o.label}</button>
            ))}
            <span data-value={value} />
        </div>
    ),
}));

vi.mock('../../../../components/ui/AnimatedDropdown', () => ({
    default: ({ customTrigger, options, onChange, value }) => (
        <div data-testid="animated-dropdown">
            {customTrigger}
            {options?.map((opt) => (
                <button key={opt.value} type="button" onClick={() => onChange(opt.value)}>{opt.label}</button>
            ))}
            {value != null && <span data-value={value} />}
        </div>
    ),
}));

describe('CalendarHeaderUtils', () => {
    describe('CalendarNav', () => {
        it('renders prev, next, Today when showToday, date picker, and title', () => {
            const onPrev = vi.fn();
            const onNext = vi.fn();
            const onToday = vi.fn();
            const onDatePick = vi.fn();
            const selectedDate = new Date(2026, 0, 15);
            render(
                <CalendarNav
                    onPrev={onPrev}
                    onNext={onNext}
                    onToday={onToday}
                    showToday={true}
                    selectedDate={selectedDate}
                    onDatePick={onDatePick}
                    title="February 2026"
                />
            );
            expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
            expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
            expect(screen.getByText('Today')).toBeInTheDocument();
            expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'February 2026' })).toBeInTheDocument();

            fireEvent.click(screen.getByText('Today'));
            expect(onToday).toHaveBeenCalled();
            fireEvent.click(screen.getByTestId('chevron-left'));
            expect(onPrev).toHaveBeenCalled();
            fireEvent.click(screen.getByTestId('chevron-right'));
            expect(onNext).toHaveBeenCalled();
            fireEvent.click(screen.getByTestId('date-picker'));
            expect(onDatePick).toHaveBeenCalledWith(selectedDate);
        });

        it('does not render Today when showToday is false', () => {
            render(
                <CalendarNav
                    onPrev={vi.fn()}
                    onNext={vi.fn()}
                    onToday={vi.fn()}
                    showToday={false}
                    selectedDate={new Date()}
                    onDatePick={vi.fn()}
                />
            );
            expect(screen.queryByText('Today')).not.toBeInTheDocument();
        });

        it('does not render title when title is falsy', () => {
            render(
                <CalendarNav
                    onPrev={vi.fn()}
                    onNext={vi.fn()}
                    onToday={vi.fn()}
                    showToday={false}
                    selectedDate={new Date()}
                    onDatePick={vi.fn()}
                    title=""
                />
            );
            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        });
    });

    describe('ViewSwitcher', () => {
        it('renders modes and calls onChange', () => {
            const onChange = vi.fn();
            const modes = [{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }];
            render(<ViewSwitcher modes={modes} activeMode="month" onChange={onChange} />);
            fireEvent.click(screen.getByText('Week'));
            expect(onChange).toHaveBeenCalledWith('week');
        });
    });

    describe('ActionMenu', () => {
        it('calls onAddEvent when Add Event is selected', () => {
            const onAddEvent = vi.fn();
            const onImport = vi.fn();
            render(<ActionMenu onAddEvent={onAddEvent} onImport={onImport} />);
            const addBtn = screen.getByText('Add Event');
            fireEvent.click(addBtn);
            expect(onAddEvent).toHaveBeenCalled();
            expect(onImport).not.toHaveBeenCalled();
        });

        it('calls onImport when Import Timetable is selected', () => {
            const onAddEvent = vi.fn();
            const onImport = vi.fn();
            render(<ActionMenu onAddEvent={onAddEvent} onImport={onImport} />);
            fireEvent.click(screen.getByText('Import Timetable'));
            expect(onImport).toHaveBeenCalled();
            expect(onAddEvent).not.toHaveBeenCalled();
        });
    });

    describe('ViewSettingsMenu', () => {
        it('returns only settings button when not mobile', () => {
            render(<ViewSettingsMenu isMobile={false} modes={[]} activeMode="month" onViewChange={vi.fn()} />);
            expect(screen.getByTitle('View Settings')).toBeInTheDocument();
            expect(screen.queryByTestId('animated-dropdown')).not.toBeInTheDocument();
        });

        it('returns AnimatedDropdown with modes when mobile', () => {
            const onViewChange = vi.fn();
            const modes = [{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }];
            render(<ViewSettingsMenu isMobile={true} modes={modes} activeMode="month" onViewChange={onViewChange} />);
            expect(screen.getByTestId('animated-dropdown')).toBeInTheDocument();
            expect(screen.getByTitle('View Settings')).toBeInTheDocument();
            fireEvent.click(screen.getByText('Week'));
            expect(onViewChange).toHaveBeenCalledWith('week');
        });
    });
});
