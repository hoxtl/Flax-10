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

const pickerDate = new Date('2026-03-12T09:05:00');

const renderTriggerButton = (overrides = {}) => {
  const handlers = {
    setOpen: vi.fn(),
    setSelDate: vi.fn(),
    onChange: vi.fn(),
    ...overrides,
  };

  render(
    <TriggerButton
      open={false}
      setOpen={handlers.setOpen}
      selDate={pickerDate}
      timeOnly={false}
      dateOnly={false}
      placeholder="Pick"
      setSelDate={handlers.setSelDate}
      onChange={handlers.onChange}
      hideIcon
    />,
  );

  return handlers;
};

const renderCalendarSection = (props = {}) => {
  const defaults = {
    prevMonth: vi.fn(),
    nextMonth: vi.fn(),
    selectDay: vi.fn(),
    isToday: (day) => day === 10,
    isSel: (day) => day === 11,
    isDisabled: (day) => day === 11,
  };

  render(
    <CalendarSection
      viewM={2}
      viewY={2026}
      days={[null, 10, 11]}
      {...defaults}
      {...props}
    />,
  );

  return { ...defaults, ...props };
};

const renderDropdown = (props = {}) =>
  render(
    <DropdownPanel
      ref={null}
      pos={{ top: 10, left: 20 }}
      setOpen={vi.fn()}
      selectDay={vi.fn()}
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
      {...props}
    />,
  );

