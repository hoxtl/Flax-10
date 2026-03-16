import { describe, it, expect, vi } from 'vitest';
import { calculateEventLayout } from '../../components/Calendar/WeekView/components/allDayRowHelpers';

vi.mock('../../components/Calendar/utils/dateUtils', () => ({
    isSameDay: vi.fn((a, b) => {
        return new Date(a).toDateString() === new Date(b).toDateString();
    }),
}));

vi.mock('../../components/Calendar/utils/eventDisplayUtils', () => ({
    getAllDayVisualRange: vi.fn((event) => {
        if (!event.all_day) return null;
        return { start: new Date(event.start_time), end: new Date(event.end_time || event.start_time) };
    }),
}));

function makeDay(dateStr) {
    return new Date(dateStr);
}

const days = [
    makeDay('2026-01-05'), // Mon
    makeDay('2026-01-06'), // Tue
    makeDay('2026-01-07'), // Wed
    makeDay('2026-01-08'), // Thu
    makeDay('2026-01-09'), // Fri
    makeDay('2026-01-10'), // Sat
    makeDay('2026-01-11'), // Sun
];

describe('calculateEventLayout', () => {
    it('returns empty array for no events', () => {
        const result = calculateEventLayout([], days);
        expect(result).toEqual([]);
    });

    it('ignores non-all-day events (getAllDayVisualRange returns null)', () => {
        const events = [
            { id: 1, title: 'Timed', start_time: '2026-01-05T09:00:00', end_time: '2026-01-05T10:00:00', all_day: false },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(0);
    });

    it('returns layout for single all-day event', () => {
        const events = [
            { id: 1, title: 'All Day', start_time: '2026-01-05T00:00:00', end_time: '2026-01-05T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].event.id).toBe(1);
        expect(result[0].startCol).toBe(1); // index 0 + 1
        expect(result[0].endCol).toBe(2);   // index 0 + 2
        expect(result[0].row).toBe(1);
    });

    it('assigns different rows to overlapping events', () => {
        const events = [
            { id: 1, title: 'Event A', start_time: '2026-01-05T00:00:00', end_time: '2026-01-07T00:00:00', all_day: true },
            { id: 2, title: 'Event B', start_time: '2026-01-06T00:00:00', end_time: '2026-01-08T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(2);
        const rows = result.map(r => r.row);
        expect(rows).toContain(1);
        expect(rows).toContain(2);
    });

    it('assigns same row to non-overlapping events', () => {
        const events = [
            { id: 1, title: 'Mon', start_time: '2026-01-05T00:00:00', end_time: '2026-01-05T00:00:00', all_day: true },
            { id: 2, title: 'Wed', start_time: '2026-01-07T00:00:00', end_time: '2026-01-07T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(2);
        expect(result[0].row).toBe(1);
        expect(result[1].row).toBe(1);
    });

    it('event starting before week gets startCol 1 (getStartIndex returns 0)', () => {
        const events = [
            { id: 1, title: 'Before', start_time: '2026-01-04T00:00:00', end_time: '2026-01-06T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].startCol).toBe(1);
        expect(result[0].endCol).toBe(3);
    });

    it('event ending after week gets endCol at last day (getEndIndex returns days.length - 1)', () => {
        const events = [
            { id: 1, title: 'After', start_time: '2026-01-10T00:00:00', end_time: '2026-01-12T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(1);
        expect(result[0].startCol).toBe(6);
        expect(result[0].endCol).toBe(8);
    });

    it('event ending before week range is excluded (getEndIndex returns null)', () => {
        const events = [
            { id: 1, title: 'Before week', start_time: '2026-01-04T00:00:00', end_time: '2026-01-04T23:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(0);
    });

    it('sorts by startCol then by width descending (wider events first when same start)', () => {
        const events = [
            { id: 1, title: 'Mon only', start_time: '2026-01-05T00:00:00', end_time: '2026-01-05T00:00:00', all_day: true },
            { id: 2, title: 'Mon to Wed', start_time: '2026-01-05T00:00:00', end_time: '2026-01-07T00:00:00', all_day: true },
        ];
        const result = calculateEventLayout(events, days);
        expect(result).toHaveLength(2);
        expect(result[0].startCol).toBe(1);
        expect(result[1].startCol).toBe(1);
        const wider = result[0].endCol - result[0].startCol > result[1].endCol - result[1].startCol ? result[0] : result[1];
        const narrower = result[0].endCol - result[0].startCol <= result[1].endCol - result[1].startCol ? result[0] : result[1];
        expect(wider.event.title).toBe('Mon to Wed');
        expect(narrower.event.title).toBe('Mon only');
    });
});
