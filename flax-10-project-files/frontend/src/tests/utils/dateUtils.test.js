import { describe, it, expect, vi } from 'vitest';
import {
    getWeekDays, getMonthDays, getStartOfWeek, getStartOfMonth, getEndOfMonth,
    addDays, isSameDay, isSameMonth, addWeeks, addMonths, startOfDay, isToday,
    formatTime, formatDate, formatMonthYear, formatDayLabel, getGreeting,
    parseDateInput, formatDateTime, formatShortDate, formatDateWithYear,
    formatDateRange, formatTimeRange, addHourToTime, getMonthWeeks
} from '../../components/calendar/utils/dateUtils';

describe('dateUtils', () => {
    const date = new Date(2026, 1, 15);

    describe('getWeekDays', () => {
        it('should return 7 days starting from Sunday', () => {
            const week = getWeekDays(date);
            expect(week).toHaveLength(7);
            expect(week[0].getDay()).toBe(0);
            expect(week[0].getDate()).toBe(15);
            expect(week[6].getDate()).toBe(21);
        });
    });

    describe('getMonthDays', () => {
        it('should return full calendar month days', () => {
            const days = getMonthDays(date);
            expect(days).toHaveLength(28);
            expect(days[0].getDate()).toBe(1);
            expect(days[27].getDate()).toBe(28);
        });

        it('should handle months with padding', () => {
            const mar = new Date(2026, 2, 15);
            const days = getMonthDays(mar);
            expect(days).toHaveLength(35);
            expect(days[0].getDate()).toBe(1);
            const last = days[days.length - 1];
            expect(last.getDate()).toBe(4);
            expect(last.getMonth()).toBe(3);
        });
    });

    describe('getMonthWeeks', () => {
        it('builds full calendar weeks for a month grid', () => {
            const weeks = getMonthWeeks(new Date(2026, 2, 15));
            expect(weeks.length).toBeGreaterThan(4);
            expect(weeks[0]).toHaveLength(7);
            expect(weeks[0][0].getDay()).toBe(0);
            expect(weeks[weeks.length - 1][6].getDay()).toBe(6);
        });
    });

    describe('Helpers', () => {
        it('getStartOfWeek', () => {
            const d = getStartOfWeek(new Date(2026, 1, 18));
            expect(d.getDate()).toBe(15);
        });

        it('getStartOfMonth', () => {
            const d = getStartOfMonth(date);
            expect(d.getDate()).toBe(1);
        });

        it('getEndOfMonth', () => {
            const d = getEndOfMonth(date);
            expect(d.getDate()).toBe(28);
        });


        it('addDays', () => {
            const d = addDays(date, 5);
            expect(d.getDate()).toBe(20);
        });

        it('isSameDay', () => {
            expect(isSameDay(date, new Date(2026, 1, 15, 10, 0))).toBe(true);
            expect(isSameDay(date, new Date(2026, 1, 16))).toBe(false);
        });

        it('isSameMonth', () => {
            expect(isSameMonth(date, new Date(2026, 1, 20))).toBe(true);
            expect(isSameMonth(date, new Date(2026, 2, 15))).toBe(false);
        });

        it('addWeeks', () => {
            const d = addWeeks(date, 1);
            expect(d.getDate()).toBe(22);
        });

        it('addMonths', () => {
            const d = addMonths(date, 1);
            expect(d.getMonth()).toBe(2);
        });

        it('startOfDay', () => {
            const d = startOfDay(new Date(2026, 1, 15, 12, 30));
            expect(d.getHours()).toBe(0);
        });

        it('isToday', () => {
            vi.useFakeTimers();
            vi.setSystemTime(date);
            expect(isToday(date)).toBe(true);
            expect(isToday(addDays(date, 1))).toBe(false);
            vi.useRealTimers();
        });
    });

    describe('Formatting', () => {
        it('formatTime', () => {
            const d = new Date(2026, 1, 15, 13, 5);
            expect(formatTime(d)).toMatch(/01:05 PM|13:05|1:05 PM|01:05 pm|1:05 pm/);
        });

        it('formatDate', () => {
            expect(formatDate(date)).toMatch(/Sun, Feb 15|Sun, 15 Feb/);
        });

        it('formatMonthYear', () => {
            expect(formatMonthYear(date)).toBe('February 2026');
        });

        it('formatDayLabel', () => {
            vi.useFakeTimers();
            vi.setSystemTime(date);
            expect(formatDayLabel(date)).toBe('Today');
            expect(formatDayLabel(addDays(date, 1))).toMatch(/Mon, Feb 16|Mon, 16 Feb 2026/);
            vi.useRealTimers();
        });

        it('formatDateTime', () => {
            const d = new Date(2026, 1, 15, 10, 30);
            const result = formatDateTime(d);
            expect(result).toMatch(/Sun, Feb 15|Sun, 15 Feb/);
            expect(result).toMatch(/10:30/);
        });

        it('formatShortDate', () => {
            const d = new Date(2026, 1, 15);
            const result = formatShortDate(d);
            expect(result).toMatch(/15 Feb|Feb 15/);
        });

        it('formatDateWithYear', () => {
            const d = new Date(2026, 1, 15);
            const result = formatDateWithYear(d);
            expect(result).toMatch(/2026/);
            expect(result).toMatch(/Feb|15/);
        });

        it('formatDateRange: same day', () => {
            const start = new Date(2026, 1, 15, 10, 0);
            const end = new Date(2026, 1, 15, 11, 0);
            const result = formatDateRange(start, end, false);
            expect(result).toMatch(/2026/);
        });

        it('formatDateRange: different days', () => {
            const start = new Date(2026, 1, 15, 10, 0);
            const end = new Date(2026, 1, 20, 11, 0);
            const result = formatDateRange(start, end, false);
            expect(result).toContain('–');
        });

        it('formatDateRange: allDay', () => {
            const start = new Date(2026, 1, 15, 0, 0);
            const end = new Date(2026, 1, 16, 0, 0);
            const result = formatDateRange(start, end, true);
            expect(result).toMatch(/2026/);
        });

        it('formatTimeRange: normal', () => {
            const start = new Date(2026, 1, 15, 10, 0);
            const end = new Date(2026, 1, 15, 11, 0);
            const result = formatTimeRange(start, end, false);
            expect(result).toContain(' - ');
        });

        it('formatTimeRange: allDay', () => {
            const start = new Date(2026, 1, 15, 0, 0);
            const end = new Date(2026, 1, 16, 0, 0);
            expect(formatTimeRange(start, end, true)).toBe('All day');
        });

        it('formatTimeRange: midnight to midnight returns All day', () => {
            const start = new Date(2026, 1, 15, 0, 0);
            const end = new Date(2026, 1, 16, 0, 0);
            expect(formatTimeRange(start, end, false)).toBe('All day');
        });

        it('addHourToTime', () => {
            expect(addHourToTime('10:30')).toBe('11:30');
            expect(addHourToTime('23:00')).toBe('00:00');
        });
    });

    describe('Greeting', () => {
        it('should return greeting based on time', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 1, 15, 9, 0));
            expect(getGreeting()).toBe('Good morning');
            vi.setSystemTime(new Date(2026, 1, 15, 14, 0));
            expect(getGreeting()).toBe('Good afternoon');
            vi.setSystemTime(new Date(2026, 1, 15, 20, 0));
            expect(getGreeting()).toBe('Good evening');
            vi.useRealTimers();
        });
    });

    describe('Inputs', () => {
        it('parseDateInput', () => {
            expect(parseDateInput(null)).toBeNull();
            expect(parseDateInput('')).toBeNull();
            const d = parseDateInput('2026-02-15');
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(1);
            expect(d.getDate()).toBe(15);
            expect(d.getHours()).toBe(0);
        });

        it('overlapsDay (true)', async () => {
            const { overlapsDay } = await import('../../components/calendar/utils/dateUtils');
            const day = new Date(2026, 1, 15);
            expect(overlapsDay(new Date(2026, 1, 15, 10), new Date(2026, 1, 15, 11), day)).toBe(true);
            expect(overlapsDay(new Date(2026, 1, 15, 0), new Date(2026, 1, 16, 0), day)).toBe(true);
            expect(overlapsDay(new Date(2026, 1, 14, 20), new Date(2026, 1, 15, 5), day)).toBe(true);
            expect(overlapsDay(new Date(2026, 1, 15, 20), new Date(2026, 1, 16, 5), day)).toBe(true);
        });

        it('overlapsDay (false)', async () => {
            const { overlapsDay } = await import('../../components/calendar/utils/dateUtils');
            const day = new Date(2026, 1, 15);
            expect(overlapsDay(new Date(2026, 1, 14, 10), new Date(2026, 1, 14, 11), day)).toBe(false);
            expect(overlapsDay(new Date(2026, 1, 16, 10), new Date(2026, 1, 16, 11), day)).toBe(false);
            expect(overlapsDay(new Date(2026, 1, 14, 23), new Date(2026, 1, 15, 0), day)).toBe(false);
            expect(overlapsDay(new Date(2026, 1, 16, 0), new Date(2026, 1, 16, 1), day)).toBe(false);
        });

        it('isAllDayEvent', async () => {
            const { isAllDayEvent } = await import('../../components/calendar/utils/eventDisplayUtils');
            expect(isAllDayEvent({ start_time: new Date(2026, 1, 15, 10), end_time: new Date(2026, 1, 16, 10) })).toBe(false);
            expect(isAllDayEvent({ start_time: new Date(2026, 1, 15, 10), end_time: new Date(2026, 1, 16, 9) })).toBe(false);
            expect(isAllDayEvent({ start_time: new Date(2026, 1, 15, 0), end_time: new Date(2026, 1, 16, 0) })).toBe(true);
        });
    });
});
