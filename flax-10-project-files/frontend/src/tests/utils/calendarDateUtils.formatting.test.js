import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatTime,
  formatDate,
  formatDateTime,
  formatShortDate,
  formatDateWithYear,
  formatDateRange,
  formatTimeRange,
  formatMonthYear,
  getGreeting,
  formatDayLabel,
} from '../../components/Calendar/utils/dateUtils';

// Date formatting utility tests

describe('formatShortDate', () => {
  it('returns a non-empty string', () => {
    const d = new Date(2024, 0, 5);
    const result = formatShortDate(d);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the day number', () => {
    const d = new Date(2024, 0, 5);
    const result = formatShortDate(d);
    expect(result).toContain('5');
  });
});

describe('formatDateWithYear', () => {
  it('returns a non-empty string', () => {
    const d = new Date(2024, 0, 5);
    expect(typeof formatDateWithYear(d)).toBe('string');
  });

  it('includes the year', () => {
    const d = new Date(2024, 0, 5);
    expect(formatDateWithYear(d)).toContain('2024');
  });
});

describe('formatTime', () => {
  it('returns a time string', () => {
    const d = new Date(2024, 0, 1, 9, 30);
    const result = formatTime(d);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDate', () => {
  it('returns a non-empty string', () => {
    const d = new Date(2024, 0, 15);
    const result = formatDate(d);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('contains "at" between date and time', () => {
    const d = new Date(2024, 0, 15, 10, 0);
    expect(formatDateTime(d)).toContain(' at ');
  });
});

describe('formatMonthYear', () => {
  it('returns a non-empty string', () => {
    const d = new Date(2024, 5, 1);
    expect(typeof formatMonthYear(d)).toBe('string');
  });

  it('includes the year', () => {
    const d = new Date(2024, 5, 1);
    expect(formatMonthYear(d)).toContain('2024');
  });
});

describe('formatDateRange', () => {
  it('returns a single date for same-day events', () => {
    const start = new Date(2024, 0, 15, 9, 0).toISOString();
    const end = new Date(2024, 0, 15, 10, 0).toISOString();
    const result = formatDateRange(start, end, false);
    expect(result).toContain('2024');
  });

  it('returns a range for multi-day events', () => {
    const start = new Date(2024, 0, 15, 9, 0).toISOString();
    const end = new Date(2024, 0, 20, 10, 0).toISOString();
    const result = formatDateRange(start, end, false);
    expect(result).toContain('–');
  });

  it('handles all-day events (midnight aligned)', () => {
    const start = new Date(2024, 0, 15, 0, 0, 0, 0).toISOString();
    const end = new Date(2024, 0, 16, 0, 0, 0, 0).toISOString();
    // Both midnight — end is moved back by 1ms so they become same day
    const result = formatDateRange(start, end, false);
    expect(result).toContain('2024');
  });
});

describe('formatTimeRange', () => {
  it('returns "All day" for allDay events', () => {
    const start = new Date(2024, 0, 15, 9, 0).toISOString();
    const end = new Date(2024, 0, 15, 10, 0).toISOString();
    expect(formatTimeRange(start, end, true)).toBe('All day');
  });

  it('returns "All day" for midnight-aligned events', () => {
    const start = new Date(2024, 0, 15, 0, 0).toISOString();
    const end = new Date(2024, 0, 16, 0, 0).toISOString();
    expect(formatTimeRange(start, end, false)).toBe('All day');
  });

  it('returns a time range for timed events', () => {
    const start = new Date(2024, 0, 15, 9, 0).toISOString();
    const end = new Date(2024, 0, 15, 10, 0).toISOString();
    const result = formatTimeRange(start, end, false);
    expect(result).toContain(' to ');
  });
});

describe('getGreeting', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "Good morning" before noon', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 8, 0));
    expect(getGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" between noon and 18:00', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 14, 0));
    expect(getGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" after 18:00', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 20, 0));
    expect(getGreeting()).toBe('Good evening');
  });
});

describe('formatDayLabel', () => {
  it('returns "Today" for today', () => {
    const today = new Date();
    expect(formatDayLabel(today)).toBe('Today');
  });

  it('returns formatted string for another day', () => {
    const someDay = new Date(2024, 0, 15);
    const today = new Date(2024, 5, 1);
    const result = formatDayLabel(someDay, today);
    expect(result).not.toBe('Today');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('uses custom "today" reference for comparison', () => {
    const refDay = new Date(2024, 5, 1);
    expect(formatDayLabel(refDay, refDay)).toBe('Today');
  });
});
