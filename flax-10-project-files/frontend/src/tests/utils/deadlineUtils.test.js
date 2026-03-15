import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDeadlineCountdown, getDeadlineUrgency, formatDeadlineDateTime,
    DEADLINE_LABELS, DEADLINE_TYPES, TYPES_WITH_LOCATION, TYPES_WITH_END_DATE,
    getTimeRemainingCountdown, getDueInPhrase, getDeadlineDotUrgency,
    getTimeRemainingMonospace, getTimeRemainingClean, getTimeRemainingStamped,
    isDeadlineUnder24h } from '../../components/Modules/utils/deadlineUtils';

describe('deadlineUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-01T10:00:00'));
    });

    afterEach(() => vi.useRealTimers());

    it('should return past due for past date', () => {
        expect(getDeadlineCountdown('2026-02-01T10:00:00')).toBe('Overdue');
    });

    it('should return number of days remaining', () => {
        expect(getDeadlineCountdown('2026-03-06T10:00:00')).toBe('5d');
    });

    it('should return hours remaining in same day', () => {
        expect(getDeadlineCountdown('2026-03-01T14:00:00')).toBe('4h');
    });

    it('should return due today when due in under an hour', () => {
        expect(getDeadlineCountdown('2026-03-01T10:30:00')).toBe('Today');
    });

    it('should return critical when within 3 days', () => {
        expect(getDeadlineUrgency('2026-03-02T10:00:00')).toBe('critical');
    });

    it('should return urgent when within 7 days', () => {
        expect(getDeadlineUrgency('2026-03-05T10:00:00')).toBe('urgent');
    });

    it('should return normal for countdown more than 7 days', () => {
        expect(getDeadlineUrgency('2026-03-15T10:00:00')).toBe('normal');
    });

    it('should return a formatted string', () => {
        const result = formatDeadlineDateTime('2026-03-06T10:00:00');
        expect(result).toContain('March');
    });

    it('DEADLINE_LABELS has all four types', () => {
        expect(Object.keys(DEADLINE_LABELS)).toEqual(['exam', 'coursework', 'quiz', 'presentation']);
    });

    it('TYPES_WITH_LOCATION includes exam and presentation', () => {
        expect(TYPES_WITH_LOCATION).toContain('exam');
        expect(TYPES_WITH_LOCATION).toContain('presentation');
    });

    it('DEADLINE_TYPES has value and label for each', () => {
        DEADLINE_TYPES.forEach(t => {
            expect(t).toHaveProperty('value');
            expect(t).toHaveProperty('label');
        });
    });

    it('TYPES_WITH_END_DATE contains exam', () => {
        expect(TYPES_WITH_END_DATE).toContain('exam');
    });

    describe('getTimeRemainingCountdown', () => {
        it('overdue', () => {
            expect(getTimeRemainingCountdown('2026-02-01T10:00:00')).toBe('Overdue');
        });
        it('days and hours remaining', () => {
            const result = getTimeRemainingCountdown('2026-03-03T14:00:00');
            expect(result).toMatch(/2d 4h left|2d left/);
        });
        it('days without hours', () => {
            expect(getTimeRemainingCountdown('2026-03-03T10:00:00')).toMatch(/2d left/);
        });
        it('hours and minutes', () => {
            expect(getTimeRemainingCountdown('2026-03-01T12:30:00')).toMatch(/2h 30m left/);
        });
        it('hours without minutes', () => {
            expect(getTimeRemainingCountdown('2026-03-01T12:00:00')).toBe('2h left');
        });
        it('minutes only', () => {
            expect(getTimeRemainingCountdown('2026-03-01T10:45:00')).toBe('45m left');
        });
        it('due soon when within a minute', () => {
            expect(getTimeRemainingCountdown('2026-03-01T10:00:30')).toBe('Due soon');
        });
    });

    describe('getDueInPhrase', () => {
        it('overdue', () => {
            expect(getDueInPhrase('2026-02-01T10:00:00')).toBe('Overdue');
        });
        it('due in days and hours', () => {
            const result = getDueInPhrase('2026-03-03T14:00:00');
            expect(result).toMatch(/Due in 2d 4h|Due in 2 days/);
        });
        it('due in 1 day (singular)', () => {
            expect(getDueInPhrase('2026-03-02T10:00:00')).toBe('Due in 1 day');
        });
        it('due in hours and minutes', () => {
            expect(getDueInPhrase('2026-03-01T12:30:00')).toMatch(/Due in 2h 30m/);
        });
        it('due in 1 hour (singular)', () => {
            expect(getDueInPhrase('2026-03-01T11:00:00')).toBe('Due in 1 hour');
        });
        it('due in multiple hours', () => {
            expect(getDueInPhrase('2026-03-01T12:00:00')).toBe('Due in 2 hours');
        });
        it('due in minutes', () => {
            expect(getDueInPhrase('2026-03-01T10:45:00')).toBe('Due in 45m');
        });
        it('due soon', () => {
            expect(getDueInPhrase('2026-03-01T10:00:30')).toBe('Due soon');
        });
    });

    describe('getDeadlineDotUrgency', () => {
        it('critical for overdue', () => {
            expect(getDeadlineDotUrgency('2026-02-01T10:00:00')).toBe('critical');
        });
        it('critical for < 3 days', () => {
            expect(getDeadlineDotUrgency('2026-03-02T10:00:00')).toBe('critical');
        });
        it('caution for 3-7 days', () => {
            expect(getDeadlineDotUrgency('2026-03-05T10:00:00')).toBe('caution');
        });
        it('safe for 7+ days', () => {
            expect(getDeadlineDotUrgency('2026-03-15T10:00:00')).toBe('safe');
        });
    });

    describe('getTimeRemainingMonospace', () => {
        it('overdue', () => {
            expect(getTimeRemainingMonospace('2026-02-01T10:00:00')).toBe('Overdue');
        });
        it('days format', () => {
            const result = getTimeRemainingMonospace('2026-03-03T10:00:00');
            expect(result).toMatch(/\d+d : \d+h : \d+m/);
        });
        it('hours format', () => {
            const result = getTimeRemainingMonospace('2026-03-01T14:00:00');
            expect(result).toMatch(/\d+h : \d+m : \d+s/);
        });
    });

    describe('getTimeRemainingClean', () => {
        it('overdue', () => {
            expect(getTimeRemainingClean('2026-02-01T10:00:00')).toBe('Overdue');
        });
        it('days and hours', () => {
            expect(getTimeRemainingClean('2026-03-03T14:00:00')).toMatch(/2d 4h|2d/);
        });
        it('days only', () => {
            expect(getTimeRemainingClean('2026-03-03T10:00:00')).toBe('2d');
        });
        it('hours and minutes', () => {
            expect(getTimeRemainingClean('2026-03-01T12:30:00')).toBe('2h 30m');
        });
        it('hours only', () => {
            expect(getTimeRemainingClean('2026-03-01T12:00:00')).toBe('2h');
        });
        it('minutes only', () => {
            expect(getTimeRemainingClean('2026-03-01T10:45:00')).toBe('45m');
        });
        it('soon', () => {
            expect(getTimeRemainingClean('2026-03-01T10:00:30')).toBe('Soon');
        });
    });

    describe('getTimeRemainingStamped', () => {
        it('overdue', () => {
            expect(getTimeRemainingStamped('2026-02-01T10:00:00')).toEqual({ number: null, unit: 'Overdue' });
        });
        it('days (plural)', () => {
            const r = getTimeRemainingStamped('2026-03-03T10:00:00');
            expect(r).toEqual({ number: 2, unit: 'Days' });
        });
        it('days (singular)', () => {
            const r = getTimeRemainingStamped('2026-03-02T10:00:00');
            expect(r).toEqual({ number: 1, unit: 'Day' });
        });
        it('hours (plural)', () => {
            const r = getTimeRemainingStamped('2026-03-01T12:00:00');
            expect(r).toEqual({ number: 2, unit: 'Hours' });
        });
        it('hours (singular)', () => {
            const r = getTimeRemainingStamped('2026-03-01T11:00:00');
            expect(r).toEqual({ number: 1, unit: 'Hour' });
        });
        it('minutes (plural)', () => {
            const r = getTimeRemainingStamped('2026-03-01T10:45:00');
            expect(r).toEqual({ number: 45, unit: 'Minutes' });
        });
        it('minutes (singular)', () => {
            const r = getTimeRemainingStamped('2026-03-01T10:01:00');
            expect(r).toEqual({ number: 1, unit: 'Minute' });
        });
        it('due soon', () => {
            const r = getTimeRemainingStamped('2026-03-01T10:00:30');
            expect(r).toEqual({ number: null, unit: 'Due soon' });
        });
    });

    describe('isDeadlineUnder24h', () => {
        it('false for past deadlines', () => {
            expect(isDeadlineUnder24h('2026-02-01T10:00:00')).toBe(false);
        });
        it('true for deadline within 24h', () => {
            expect(isDeadlineUnder24h('2026-03-01T20:00:00')).toBe(true);
        });
        it('false for deadline more than 24h away', () => {
            expect(isDeadlineUnder24h('2026-03-03T10:00:00')).toBe(false);
        });
    });
});