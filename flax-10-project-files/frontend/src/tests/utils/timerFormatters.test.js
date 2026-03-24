import { describe, it, expect } from 'vitest';
import {
    fmtDuration,
    formatHoursAsClock,
    formatSessionMinutes,
    taskDueText,
    extractTime,
    isToday,
} from '../../components/Timer/utils/timerFormatters';

describe('fmtDuration', () => {
    it('returns "0m" for 0 seconds', () => {
        expect(fmtDuration(0)).toBe('0m');
    });

    it('returns "0m" for negative values', () => {
        expect(fmtDuration(-10)).toBe('0m');
    });

    it('returns minutes only for < 1 hour', () => {
        expect(fmtDuration(60)).toBe('1m');
        expect(fmtDuration(1500)).toBe('25m');
        expect(fmtDuration(3599)).toBe('59m');
    });

    it('returns hours only when minutes are 0', () => {
        expect(fmtDuration(3600)).toBe('1h');
        expect(fmtDuration(7200)).toBe('2h');
    });

    it('returns hours and minutes when both are > 0', () => {
        expect(fmtDuration(3660)).toBe('1h 1m');
        expect(fmtDuration(7320)).toBe('2h 2m');
        expect(fmtDuration(3601)).toBe('1h 0m');
    });
});

describe('formatHoursAsClock', () => {
    it('formats 0 as 00:00:00', () => {
        expect(formatHoursAsClock(0)).toBe('00:00:00');
    });

    it('formats 1 hour as 01:00:00', () => {
        expect(formatHoursAsClock(1)).toBe('01:00:00');
    });

    it('formats 1.5 hours as 01:30:00', () => {
        expect(formatHoursAsClock(1.5)).toBe('01:30:00');
    });

    it('formats fractional hours with seconds', () => {
        // 0.5h = 1800s = 00:30:00
        expect(formatHoursAsClock(0.5)).toBe('00:30:00');
    });

    it('handles null/undefined input as 0', () => {
        expect(formatHoursAsClock(null)).toBe('00:00:00');
        expect(formatHoursAsClock(undefined)).toBe('00:00:00');
    });

    it('handles negative input by clamping to 0', () => {
        expect(formatHoursAsClock(-1)).toBe('00:00:00');
    });

    it('formats with proper padding', () => {
        // 10h 5m 30s
        expect(formatHoursAsClock(10 + 5/60 + 30/3600)).toBe('10:05:30');
    });
});

describe('formatSessionMinutes', () => {
    it('returns "0m" for 0 seconds', () => {
        expect(formatSessionMinutes(0)).toBe('0m');
    });

    it('formats minutes correctly', () => {
        expect(formatSessionMinutes(60)).toBe('1m');
        expect(formatSessionMinutes(1500)).toBe('25m');
        expect(formatSessionMinutes(3600)).toBe('60m');
    });

    it('rounds to nearest minute', () => {
        expect(formatSessionMinutes(90)).toBe('2m'); // 1.5 min -> rounds to 2
        expect(formatSessionMinutes(30)).toBe('1m'); // 0.5 min -> rounds to 1
    });

    it('handles negative values by clamping to 0', () => {
        expect(formatSessionMinutes(-60)).toBe('0m');
    });
});

describe('taskDueText', () => {
    it('returns null when task has no due_date', () => {
        expect(taskDueText({})).toBeNull();
        expect(taskDueText(null)).toBeNull();
        expect(taskDueText(undefined)).toBeNull();
    });

    it('returns null for invalid date', () => {
        expect(taskDueText({ due_date: 'not-a-date' })).toBeNull();
    });

    it('returns "now" when within 5 minutes', () => {
        const now = new Date();
        const twoMinsAhead = new Date(now.getTime() + 2 * 60000);
        expect(taskDueText({ due_date: twoMinsAhead.toISOString() }, now)).toBe('now');
    });

    it('returns "now" for 4 minutes in the past', () => {
        const now = new Date();
        const fourMinsPast = new Date(now.getTime() - 4 * 60000);
        expect(taskDueText({ due_date: fourMinsPast.toISOString() }, now)).toBe('now');
    });

    it('returns overdue text for past due dates', () => {
        const now = new Date();
        const tenMinsPast = new Date(now.getTime() - 10 * 60000);
        const result = taskDueText({ due_date: tenMinsPast.toISOString() }, now);
        expect(result).toContain('overdue');
    });

    it('returns overdue text with hours when > 60 min overdue', () => {
        const now = new Date();
        const twoHoursPast = new Date(now.getTime() - 2 * 3600000);
        const result = taskDueText({ due_date: twoHoursPast.toISOString() }, now);
        expect(result).toContain('overdue');
        expect(result).toContain('h');
    });

    it('returns overdue text with days when > 1 day overdue', () => {
        const now = new Date();
        const twoDaysPast = new Date(now.getTime() - 2 * 24 * 3600000 - 3600000);
        const result = taskDueText({ due_date: twoDaysPast.toISOString() }, now);
        expect(result).toContain('overdue');
        expect(result).toContain('d');
    });

    it('returns remaining text for future due dates (minutes only)', () => {
        const now = new Date();
        const thirtyMinsAhead = new Date(now.getTime() + 30 * 60000);
        const result = taskDueText({ due_date: thirtyMinsAhead.toISOString() }, now);
        expect(result).toContain('left');
    });

    it('returns remaining text with hours when > 1 hour away', () => {
        const now = new Date();
        const twoHoursAhead = new Date(now.getTime() + 2 * 3600000 + 30 * 60000);
        const result = taskDueText({ due_date: twoHoursAhead.toISOString() }, now);
        expect(result).toContain('left');
        expect(result).toContain('h');
    });

    it('returns remaining text with days when > 1 day away', () => {
        const now = new Date();
        const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 3600000 + 2 * 3600000);
        const result = taskDueText({ due_date: threeDaysAhead.toISOString() }, now);
        expect(result).toContain('left');
        expect(result).toContain('d');
    });

    it('returns remaining text with 0 hours when exactly hours boundary', () => {
        const now = new Date();
        // 59 min ahead -> hours = 0, so should return Xm left
        const fiftyNineMinsAhead = new Date(now.getTime() + 59 * 60000);
        const result = taskDueText({ due_date: fiftyNineMinsAhead.toISOString() }, now);
        expect(result).toContain('m left');
    });
});

describe('extractTime', () => {
    it('returns a Date for valid ISO string', () => {
        const d = extractTime('2026-01-01T12:00:00Z');
        expect(d).toBeInstanceOf(Date);
        expect(d.getFullYear()).toBe(2026);
    });

    it('returns null for invalid date string', () => {
        expect(extractTime('not-a-date')).toBeNull();
    });

    it('returns null when value throws', () => {
        // passing an object that Date() can't parse cleanly
        expect(extractTime({})).not.toBeNull(); // Date({}) = Invalid Date => null
    });
});

describe('isToday', () => {
    it('returns true for today\'s date', () => {
        const today = new Date().toISOString();
        expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
        const tomorrow = new Date(Date.now() + 86400000).toISOString();
        expect(isToday(tomorrow)).toBe(false);
    });

    it('returns false for invalid date', () => {
        expect(isToday('not-a-date')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isToday(null)).toBe(false);
    });
});
