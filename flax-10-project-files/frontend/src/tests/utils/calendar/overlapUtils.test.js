import { describe, it, expect, vi } from 'vitest';
import {
    eventsOverlap,
    findOverlappingEvents,
    checkOverlapWithConfirm,
    calculateEventColumns,
    getEventKey,
} from '../../../components/calendar/utils/overlapUtils';

const makeEvent = (id, start, end) => ({ id, start_time: start, end_time: end, title: `Event ${id}` });

describe('eventsOverlap', () => {
    it('returns false when same id', () => {
        const e = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00');
        expect(eventsOverlap(e, e)).toBe(false);
    });

    it('returns true when events overlap', () => {
        const e1 = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00');
        const e2 = makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T13:00:00');
        expect(eventsOverlap(e1, e2)).toBe(true);
    });

    it('returns false when events do not overlap', () => {
        const e1 = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00');
        const e2 = makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T12:00:00');
        expect(eventsOverlap(e1, e2)).toBe(false);
    });

    it('returns false for non-overlapping earlier event', () => {
        const e1 = makeEvent(1, '2026-01-01T08:00:00', '2026-01-01T09:00:00');
        const e2 = makeEvent(2, '2026-01-01T10:00:00', '2026-01-01T11:00:00');
        expect(eventsOverlap(e1, e2)).toBe(false);
    });
});

describe('findOverlappingEvents', () => {
    it('returns empty when no overlaps', () => {
        const event = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00');
        const others = [makeEvent(2, '2026-01-01T12:00:00', '2026-01-01T13:00:00')];
        expect(findOverlappingEvents(event, others)).toHaveLength(0);
    });

    it('returns overlapping events', () => {
        const event = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00');
        const others = [
            makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T13:00:00'),
            makeEvent(3, '2026-01-01T14:00:00', '2026-01-01T15:00:00'),
        ];
        const overlapping = findOverlappingEvents(event, others);
        expect(overlapping).toHaveLength(1);
        expect(overlapping[0].id).toBe(2);
    });
});

describe('checkOverlapWithConfirm', () => {
    it('returns true when no overlaps', async () => {
        const event = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00');
        const others = [makeEvent(2, '2026-01-01T12:00:00', '2026-01-01T13:00:00')];
        const result = await checkOverlapWithConfirm(event, others, vi.fn());
        expect(result).toBe(true);
    });

    it('calls confirmFn when overlaps and returns its result', async () => {
        const event = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00');
        const others = [makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T13:00:00')];
        const confirmFn = vi.fn().mockResolvedValue(true);
        const result = await checkOverlapWithConfirm(event, others, confirmFn);
        expect(confirmFn).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('returns false when user cancels overlap confirm', async () => {
        const event = makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00');
        const others = [makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T13:00:00')];
        const confirmFn = vi.fn().mockResolvedValue(false);
        const result = await checkOverlapWithConfirm(event, others, confirmFn);
        expect(result).toBe(false);
    });
});

describe('calculateEventColumns', () => {
    it('returns empty map for no events', () => {
        expect(calculateEventColumns([])).toEqual(new Map());
    });

    it('assigns column 0 to single event', () => {
        const events = [makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00')];
        const cols = calculateEventColumns(events);
        expect(cols.get(getEventKey(events[0]))).toEqual({ column: 0, totalColumns: 1 });
    });

    it('assigns different columns to overlapping events', () => {
        const events = [
            makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00'),
            makeEvent(2, '2026-01-01T10:30:00', '2026-01-01T11:30:00'),
        ];
        const cols = calculateEventColumns(events);
        expect(cols.get(getEventKey(events[0])).column).toBe(0);
        expect(cols.get(getEventKey(events[1])).column).toBe(1);
        expect(cols.get(getEventKey(events[0])).totalColumns).toBe(2);
    });

    it('reuses columns for non-overlapping events', () => {
        const events = [
            makeEvent(1, '2026-01-01T09:00:00', '2026-01-01T10:00:00'),
            makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T12:00:00'),
        ];
        const cols = calculateEventColumns(events);
        // Non-overlapping, each gets column 0 but in separate groups
        expect(cols.get(getEventKey(events[0])).column).toBe(0);
        expect(cols.get(getEventKey(events[1])).column).toBe(0);
    });
});
