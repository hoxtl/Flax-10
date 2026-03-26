/**
 * Tests for allDayRowHelpers - layout calculations for all-day events in week view.
 */

import { describe, it, expect, vi } from 'vitest';
import { calculateEventLayout } from '../../../components/Calendar/week_view/components/allDayRowHelpers';

// Mock dependencies
vi.mock('../../../components/Calendar/utils/dateUtils', () => ({
    isSameDay: vi.fn((d1, d2) => {
        return d1.toDateString() === d2.toDateString();
    }),
}));

vi.mock('../../../components/Calendar/utils/eventDisplayUtils', () => ({
    getAllDayVisualRange: vi.fn((event) => {
        if (event._noRange) return null;
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return { start, end };
    }),
}));

const { getAllDayVisualRange } = await import('../../../components/Calendar/utils/eventDisplayUtils');

function makeDays(startStr, count = 7) {
    const days = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(startStr);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

function makeEvent(id, startStr, endStr, overrides = {}) {
    return { id, start_time: startStr, end_time: endStr, title: `Event ${id}`, ...overrides };
}

describe('calculateEventLayout', () => {
    const days = makeDays('2026-03-16');

    it('returns empty array for empty events', () => {
        expect(calculateEventLayout([], days)).toEqual([]);
    });

    it('filters events with no visual range', () => {
        const events = [makeEvent(1, '2026-03-16', '2026-03-17', { _noRange: true })];
        expect(calculateEventLayout(events, days)).toHaveLength(0);
    });

    it('lays out a single event within the week', () => {
        const events = [makeEvent(1, '2026-03-16', '2026-03-17')];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].startCol).toBe(1);
        expect(result[0].row).toBeDefined();
    });

    it('assigns row 1 to first event', () => {
        const events = [makeEvent(1, '2026-03-16', '2026-03-17')];
        const result = calculateEventLayout(events, days);
        expect(result[0].row).toBe(1);
    });

    it('places non-overlapping events in the same row', () => {
        const events = [
            makeEvent(1, '2026-03-16', '2026-03-17'),
            makeEvent(2, '2026-03-19', '2026-03-20'),
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(2);
        expect(result[0].row).toBe(1);
        expect(result[1].row).toBe(1);
    });

    it('stacks overlapping events in different rows', () => {
        const events = [
            makeEvent(1, '2026-03-16', '2026-03-19'),
            makeEvent(2, '2026-03-16', '2026-03-19'),
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(2);
        const rows = result.map(r => r.row).sort();
        expect(rows).toEqual([1, 2]);
    });

    it('handles event that starts before the week (clips to column 0)', () => {
        getAllDayVisualRange.mockReturnValueOnce({
            start: new Date('2026-03-10'),
            end: new Date('2026-03-17'),
        });
        const events = [makeEvent(1, '2026-03-10', '2026-03-17')];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].startCol).toBe(1); // clipped to index 0 + 1
    });

    it('handles event that ends after the week (clips to last column)', () => {
        getAllDayVisualRange.mockReturnValueOnce({
            start: new Date('2026-03-18'),
            end: new Date('2026-03-25'),
        });
        const events = [makeEvent(1, '2026-03-18', '2026-03-25')];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].endCol).toBe(days.length + 1); // last day index + 2
    });

    it('filters out events with null start or end index', () => {
        // Return a range that falls completely outside the week
        getAllDayVisualRange.mockReturnValueOnce({
            start: new Date('2026-03-01'),
            end: new Date('2026-03-05'),
        });
        const events = [makeEvent(1, '2026-03-01', '2026-03-05')];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(0);
    });

    it('sorts by startCol with wider events first', () => {
        // Both start on same day but one is wider
        getAllDayVisualRange
            .mockReturnValueOnce({ start: new Date('2026-03-16'), end: new Date('2026-03-17') })
            .mockReturnValueOnce({ start: new Date('2026-03-16'), end: new Date('2026-03-20') });
        const events = [
            makeEvent(1, '2026-03-16', '2026-03-17'),
            makeEvent(2, '2026-03-16', '2026-03-20'),
        ];
        const result = calculateEventLayout(events, days);
        // Wider event should come first (sorted by width desc after same startCol)
        expect(result[0].endCol - result[0].startCol).toBeGreaterThanOrEqual(
            result[result.length - 1].endCol - result[result.length - 1].startCol
        );
    });
});
