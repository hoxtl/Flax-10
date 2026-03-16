import { describe, it, expect } from 'vitest';
import {
  getWeekDays,
  getMonthDays,
  getStartOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  addDays,
  isSameDay,
  overlapsDay,
  isSameMonth,
  addWeeks,
  addMonths,
  addHourToTime,
  startOfDay,
  isToday,
  parseDateInput,
} from '../../components/Calendar/utils/dateUtils';

// Date arithmetic utility tests

describe('addDays', () => {
  it('adds positive days', () => {
    const base = new Date(2024, 0, 1); // Jan 1 2024
    const result = addDays(base, 5);
    expect(result.getDate()).toBe(6);
    expect(result.getMonth()).toBe(0);
  });

  it('subtracts days with negative value', () => {
    const base = new Date(2024, 0, 10);
    const result = addDays(base, -3);
    expect(result.getDate()).toBe(7);
  });

  it('does not mutate the original date', () => {
    const base = new Date(2024, 0, 1);
    addDays(base, 10);
    expect(base.getDate()).toBe(1);
  });

  it('crosses month boundary', () => {
    const base = new Date(2024, 0, 30); // Jan 30
    const result = addDays(base, 3); // Feb 2
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(2);
  });
});

describe('getStartOfWeek', () => {
  it('returns Sunday for a Wednesday', () => {
    const wednesday = new Date(2024, 0, 3); // Wed Jan 3 2024
    const result = getStartOfWeek(wednesday);
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(31); // Dec 31 2023
  });

  it('returns same day if already Sunday', () => {
    const sunday = new Date(2024, 0, 7); // Sun Jan 7 2024
    const result = getStartOfWeek(sunday);
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(7);
  });

  it('sets time to midnight', () => {
    const date = new Date(2024, 0, 10, 15, 30, 45);
    const result = getStartOfWeek(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    const date = new Date(2024, 0, 10);
    const days = getWeekDays(date);
    expect(days).toHaveLength(7);
  });

  it('starts on Sunday', () => {
    const date = new Date(2024, 0, 10); // Wed
    const days = getWeekDays(date);
    expect(days[0].getDay()).toBe(0);
  });

  it('ends on Saturday', () => {
    const date = new Date(2024, 0, 10);
    const days = getWeekDays(date);
    expect(days[6].getDay()).toBe(6);
  });

  it('days are consecutive', () => {
    const date = new Date(2024, 0, 10);
    const days = getWeekDays(date);
    for (let i = 1; i < 7; i++) {
      expect(days[i].getTime() - days[i - 1].getTime()).toBe(86400000);
    }
  });
});

describe('getStartOfMonth', () => {
  it('returns the 1st of the month', () => {
    const date = new Date(2024, 5, 15); // June 15
    const result = getStartOfMonth(date);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(5);
  });
});

describe('getEndOfMonth', () => {
  it('returns last day of January (31)', () => {
    const date = new Date(2024, 0, 15);
    const result = getEndOfMonth(date);
    expect(result.getDate()).toBe(31);
  });

  it('returns last day of February in leap year (29)', () => {
    const date = new Date(2024, 1, 1); // 2024 is a leap year
    const result = getEndOfMonth(date);
    expect(result.getDate()).toBe(29);
  });

  it('returns last day of February in non-leap year (28)', () => {
    const date = new Date(2023, 1, 1);
    const result = getEndOfMonth(date);
    expect(result.getDate()).toBe(28);
  });
});

describe('getMonthDays', () => {
  it('returns a multiple of 7 days', () => {
    const date = new Date(2024, 0, 1); // Jan 2024
    const days = getMonthDays(date);
    expect(days.length % 7).toBe(0);
  });

  it('includes all days of the month', () => {
    const date = new Date(2024, 0, 1); // Jan 2024
    const days = getMonthDays(date);
    const janDays = days.filter(d => d.getMonth() === 0 && d.getFullYear() === 2024);
    expect(janDays).toHaveLength(31);
  });

  it('starts on or before the 1st of the month (starts on Sunday)', () => {
    const date = new Date(2024, 0, 1);
    const days = getMonthDays(date);
    expect(days[0].getDay()).toBe(0); // Sunday
  });
});

describe('getStartOfYear', () => {
  it('returns January 1st', () => {
    const date = new Date(2024, 6, 15);
    const result = getStartOfYear(date);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
    expect(result.getFullYear()).toBe(2024);
  });
});

describe('getEndOfYear', () => {
  it('returns December 31st', () => {
    const date = new Date(2024, 6, 15);
    const result = getEndOfYear(date);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
    expect(result.getFullYear()).toBe(2024);
  });
});

describe('isSameDay', () => {
  it('returns true for same day', () => {
    expect(isSameDay(new Date(2024, 0, 15, 8, 0), new Date(2024, 0, 15, 22, 0))).toBe(true);
  });

  it('returns false for different days', () => {
    expect(isSameDay(new Date(2024, 0, 15), new Date(2024, 0, 16))).toBe(false);
  });

  it('returns false for different months', () => {
    expect(isSameDay(new Date(2024, 0, 15), new Date(2024, 1, 15))).toBe(false);
  });
});

describe('isSameMonth', () => {
  it('returns true for same month and year', () => {
    expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
  });

  it('returns false for different months', () => {
    expect(isSameMonth(new Date(2024, 0, 1), new Date(2024, 1, 1))).toBe(false);
  });

  it('returns false for same month different year', () => {
    expect(isSameMonth(new Date(2024, 0, 1), new Date(2023, 0, 1))).toBe(false);
  });
});

describe('overlapsDay', () => {
  const day = new Date(2024, 0, 15); // Jan 15

  it('returns true when event fully spans the day', () => {
    const start = new Date(2024, 0, 14, 0, 0);
    const end = new Date(2024, 0, 16, 0, 0);
    expect(overlapsDay(start, end, day)).toBe(true);
  });

  it('returns true when event starts within the day', () => {
    const start = new Date(2024, 0, 15, 10, 0);
    const end = new Date(2024, 0, 15, 12, 0);
    expect(overlapsDay(start, end, day)).toBe(true);
  });

  it('returns false when event ends before the day starts', () => {
    const start = new Date(2024, 0, 13, 0, 0);
    const end = new Date(2024, 0, 15, 0, 0); // ends exactly at day start
    expect(overlapsDay(start, end, day)).toBe(false);
  });

  it('returns false when event starts after the day ends', () => {
    const start = new Date(2024, 0, 16, 0, 0);
    const end = new Date(2024, 0, 17, 0, 0);
    expect(overlapsDay(start, end, day)).toBe(false);
  });

  it('returns true when event straddles the start of the day', () => {
    const start = new Date(2024, 0, 14, 20, 0);
    const end = new Date(2024, 0, 15, 5, 0);
    expect(overlapsDay(start, end, day)).toBe(true);
  });
});

describe('startOfDay', () => {
  it('sets time to midnight', () => {
    const d = new Date(2024, 0, 15, 14, 30, 45, 500);
    const result = startOfDay(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('preserves the date', () => {
    const d = new Date(2024, 5, 20, 18, 0);
    const result = startOfDay(d);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
  });

  it('does not mutate the original', () => {
    const d = new Date(2024, 0, 15, 14, 30);
    startOfDay(d);
    expect(d.getHours()).toBe(14);
  });
});

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isToday(addDays(new Date(), -1))).toBe(false);
  });

  it('returns false for tomorrow', () => {
    expect(isToday(addDays(new Date(), 1))).toBe(false);
  });
});

