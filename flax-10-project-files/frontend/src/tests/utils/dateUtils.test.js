import { describe, it, expect, vi } from 'vitest';
import {
    getWeekDays,
    getMonthDays,
    getStartOfWeek,
    getStartOfMonth,
    getEndOfMonth,
    addDays,
    isSameDay,
    isSameMonth,
    formatTime,
    formatDate,
    formatMonthYear,
    addWeeks,
    addMonths,
    getGreeting,
    startOfDay,
    isToday,
    formatDayLabel,
    parseDateInput
} from '../../utils/dateUtils';

describe('dateUtils', () => {
    // Feb 15 2026 is Sunday
    const date = new Date(2026, 1, 15);

    describe('getWeekDays', () => {
        it('should return 7 days starting from Sunday', () => {
            const week = getWeekDays(date);
            expect(week).toHaveLength(7);
            expect(week[0].getDay()).toBe(0); // Sunday
            expect(week[0].getDate()).toBe(15);
            expect(week[6].getDate()).toBe(21);
        });
    });

    describe('getMonthDays', () => {
        it('should return full calendar month days', () => {
            // Feb 2026 (28 days, fits 4 weeks exact)
            const days = getMonthDays(date);
            // 4 weeks * 7 = 28
            expect(days).toHaveLength(28);
            expect(days[0].getDate()).toBe(1);
            expect(days[27].getDate()).toBe(28);
        });

        it('should handle months with padding', () => {
            // March 2026
            const mar = new Date(2026, 2, 15);
            const days = getMonthDays(mar);
            // 5 rows = 35 days
            expect(days).toHaveLength(35);
            expect(days[0].getDate()).toBe(1); // Mar 1 is Sunday, so starts cleanly?
            // Mar 1 2026 is Sunday.
            // Mar 31 is Tuesday.
            // Padding: Apr 1 (Wed) ... Apr 4 (Sat)
            const last = days[days.length - 1];
            expect(last.getDate()).toBe(4);
            expect(last.getMonth()).toBe(3); // April
        });
    });

    describe('Helpers', () => {
        it('getStartOfWeek', () => {
            const d = getStartOfWeek(new Date(2026, 1, 18)); // Wed Feb 18
            expect(d.getDate()).toBe(15); // Sun Feb 15
        });

        it('getStartOfMonth', () => {
            const d = getStartOfMonth(date);
            expect(d.getDate()).toBe(1);
        });

        it('getEndOfMonth', () => {
            const d = getEndOfMonth(date);
            expect(d.getDate()).toBe(28); // Feb 2026
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
            expect(d.getMonth()).toBe(2); // March
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
            // Mock locale needed?
            // Assuming en-US behavior or consistent
            const d = new Date(2026, 1, 15, 13, 5);
            expect(formatTime(d)).toMatch(/01:05 PM|13:05|1:05 PM/);
        });

        it('formatDate', () => {
            expect(formatDate(date)).toMatch(/Sun, Feb 15/);
        });

        it('formatMonthYear', () => {
            expect(formatMonthYear(date)).toBe('February 2026');
        });

        it('formatDayLabel', () => {
            vi.useFakeTimers();
            vi.setSystemTime(date);
            expect(formatDayLabel(date)).toBe('Today');
            expect(formatDayLabel(addDays(date, 1))).toMatch(/Mon, Feb 16/);
            vi.useRealTimers();
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
            const d = parseDateInput('2026-02-15');
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(1);
            expect(d.getDate()).toBe(15);
            expect(d.getHours()).toBe(0);
        });
    });
});
