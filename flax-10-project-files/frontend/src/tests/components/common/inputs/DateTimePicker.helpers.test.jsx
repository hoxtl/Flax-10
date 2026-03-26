import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

  it('covers utility branches for display and heights', () => {
    expect(clamp(15, 1, 10)).toBe(10);
    expect(getDropdownHeight(true, false)).toBe(90);
    expect(getDropdownHeight(false, true)).toBe(290);
    expect(getDropdownHeight(false, false)).toBe(330);
    expect(getDisplayValue(null, false, false)).toBe('');
    expect(getDisplayValue(new Date('2026-03-12T09:05:00'), true, false)).toBe('09:05');
  });

  it('covers min-date checks and parsing utilities', () => {
    expect(isBeforeMinDate('2026-03-09', '2026-03-10')).toBe(true);
    expect(isBeforeMinDate('2026-03-10', 'invalid')).toBe(false);
    expect(isBeforeMinDate(null, '2026-03-10')).toBe(false);
    expect(parseIncomingValue('2026-03-12', false, true)?.getDate()).toBe(12);
    expect(Number.isNaN(parseIncomingValue('not-a-date', false, false)?.getTime())).toBe(true);
  });

  it('covers emitters and input formatting', () => {
    const onChange = vi.fn();
    const date = new Date('2026-03-12T09:05:00');
    emitDateTimeChange(date, 14, 45, false, true, onChange);
    emitDateTimeChange(null, 14, 45, false, false, onChange);
    expect(onChange).toHaveBeenNthCalledWith(1, '2026-03-12');
    expect(onChange).toHaveBeenNthCalledWith(2, '');
    expect(formatIncomingForInput('2026-03-12T09:05')).toBe('formatted:2026-03-12T09:05');
  });

  it('covers date and time change handlers', () => {
    const setSelDate = vi.fn();
    const emitChange = vi.fn();
    const setHour = vi.fn();
    const setMinute = vi.fn();
    const date = new Date('2026-03-12T09:05:00');

    handleDaySelect(18, 2026, 2, setSelDate, emitChange, 9, 30);
    expect(setSelDate).toHaveBeenCalledWith(expect.any(Date));
    expect(emitChange).toHaveBeenCalledWith(expect.any(Date), 9, 30);

    handleHourChange(13, setHour, date, emitChange, 15);
    expect(setHour).toHaveBeenCalled();
    handleMinuteChange(50, setMinute, date, emitChange, 13);
    expect(setMinute).toHaveBeenCalled();
  });

  it('covers month navigation logic', () => {
    const setViewM = vi.fn();
    const setViewY = vi.fn();

    navigateMonth(-1, 0, setViewM, setViewY);
    navigateMonth(1, 11, setViewM, setViewY);
    navigateMonth(-1, 5, setViewM, setViewY);
    navigateMonth(1, 5, setViewM, setViewY);
    expect(setViewY).toHaveBeenCalledTimes(2);
    expect(setViewM).toHaveBeenCalledTimes(4);
  });
});
