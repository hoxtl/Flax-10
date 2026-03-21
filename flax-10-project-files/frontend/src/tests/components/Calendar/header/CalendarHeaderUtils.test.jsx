import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarNav, ViewSwitcher, ActionMenu, ViewSettingsMenu, FilterDropdownButton } from '../../../../components/Calendar/header/CalendarHeaderUtils';

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
}));

vi.mock('lucide-react', () => ({
    ChevronLeft: () => <span data-testid="chevron-left" />,
    ChevronRight: () => <span data-testid="chevron-right" />,
    Settings2: () => <span data-testid="settings-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    Tag: () => <span data-testid="tag-icon" />,
}));

vi.mock('../../../../components/Calendar/header/DatePickerButton', () => ({
    DatePickerButton: ({ selectedDate, onDatePick }) => (
        <button type="button" onClick={() => onDatePick?.(selectedDate)} data-testid="date-picker">Pick</button>
    ),
}));

vi.mock('../../../../components/common/SegmentedControl/SegmentedControl', () => ({
    SegmentedControl: ({ options, value, onChange }) => (
        <div data-testid="segmented-control">
            {options.map((o) => (
                <button key={o.value} type="button" onClick={() => onChange(o.value)}>{o.label}</button>
            ))}
            <span data-value={value} />
        </div>
    ),
}));

vi.mock('../../../../components/common/AnimatedDropdown', () => ({
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

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({
        tags: [
            { id: 1, label: 'Lecture' },
            { id: 2, label: 'Other' },
        ],
    }),
}));

vi.mock('../../../../components/common/TagsSelector/TagsSelector', () => ({
    TagsSelector: ({ tags }) => (
        <div data-testid="tags-selector">
            {tags.map((tag) => <span key={tag.id}>{tag.label}</span>)}
        </div>
    ),
}));

vi.mock('../../../../components/Tags/TagManagerModal', () => ({
    default: () => <div data-testid="tag-manager-modal" />,
}));

describe('CalendarHeaderUtils', () => {
    describe('CalendarNav', () => {
        it('renders elements when showToday is true', () => {
            render(
                <CalendarNav
                    onPrev={vi.fn()} onNext={vi.fn()} onToday={vi.fn()}
                    showToday={true} selectedDate={new Date(2026, 0, 15)}
                    onDatePick={vi.fn()} title="February 2026"
                />
            );
            expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
            expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
            expect(screen.getByText('Today')).toBeInTheDocument();
            expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'February 2026' })).toBeInTheDocument();
        });

        it('nav buttons fire correct callbacks', () => {
            const onPrev = vi.fn();
            const onNext = vi.fn();
            const onToday = vi.fn();
            const onDatePick = vi.fn();
            const selectedDate = new Date(2026, 0, 15);
            render(
                <CalendarNav onPrev={onPrev} onNext={onNext} onToday={onToday}
                    showToday={true} selectedDate={selectedDate} onDatePick={onDatePick} />
            );
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
        it('renders Display Mode button and AnimatedDropdown', () => {
            render(<ViewSettingsMenu isMobile={false} modes={[]} activeMode="month" onViewChange={vi.fn()} />);
            expect(screen.getByTitle('Display Mode')).toBeInTheDocument();
            expect(screen.getByTestId('animated-dropdown')).toBeInTheDocument();
        });

        it('returns AnimatedDropdown with modes when mobile', () => {
            const onViewChange = vi.fn();
            render(<ViewSettingsMenu isMobile={true} activeMode="grid" onViewChange={onViewChange} />);
            expect(screen.getByTestId('animated-dropdown')).toBeInTheDocument();
            expect(screen.getByTitle('Display Mode')).toBeInTheDocument();
            fireEvent.click(screen.getByText('List View'));
            expect(onViewChange).toHaveBeenCalledWith('list');
        });
    });

    describe('FilterDropdownButton', () => {
        it('opens the tag popup on hover', () => {
            render(<FilterDropdownButton active="all" onChange={vi.fn()} />);
            fireEvent.mouseEnter(screen.getByLabelText('Filter events'));
            expect(screen.getByText('Filter by tag')).toBeInTheDocument();
            expect(screen.getByTestId('tags-selector')).toBeInTheDocument();
        });
    });
});
