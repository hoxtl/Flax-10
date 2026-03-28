import { describe, it, expect } from 'vitest';

import { validateDateRange, validateEventTimes } from '../../../components/calendar/utils/dateValidation';
import { buildWeekLabels, getWeekIndexForDate } from '../../../components/calendar/utils/weekUtils';
import { getEventTheme } from '../../../components/calendar/utils/eventStyleUtils';
import { expandRecurringEvents } from '../../../components/calendar/utils/recurrenceUtils';

describe('dateValidation', () => {
    describe('validateDateRange', () => {
        it('returns null when no startTime', () => {
            expect(validateDateRange(null, '2026-01-01T10:00')).toBeNull();
        });

        it('returns null when no endTime', () => {
            expect(validateDateRange('2026-01-01T10:00', null)).toBeNull();
        });

        it('returns error when start >= end', () => {
            expect(validateDateRange('2026-01-01T11:00', '2026-01-01T10:00')).toBe('Start must be before end');
        });

        it('returns null when start < end', () => {
            expect(validateDateRange('2026-01-01T09:00', '2026-01-01T10:00')).toBeNull();
        });
    });

    describe('validateEventTimes', () => {
        it('returns error when no start_time', () => {
            expect(validateEventTimes({ start_time: '', end_time: '2026-01-01T10:00' })).toBe('Start time is required');
        });

        it('returns error when no end_time', () => {
            expect(validateEventTimes({ start_time: '2026-01-01T09:00', end_time: '' })).toBe('End time is required');
        });

        it('returns null for valid times', () => {
            expect(validateEventTimes({ start_time: '2026-01-01T09:00', end_time: '2026-01-01T10:00' })).toBeNull();
        });
    });
});

describe('weekUtils', () => {
    describe('buildWeekLabels', () => {
        it('builds labels without reading week', () => {
            const labels = buildWeekLabels(5, false, 0);
            expect(labels).toEqual(['1', '2', '3', '4', '5']);
        });

        it('inserts RW at correct index', () => {
            const labels = buildWeekLabels(5, true, 3);
            expect(labels).toEqual(['1', '2', '3', 'RW', '4', '5']);
        });

        it('inserts RW at start', () => {
            const labels = buildWeekLabels(3, true, 0);
            expect(labels).toEqual(['RW', '1', '2', '3']);
        });
    });

    describe('getWeekIndexForDate', () => {
        it('returns -1 for date before start', () => {
            const cfg = { startDate: '2026-01-10', totalWeeks: 10, hasReadingWeek: false };
            const idx = getWeekIndexForDate(new Date('2026-01-05'), cfg);
            expect(idx).toBe(-1);
        });

        it('returns 0 for first week', () => {
            const cfg = { startDate: '2026-01-01', totalWeeks: 10, hasReadingWeek: false };
            const idx = getWeekIndexForDate(new Date('2026-01-03'), cfg);
            expect(idx).toBe(0);
        });

        it('returns correct index for second week', () => {
            const cfg = { startDate: '2026-01-01', totalWeeks: 10, hasReadingWeek: false };
            const idx = getWeekIndexForDate(new Date('2026-01-10'), cfg);
            expect(idx).toBe(1);
        });

        it('caps at maxIdx', () => {
            const cfg = { startDate: '2026-01-01', totalWeeks: 3, hasReadingWeek: false };
            const idx = getWeekIndexForDate(new Date('2026-12-01'), cfg);
            expect(idx).toBe(2); // maxIdx = 3 + 0 - 1 = 2
        });

        it('includes reading week in maxIdx when hasReadingWeek is true', () => {
            const cfg = { startDate: '2026-01-01', totalWeeks: 10, hasReadingWeek: true };
            const idx = getWeekIndexForDate(new Date('2026-03-15'), cfg);
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThanOrEqual(10); // maxIdx = 10 + 1 - 1 = 10
        });
    });
});

