import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDeadlineCountdown, getDeadlineUrgency, formatDeadlineDateTime, DEADLINE_LABELS, DEADLINE_TYPES, TYPES_WITH_LOCATION } from '../../utils/deadlineUtils';

describe('deadlineUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-01T10:00:00'));
    });

    afterEach(() => vi.useRealTimers());

    it('should return past due for past date', () => {
        expect(getDeadlineCountdown('2026-02-01T10:00:00')).toBe('Past due');
    });

    it('should return number of days remaining', () => {
        expect(getDeadlineCountdown('2026-03-06T10:00:00')).toBe('5 days remaining');
    });

    it('should return hours remaining in same day', () => {
        expect(getDeadlineCountdown('2026-03-01T14:00:00')).toBe('4h remaining');
    });

    it('should return due today when due in under an hour', () => {
        expect(getDeadlineCountdown('2026-03-01T10:30:00')).toBe('Due today');
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
});