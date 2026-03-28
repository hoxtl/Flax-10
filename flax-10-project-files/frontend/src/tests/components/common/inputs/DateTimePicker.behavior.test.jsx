import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  TriggerButton,
  CalendarSection,
  TimePickerRow,
  DropdownPanel,
} from '../../../../components/common/inputs/DateTimePickerParts';

const createStateSetter = (initialValue = false) => {
  let value = initialValue;
  return vi.fn((next) => {
    value = typeof next === 'function' ? next(value) : next;
    return value;
  });
};

vi.mock(
  '../../../../components/common/inputs/DateTimePicker.module.css',
  () => ({
    default: {
      trigger: 'trigger',
      triggerOpen: 'triggerOpen',
      triggerEmpty: 'triggerEmpty',
      triggerIcon: 'triggerIcon',
      triggerValueMono: 'triggerValueMono',
      clearBtn: 'clearBtn',
      calHeader: 'calHeader',
      navBtn: 'navBtn',
      monthLabel: 'monthLabel',
      calGrid: 'calGrid',
      dayHeader: 'dayHeader',
      dayCell: 'dayCell',
      dayCellEmpty: 'dayCellEmpty',
      dayCellToday: 'dayCellToday',
      dayCellSel: 'dayCellSel',
      dayCellDisabled: 'dayCellDisabled',
      timePicker: 'timePicker',
      timeOnlyPicker: 'timeOnlyPicker',
      timeIcon: 'timeIcon',
      timeDropdown: 'timeDropdown',
      timeAnimatedDd: 'timeAnimatedDd',
      timeSep: 'timeSep',
      doneBtn: 'doneBtn',
      dropdown: 'dropdown',
      dropdownPositioned: 'dropdownPositioned',
    },
  }),
);

vi.mock('../../../../components/common/animated_dropdown', () => ({
  default: ({ value, onChange, options, placeholder }) => (
    <select
      data-testid={`dd-${placeholder}`}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('lucide-react', () => ({
  Clock: (props) => <span data-testid="clock" {...props} />,
}));

vi.mock('../../../../utils/dateTimeInput', () => ({
  formatForDateTimeInput: vi.fn((value) => `formatted:${value}`),
}));

describe('DateTimePicker parts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const unrestrictedDropdownProps = {
    ref: null,
    pos: { top: 4, left: 6 },
    dateOnly: false,
    timeOnly: false,
    setOpen: vi.fn(),
    selectDay: vi.fn(),
    viewM: 2,
    viewY: 2026,
    prevMonth: vi.fn(),
    nextMonth: vi.fn(),
    days: [null, 5],
    isToday: () => false,
    isSel: () => false,
    isDisabled: () => false,
    hour: 1,
    minute: 2,
    changeHour: vi.fn(),
    changeMinute: vi.fn(),
  };

  it('renders trigger button and handles keyboard events', () => {
    const setOpen = createStateSetter(false), setSelDate = vi.fn(), onChange = vi.fn();
    const props = { open: false, setOpen, selDate: new Date('2026-03-12T09:05:00'), timeOnly: false, dateOnly: false, placeholder: 'Pick', setSelDate, onChange, hideIcon: true };
    render(<TriggerButton {...props} />);

    const trigger = document.querySelector('[role="button"]');
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: 'Tab' });
    fireEvent.click(screen.getByLabelText('Clear date'));

    expect(setOpen).toHaveBeenCalled();
    expect(setSelDate).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('toggles the trigger with Enter and Space keys', () => {
    const setOpen = createStateSetter(false);
    render(
      <TriggerButton
        open={false}
        setOpen={setOpen}
        selDate={new Date('2026-03-12T09:05:00')}
        timeOnly={false}
        dateOnly={false}
        placeholder="Pick"
        setSelDate={vi.fn()}
        onChange={vi.fn()}
        hideIcon
      />,
    );

  const trigger = document.querySelector('[role="button"]');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(setOpen).toHaveBeenCalledTimes(2);
  });

  it('renders the trigger icon and date-only formatting when not hidden', () => {
    render(
      <TriggerButton
        open={true}
        setOpen={vi.fn()}
        selDate={new Date('2026-03-12T09:05:00')}
        timeOnly={false}
        dateOnly={true}
        placeholder="Pick"
        setSelDate={vi.fn()}
        onChange={vi.fn()}
        hideIcon={false}
      />,
    );

    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('12 / 03 / 2026')).toBeInTheDocument();
  });

  it('shows placeholder styles when no date is selected', () => {
    render(
      <TriggerButton
        open={false}
        setOpen={createStateSetter(false)}
        selDate={null}
        timeOnly={false}
        dateOnly={false}
        placeholder="Pick"
        setSelDate={vi.fn()}
        onChange={vi.fn()}
        hideIcon
      />,
    );
    expect(screen.getByText('Pick')).toBeInTheDocument();
  });

  it('shows the clock icon for time-only mode and accepts a custom trigger class', () => {
    const { container } = render(
      <TriggerButton
        open={false}
        setOpen={vi.fn()}
        selDate={new Date('2026-03-12T14:05:00')}
        timeOnly
        dateOnly={false}
        placeholder="Pick"
        setSelDate={vi.fn()}
        onChange={vi.fn()}
        hideIcon={false}
        triggerClassName="customTrig"
      />,
    );
    expect(screen.getByText('🕒')).toBeInTheDocument();
    expect(container.querySelector('.customTrig')).toBeTruthy();
  });

  it('renders calendar section and handles navigation', () => {
    const prevMonth = vi.fn(), nextMonth = vi.fn(), selectDay = vi.fn();
    render(<CalendarSection viewM={2} viewY={2026} prevMonth={prevMonth} nextMonth={nextMonth} days={[null, 10, 11]} isToday={(d) => d === 10} isSel={(d) => d === 11} isDisabled={(d) => d === 11} selectDay={selectDay} />);

    fireEvent.click(screen.getByText('‹'));
    fireEvent.click(screen.getByText('›'));
    expect(prevMonth).toHaveBeenCalled();
    expect(nextMonth).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '11' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(selectDay).toHaveBeenCalledWith(10);
  });

  it('renders time picker row and handles changes', () => {
    const setOpen = vi.fn();
    render(<TimePickerRow hour={8} minute={5} changeHour={vi.fn()} changeMinute={vi.fn()} timeOnly setOpen={setOpen} />);

    fireEvent.change(screen.getByTestId('dd-HH'), { target: { value: '9' } });
    fireEvent.change(screen.getByTestId('dd-MM'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Done'));
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it('renders dropdown panel for days', () => {
    const selectDay = vi.fn(), setOpen = vi.fn();
    const props = { ref: null, pos: { top: 10, left: 20 }, dateOnly: true, setOpen, selectDay, viewM: 2, viewY: 2026, prevMonth: vi.fn(), nextMonth: vi.fn(), days: [12], isToday: () => false, isSel: () => false, isDisabled: () => false, hour: 9, minute: 15, changeHour: vi.fn(), changeMinute: vi.fn() };
    render(<DropdownPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '12' }));
    expect(selectDay).toHaveBeenCalledWith(12);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it('renders calendar and time sections together when not restricted', () => {
    render(<DropdownPanel {...unrestrictedDropdownProps} />);
    expect(screen.getByTestId('dd-HH')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(unrestrictedDropdownProps.selectDay).toHaveBeenCalledWith(5);
    expect(unrestrictedDropdownProps.setOpen).not.toHaveBeenCalled();
  });
});