describe('eventStyleUtils: getEventTheme', () => {
    it('returns tag color and icon when tag is found by getTagByName', () => {
        const event = { tag_name: 'study' };
        const tags = { getTagByName: () => ({ color: '#ff0000', icon: '📖' }) };
        const theme = getEventTheme(event, tags);
        expect(theme).toEqual({ color: '#ff0000', icon: '📖' });
    });

    it('returns tag color from tags array when found', () => {
        const event = { tag_name: 'work' };
        const tags = { tags: [{ label: 'Work', color: '#0000ff', icon: '💼' }] };
        const theme = getEventTheme(event, tags);
        expect(theme).toEqual({ color: '#0000ff', icon: '💼' });
    });

    it('returns default theme when tag not found', () => {
        const event = { tag_name: 'unknown' };
        const tags = { tags: [] };
        const theme = getEventTheme(event, tags);
        expect(theme.color).toBe('var(--color-caramel)');
        expect(theme.icon).toBe('🏷️');
    });

    it('uses society_color when no tag found', () => {
        const event = { tag_name: 'other', society_color: '#123456' };
        const theme = getEventTheme(event, { tags: [] });
        expect(theme.color).toBe('#123456');
    });

    it('falls back to default when no tags context', () => {
        const event = { tag_name: 'study' };
        const theme = getEventTheme(event, null);
        expect(theme.color).toBe('var(--color-caramel)');
    });
});

describe('recurrenceUtils: expandRecurringEvents', () => {
    it('returns non-recurring events unchanged', () => {
        const event = {
            id: 1,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'none',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('expands weekly recurring event into multiple occurrences', () => {
        const event = {
            id: 2,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'weekly',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        // Should have multiple occurrences for the month
        expect(result.length).toBeGreaterThan(1);
        // Each should have a unique id
        const ids = result.map(e => e.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('respects recurrence_end_date', () => {
        const event = {
            id: 3,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'weekly',
            recurrence_end_date: '2026-03-08',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        // Only 2 occurrences: Mar 1 and Mar 8
        expect(result.length).toBe(2);
    });

    it('excludes exception dates', () => {
        const event = {
            id: 4,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'weekly',
            recurrence_end_date: '2026-03-22',
            exception_dates: ['2026-03-08'],
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        const dates = result.map(e => e.start_time.slice(0, 10));
        expect(dates).not.toContain('2026-03-08');
    });

    it('handles daily recurrence', () => {
        const event = {
            id: 5,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'daily',
            recurrence_end_date: '2026-03-05',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        expect(result.length).toBe(5);
    });

    it('handles monthly recurrence', () => {
        const event = {
            id: 6,
            start_time: '2026-01-15T10:00:00',
            end_time: '2026-01-15T11:00:00',
            recurrence: 'monthly',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        // March occurrence should be there
        const march = result.find(e => e.start_time.startsWith('2026-03'));
        expect(march).toBeTruthy();
    });

    it('handles yearly recurrence and recurrence-rule exception dates', () => {
        const event = {
            id: 7,
            start_time: '2025-03-15T10:00:00',
            end_time: '2025-03-15T11:00:00',
            recurrence: 'yearly',
            recurrence_rule: { exception_dates: ['2026-03-15'] },
        };
        const skippedYear = expandRecurringEvents([event], new Date('2026-03-01'));
        const includedYear = expandRecurringEvents([event], new Date('2027-03-01'));
        expect(skippedYear.find((item) => item.start_time.startsWith('2026-03-15'))).toBeFalsy();
        expect(includedYear.find((item) => item.start_time.startsWith('2027-03-15'))).toBeTruthy();
    });

    it('falls back to a single base-date occurrence for unknown recurrence values', () => {
        const event = {
            id: 8,
            start_time: '2026-03-20T10:00:00',
            end_time: '2026-03-20T11:00:00',
            recurrence: 'mystery',
        };
        const result = expandRecurringEvents([event], new Date('2026-03-01'));
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('8_0');
    });

    it('returns no fallback occurrence when an unknown recurrence falls outside the visible range', () => {
        const event = {
            id: 9,
            start_time: '2026-05-20T10:00:00',
            end_time: '2026-05-20T11:00:00',
            recurrence: 'mystery',
        };

        expect(expandRecurringEvents([event], new Date('2026-03-01'))).toEqual([]);
    });

    it('handles biweekly recurrence intervals', () => {
        const event = {
            id: 10,
            start_time: '2026-03-01T10:00:00',
            end_time: '2026-03-01T11:00:00',
            recurrence: 'biweekly',
            recurrence_end_date: '2026-03-29',
        };

        const dates = expandRecurringEvents([event], new Date('2026-03-01')).map((item) => item.start_time.slice(0, 10));
        expect(dates).toEqual(['2026-03-01', '2026-03-15', '2026-03-29']);
    });
});
