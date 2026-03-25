import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import {
  clamp,
  getDropdownHeight,
  getDisplayValue,
  isBeforeMinDate,
  parseIncomingValue,
  emitDateTimeChange,
  formatIncomingForInput,
  handleDaySelect,
  handleHourChange,
  handleMinuteChange,
  navigateMonth,
} from '../../../../components/common/inputs/dateTimePickerUtils';
import {
  TriggerButton,
  CalendarSection,
  TimePickerRow,
  DropdownPanel,
} from '../../../../components/common/inputs/DateTimePickerParts';
import {
  useSyncValue,
  useClickOutside,
  useDerivedCalendarState,
} from '../../../../components/common/inputs/useDateTimePicker';

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

vi.mock('../../../../components/common/AnimatedDropdown', () => ({
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

describe('DateTimePicker helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('covers utility branches for display, min-date checks, parsing, and emitters', () => {
    const date = new Date('2026-03-12T09:05:00');
    const onChange = vi.fn();
    const setSelDate = vi.fn();
    const setHour = vi.fn();
    const setMinute = vi.fn();
    const emitChange = vi.fn();
    const setViewM = vi.fn();
    const setViewY = vi.fn();

    expect(clamp(15, 1, 10)).toBe(10);
    expect(getDropdownHeight(true, false)).toBe(90);
    expect(getDropdownHeight(false, true)).toBe(290);
    expect(getDropdownHeight(false, false)).toBe(330);
    expect(getDisplayValue(date, true, false)).toBe('09:05');
    expect(getDisplayValue(date, false, true)).toBe('12 / 03 / 2026');
    expect(isBeforeMinDate('2026-03-09', '2026-03-10')).toBe(true);
    expect(isBeforeMinDate('2026-03-10', 'invalid')).toBe(false);
    expect(isBeforeMinDate(null, '2026-03-10')).toBe(false);
    expect(parseIncomingValue('2026-03-12', false, true)?.getDate()).toBe(12);
    expect(Number.isNaN(parseIncomingValue('not-a-date', false, false)?.getTime())).toBe(true);

    emitDateTimeChange(date, 14, 45, false, true, onChange);
    expect(onChange).toHaveBeenCalledWith('2026-03-12');
    expect(formatIncomingForInput('2026-03-12T09:05')).toBe('formatted:2026-03-12T09:05');

    handleDaySelect(18, 2026, 2, setSelDate, emitChange, 9, 30);
    expect(setSelDate).toHaveBeenCalledWith(expect.any(Date));
    expect(emitChange).toHaveBeenCalledWith(expect.any(Date), 9, 30);

    handleHourChange(13, setHour, date, emitChange, 15);
    handleHourChange(13, setHour, null, emitChange, 15);
    expect(setHour).toHaveBeenCalledTimes(2);

    handleMinuteChange(50, setMinute, date, emitChange, 13);
    handleMinuteChange(50, setMinute, null, emitChange, 13);
    expect(setMinute).toHaveBeenCalledTimes(2);

    navigateMonth(-1, 0, setViewM, setViewY);
    navigateMonth(-1, 5, setViewM, setViewY);
    navigateMonth(1, 11, setViewM, setViewY);
    navigateMonth(1, 4, setViewM, setViewY);

    expect(setViewY).toHaveBeenCalledTimes(2);
    expect(setViewM).toHaveBeenCalled();
  });

  it('renders picker parts and covers keyboard, clear, disabled day, and portal click branches', () => {
    const setOpen = vi.fn();
    const setSelDate = vi.fn();
    const onChange = vi.fn();
    const prevMonth = vi.fn();
    const nextMonth = vi.fn();
    const selectDay = vi.fn();

    const { rerender } = render(
      <TriggerButton
        open={false}
        setOpen={setOpen}
        selDate={new Date('2026-03-12T09:05:00')}
        timeOnly={false}
        dateOnly={false}
        placeholder="Pick"
        setSelDate={setSelDate}
        onChange={onChange}
        hideIcon
      />,
    );

    const trigger = document.querySelector('[role="button"]');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.click(screen.getByLabelText('Clear date'));
    expect(setOpen).toHaveBeenCalled();
    expect(setSelDate).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.queryByText('📅')).not.toBeInTheDocument();

    rerender(
      <CalendarSection
        viewM={2}
        viewY={2026}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        days={[null, 10, 11]}
        isToday={(day) => day === 10}
        isSel={(day) => day === 11}
        isDisabled={(day) => day === 11}
        selectDay={selectDay}
      />,
    );

    fireEvent.click(screen.getByText('‹'));
    fireEvent.click(screen.getByText('›'));
    expect(prevMonth).toHaveBeenCalled();
    expect(nextMonth).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '11' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(selectDay).toHaveBeenCalledWith(10);

    rerender(
      <TimePickerRow
        hour={8}
        minute={5}
        changeHour={vi.fn()}
        changeMinute={vi.fn()}
        timeOnly
        setOpen={setOpen}
      />,
    );

    fireEvent.change(screen.getByTestId('dd-HH'), { target: { value: '9' } });
    fireEvent.change(screen.getByTestId('dd-MM'), { target: { value: '7' } });
    fireEvent.click(screen.getByText('Done'));
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it('renders dropdown panel variants and the outside-click hook ignores trigger, dropdown, and portal clicks', () => {
    const setOpen = vi.fn();
    const selectDay = vi.fn();

    const { rerender } = render(
      <DropdownPanel
        ref={null}
        pos={{ top: 10, left: 20 }}
        dateOnly
        timeOnly={false}
        setOpen={setOpen}
        selectDay={selectDay}
        viewM={2}
        viewY={2026}
        prevMonth={vi.fn()}
        nextMonth={vi.fn()}
        days={[12]}
        isToday={() => false}
        isSel={() => false}
        isDisabled={() => false}
        hour={9}
        minute={15}
        changeHour={vi.fn()}
        changeMinute={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '12' }));
    expect(selectDay).toHaveBeenCalledWith(12);
    expect(setOpen).toHaveBeenCalledWith(false);

    rerender(
      <DropdownPanel
        ref={null}
        pos={{ top: 10, left: 20 }}
        dateOnly={false}
        timeOnly
        setOpen={setOpen}
        selectDay={selectDay}
        viewM={2}
        viewY={2026}
        prevMonth={vi.fn()}
        nextMonth={vi.fn()}
        days={[12]}
        isToday={() => false}
        isSel={() => false}
        isDisabled={() => false}
        hour={9}
        minute={15}
        changeHour={vi.fn()}
        changeMinute={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '12' })).not.toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    const trigger = document.createElement('div');
    const dropdown = document.createElement('div');
    const portal = document.createElement('div');
    portal.setAttribute('data-dropdown-portal', 'true');
    document.body.append(trigger, dropdown, portal);

    const ref = { current: trigger };
    const dropdownRef = { current: dropdown };

    renderHook(() => useClickOutside(true, ref, dropdownRef, setOpen));

    fireEvent.pointerDown(trigger);
    fireEvent.pointerDown(dropdown);
    fireEvent.pointerDown(portal);
    expect(setOpen).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(setOpen).toHaveBeenCalledTimes(3);
  });

  it('syncs incoming values and derives calendar selection and disabled dates', () => {
    const setSelDate = vi.fn();
    const setHour = vi.fn();
    const setMinute = vi.fn();
    const setViewY = vi.fn();
    const setViewM = vi.fn();

    renderHook(() =>
      useSyncValue('2026-03-12T09:05', false, false, setSelDate, setHour, setMinute, setViewY, setViewM),
    );
    expect(setSelDate).toHaveBeenCalledWith(expect.any(Date));
    expect(setHour).toHaveBeenCalledWith(9);
    expect(setMinute).toHaveBeenCalledWith(5);
    expect(setViewY).toHaveBeenCalledWith(2026);
    expect(setViewM).toHaveBeenCalledWith(2);

    renderHook(() =>
      useSyncValue('', false, false, setSelDate, setHour, setMinute, setViewY, setViewM),
    );
    expect(setSelDate).toHaveBeenCalledWith(null);

    const { result } = renderHook(() =>
      useDerivedCalendarState(2026, 2, new Date('2026-03-10T12:00:00'), '2026-03-11'),
    );
    expect(result.current.isToday(10)).toBe(true);
    expect(result.current.isSel(10)).toBe(true);
    expect(result.current.isDisabled(9)).toBe(true);
    expect(result.current.days).toContain(31);
  });
});
