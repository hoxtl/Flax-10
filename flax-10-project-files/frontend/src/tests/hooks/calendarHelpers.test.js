
import { describe, it, expect } from 'vitest';
import { getDateRangeForView } from '../../components/calendar/hooks/calendarHelpers';

describe('calendarHelpers', () => {
    const date = new Date('2026-01-15T12:00:00.000Z');

    it('should return day range for day view', () => {
        const { start, end } = getDateRangeForView(date, 'day');

        const s = new Date(start);
        const e = new Date(end);

        expect(s.getDate()).toBe(15);
        expect(s.getHours()).toBe(0);
        expect(e.getDate()).toBe(15);
        expect(e.getHours()).toBe(23);
        expect(e.getMinutes()).toBe(59);
    });

    it('should return week range for week view', () => {
        const { start, end } = getDateRangeForView(date, 'week');
        const s = new Date(start);
        const e = new Date(end);
        expect(s.getDate()).toBe(11);
        expect(s.getHours()).toBe(0);

        expect(e.getDate()).toBe(17); // Sat Jan 17
        expect(e.getHours()).toBe(23);
    });

    it('should return month range for month view', () => {
        const { start, end } = getDateRangeForView(date, 'month');
        // Jan 1 to Jan 31
        const s = new Date(start);
        const e = new Date(end);

        expect(s.getDate()).toBe(1);
        expect(s.getMonth()).toBe(0);

        expect(e.getDate()).toBe(31);
        expect(e.getMonth()).toBe(0);
        expect(e.getHours()).toBe(23);
    });

    it('should default to month range for unknown view', () => {
        const { start, end } = getDateRangeForView(date, 'year');
        const s = new Date(start);
        const e = new Date(end);
        expect(s.getDate()).toBe(1);
        expect(e.getDate()).toBe(31);
    });

    it('keeps the original date object unchanged while deriving ranges', () => {
        const original = new Date('2026-02-18T15:45:00.000Z');
        const snapshot = original.toISOString();

        getDateRangeForView(original, 'day');
        getDateRangeForView(original, 'week');
        getDateRangeForView(original, 'month');

        expect(original.toISOString()).toBe(snapshot);
    });
});
