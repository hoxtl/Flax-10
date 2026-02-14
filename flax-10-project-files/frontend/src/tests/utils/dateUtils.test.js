import { describe, it, expect, vi } from 'vitest';
import * as dateUtils from '../../utils/dateUtils';

const date = new Date(2026, 1, 15);

const testGetWeekDays = () => {
    const week = dateUtils.getWeekDays(date);
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(0);
    expect(week[0].getDate()).toBe(15);
    expect(week[6].getDate()).toBe(21);
};

const testGetMonthDays = () => {
    const days = dateUtils.getMonthDays(date);
    expect(days).toHaveLength(28);
    expect(days[0].getDate()).toBe(1);
    expect(days[27].getDate()).toBe(28);
};

const testMonthPadding = () => {
    const mar = new Date(2026, 2, 15);
    const days = dateUtils.getMonthDays(mar);
    expect(days).toHaveLength(35);
    expect(days[0].getDate()).toBe(1);
    expect(days[days.length - 1].getDate()).toBe(4);
};

const testDateHelpers = () => {
    expect(dateUtils.getStartOfWeek(new Date(2026, 1, 18)).getDate()).toBe(15);
    expect(dateUtils.getStartOfMonth(date).getDate()).toBe(1);
    expect(dateUtils.getEndOfMonth(date).getDate()).toBe(28);
    expect(dateUtils.addDays(date, 5).getDate()).toBe(20);
    expect(dateUtils.addWeeks(date, 1).getDate()).toBe(22);
    expect(dateUtils.addMonths(date, 1).getMonth()).toBe(2);
    expect(dateUtils.startOfDay(new Date(2026, 1, 15, 12, 30)).getHours()).toBe(0);
};

const testComparisons = () => {
    expect(dateUtils.isSameDay(date, new Date(2026, 1, 15, 10, 0))).toBe(true);
    expect(dateUtils.isSameDay(date, new Date(2026, 1, 16))).toBe(false);
    expect(dateUtils.isSameMonth(date, new Date(2026, 1, 20))).toBe(true);
    expect(dateUtils.isSameMonth(date, new Date(2026, 2, 15))).toBe(false);
};

const testIsToday = () => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
    expect(dateUtils.isToday(date)).toBe(true);
    expect(dateUtils.isToday(dateUtils.addDays(date, 1))).toBe(false);
    vi.useRealTimers();
};

const testFormatting = () => {
    const d = new Date(2026, 1, 15, 13, 5);
    expect(dateUtils.formatTime(d)).toMatch(/01:05 PM|13:05|1:05 PM/i);
    expect(dateUtils.formatDate(date)).toMatch(/Sun, Feb 15|Sun, 15 Feb/);
    expect(dateUtils.formatMonthYear(date)).toBe('February 2026');
};

const testFormatDayLabel = () => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
    expect(dateUtils.formatDayLabel(date)).toBe('Today');
    expect(dateUtils.formatDayLabel(dateUtils.addDays(date, 1))).toMatch(/Mon, Feb 16/);
    vi.useRealTimers();
};

const testGreeting = () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15, 9, 0));
    expect(dateUtils.getGreeting()).toBe('Good morning');
    vi.setSystemTime(new Date(2026, 1, 15, 14, 0));
    expect(dateUtils.getGreeting()).toBe('Good afternoon');
    vi.useRealTimers();
};

const testInputs = () => {
    expect(dateUtils.parseDateInput(null)).toBeNull();
    const d = dateUtils.parseDateInput('2026-02-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getDate()).toBe(15);
};

const testOverlapsAndAllDay = () => {
    const day = new Date(2026, 1, 15);
    expect(dateUtils.overlapsDay(new Date(2026, 1, 15, 10), new Date(2026, 1, 15, 11), day)).toBe(true);
    expect(dateUtils.overlapsDay(new Date(2026, 1, 14, 10), new Date(2026, 1, 14, 11), day)).toBe(false);
    expect(dateUtils.isAllDayEvent({ start_time: new Date(2026, 1, 15, 10), end_time: new Date(2026, 1, 16, 10) })).toBe(true);
};

describe('dateUtils', () => {
    it('getWeekDays returns 7 days', testGetWeekDays);
    it('getMonthDays returns calendar month', testGetMonthDays);
    it('handles month padding', testMonthPadding);
    it('helper functions work correctly', testDateHelpers);
    it('comparison functions work correctly', testComparisons);
    it('isToday works with mocked time', testIsToday);
    it('formatting functions work correctly', testFormatting);
    it('formatDayLabel handles Today', testFormatDayLabel);
    it('getGreeting returns correct greeting', testGreeting);
    it('parseDateInput handles strings', testInputs);
    it('overlapsDay and isAllDayEvent work', testOverlapsAndAllDay);
});