describe('DateTimePicker helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('utility helpers', () => {
    it('clamps values and computes dropdown height combos', () => {
      expect(clamp(15, 1, 10)).toBe(10);
      expect(getDropdownHeight(true, false)).toBe(90);
      expect(getDropdownHeight(false, true)).toBe(290);
      expect(getDropdownHeight(false, false)).toBe(330);
    });

    it('builds display strings for time and date views', () => {
      expect(getDisplayValue(pickerDate, true, false)).toBe('09:05');
      expect(getDisplayValue(pickerDate, false, true)).toBe('12 / 03 / 2026');
    });

    it('flags values occurring before the minimum date', () => {
      expect(isBeforeMinDate('2026-03-09', '2026-03-10')).toBe(true);
      expect(isBeforeMinDate('2026-03-10', 'invalid')).toBe(false);
      expect(isBeforeMinDate(null, '2026-03-10')).toBe(false);
    });

    it('parses incoming strings for date-only pickers', () => {
      expect(parseIncomingValue('2026-03-12', false, true)?.getDate()).toBe(12);
      expect(Number.isNaN(parseIncomingValue('not-a-date', false, false)?.getTime())).toBe(true);
    });

    it('emits normalized change events and formats for inputs', () => {
      const onChange = vi.fn();
      emitDateTimeChange(pickerDate, 14, 45, false, true, onChange);
      expect(onChange).toHaveBeenCalledWith('2026-03-12');
      expect(formatIncomingForInput('2026-03-12T09:05')).toBe('formatted:2026-03-12T09:05');
    });

    it('handles day selection and emits the change payload', () => {
      const setSelDate = vi.fn();
      const emitChange = vi.fn();
      handleDaySelect(18, 2026, 2, setSelDate, emitChange, 9, 30);
      expect(setSelDate).toHaveBeenCalledWith(expect.any(Date));
      expect(emitChange).toHaveBeenCalledWith(expect.any(Date), 9, 30);
    });

    it('updates hours and minutes even without a selected date', () => {
      const emitChange = vi.fn();
      const setHour = vi.fn();
      const setMinute = vi.fn();
      handleHourChange(13, setHour, pickerDate, emitChange, 15);
      handleHourChange(13, setHour, null, emitChange, 15);
      handleMinuteChange(50, setMinute, pickerDate, emitChange, 13);
      handleMinuteChange(50, setMinute, null, emitChange, 13);
      expect(setHour).toHaveBeenCalledTimes(2);
      expect(setMinute).toHaveBeenCalledTimes(2);
    });

    it('navigates between month boundaries', () => {
      const setViewM = vi.fn();
      const setViewY = vi.fn();
      navigateMonth(-1, 0, setViewM, setViewY);
      navigateMonth(-1, 5, setViewM, setViewY);
      navigateMonth(1, 11, setViewM, setViewY);
      navigateMonth(1, 4, setViewM, setViewY);
      expect(setViewY).toHaveBeenCalledTimes(2);
      expect(setViewM).toHaveBeenCalled();
    });
  });

  describe('picker parts', () => {
    it('trigger button toggles open state and clears the value', () => {
      const handlers = renderTriggerButton();
      const trigger = document.querySelector('[role="button"]');
      fireEvent.keyDown(trigger, { key: 'Enter' });
      fireEvent.keyDown(trigger, { key: ' ' });
      fireEvent.click(screen.getByLabelText('Clear date'));
      expect(handlers.setOpen).toHaveBeenCalled();
      expect(handlers.setSelDate).toHaveBeenCalledWith(null);
      expect(handlers.onChange).toHaveBeenCalledWith('');
      expect(screen.queryByText('📅')).not.toBeInTheDocument();
    });

    it('calendar section handles navigation and selection', () => {
      const handlers = renderCalendarSection();
      fireEvent.click(screen.getByText('‹'));
      fireEvent.click(screen.getByText('›'));
      fireEvent.click(screen.getByRole('button', { name: '10' }));
      expect(handlers.prevMonth).toHaveBeenCalled();
      expect(handlers.nextMonth).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '11' })).toBeDisabled();
      expect(handlers.selectDay).toHaveBeenCalledWith(10);
    });

    it('time picker row updates hour and minute dropdowns', () => {
      const setOpen = vi.fn();
      render(
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

    it('date dropdown closes after selecting a day', () => {
      const setOpen = vi.fn();
      const selectDay = vi.fn();
      renderDropdown({ dateOnly: true, timeOnly: false, setOpen, selectDay });
      fireEvent.click(screen.getByRole('button', { name: '12' }));
      expect(selectDay).toHaveBeenCalledWith(12);
      expect(setOpen).toHaveBeenCalledWith(false);
    });

    it('time-only dropdown hides day buttons and shows done text', () => {
      renderDropdown({ dateOnly: false, timeOnly: true });
      expect(screen.queryByRole('button', { name: '12' })).not.toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('outside click hook ignores trigger, dropdown, and portal', () => {
      const setOpen = vi.fn();
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
      fireEvent.pointerDown(document.body);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(setOpen).toHaveBeenCalledTimes(3);
    });
  });

  describe('picker hooks', () => {
    it('syncs incoming values into local state', () => {
      const setters = {
        setSelDate: vi.fn(),
        setHour: vi.fn(),
        setMinute: vi.fn(),
        setViewY: vi.fn(),
        setViewM: vi.fn(),
      };
      renderHook(() =>
        useSyncValue('2026-03-12T09:05', false, false, ...Object.values(setters)),
      );
      expect(setters.setSelDate).toHaveBeenCalledWith(expect.any(Date));
      expect(setters.setHour).toHaveBeenCalledWith(9);
      expect(setters.setMinute).toHaveBeenCalledWith(5);
      expect(setters.setViewY).toHaveBeenCalledWith(2026);
      expect(setters.setViewM).toHaveBeenCalledWith(2);
    });

    it('clears the selection when an empty value arrives', () => {
      const setSelDate = vi.fn();
      renderHook(() =>
        useSyncValue('', false, false, setSelDate, vi.fn(), vi.fn(), vi.fn(), vi.fn()),
      );
      expect(setSelDate).toHaveBeenCalledWith(null);
    });

    it('derives calendar state for today, selection, and disabled days', () => {
      const { result } = renderHook(() =>
        useDerivedCalendarState(2026, 2, new Date('2026-03-10T12:00:00'), '2026-03-11'),
      );
      expect(result.current.isToday(10)).toBe(true);
      expect(result.current.isSel(10)).toBe(true);
      expect(result.current.isDisabled(9)).toBe(true);
      expect(result.current.days).toContain(31);
    });
  });
});