describe('parseDateInput', () => {
  it('returns null for falsy input', () => {
    expect(parseDateInput('')).toBeNull();
    expect(parseDateInput(null)).toBeNull();
    expect(parseDateInput(undefined)).toBeNull();
  });

  it('parses a date string and sets time to midnight', () => {
    const result = parseDateInput('2024-06-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('parses a Date object', () => {
    const d = new Date(2024, 5, 15, 10, 30);
    const result = parseDateInput(d);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getHours()).toBe(0);
  });
});

describe('addWeeks', () => {
  it('adds one week correctly', () => {
    const base = new Date(2024, 0, 1);
    const result = addWeeks(base, 1);
    expect(result.getDate()).toBe(8);
  });

  it('adds two weeks correctly', () => {
    const base = new Date(2024, 0, 1);
    const result = addWeeks(base, 2);
    expect(result.getDate()).toBe(15);
  });

  it('subtracts weeks with negative value', () => {
    const base = new Date(2024, 0, 15);
    const result = addWeeks(base, -1);
    expect(result.getDate()).toBe(8);
  });
});

describe('addMonths', () => {
  it('adds months correctly', () => {
    const base = new Date(2024, 0, 15); // Jan 15
    const result = addMonths(base, 2); // Mar 15
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });

  it('subtracts months with negative value', () => {
    const base = new Date(2024, 5, 15); // Jun 15
    const result = addMonths(base, -3); // Mar 15
    expect(result.getMonth()).toBe(2);
  });

  it('crosses year boundary', () => {
    const base = new Date(2024, 11, 1); // Dec 2024
    const result = addMonths(base, 2); // Feb 2025
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
  });

  it('does not mutate the original', () => {
    const base = new Date(2024, 0, 15);
    addMonths(base, 3);
    expect(base.getMonth()).toBe(0);
  });
});

describe('addHourToTime', () => {
  it('adds one hour to a time string', () => {
    expect(addHourToTime('09:30')).toBe('10:30');
  });

  it('wraps around midnight', () => {
    expect(addHourToTime('23:00')).toBe('00:00');
  });

  it('preserves minutes', () => {
    expect(addHourToTime('08:45')).toBe('09:45');
  });

  it('pads hours with zero', () => {
    expect(addHourToTime('00:00')).toBe('01:00');
  });
});
