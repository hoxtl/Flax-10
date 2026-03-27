/**
 * Tests for overlapUtils - event overlap detection and column layout.
 */

import { describe, it, expect, vi } from 'vitest';
import { eventsOverlap, findOverlappingEvents, checkOverlapWithConfirm, calculateEventColumns, getEventKey } from '../../../../components/calendar/utils/overlapUtils';

const makeEvent = (id, start, end) => ({ id, start_time: start, end_time: end, title: `Event ${id}` });

describe('eventsOverlap', () => {
    it('returns false for same event id', () => {
        const e = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        expect(eventsOverlap(e, e)).toBe(false);
    });

    it('returns true when events overlap', () => {
        const e1 = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:30:00Z');
        const e2 = makeEvent(2, '2026-03-15T11:00:00Z', '2026-03-15T12:00:00Z');
        expect(eventsOverlap(e1, e2)).toBe(true);
    });

    it('returns false when events are adjacent (no overlap)', () => {
        const e1 = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        const e2 = makeEvent(2, '2026-03-15T11:00:00Z', '2026-03-15T12:00:00Z');
        expect(eventsOverlap(e1, e2)).toBe(false);
    });

    it('returns false when events do not overlap at all', () => {
        const e1 = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        const e2 = makeEvent(2, '2026-03-15T12:00:00Z', '2026-03-15T13:00:00Z');
        expect(eventsOverlap(e1, e2)).toBe(false);
    });

    it('returns true when one event contains the other', () => {
        const e1 = makeEvent(1, '2026-03-15T09:00:00Z', '2026-03-15T13:00:00Z');
        const e2 = makeEvent(2, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        expect(eventsOverlap(e1, e2)).toBe(true);
    });
});

describe('findOverlappingEvents', () => {
    it('returns empty array when no events overlap', () => {
        const target = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        const others = [makeEvent(2, '2026-03-15T12:00:00Z', '2026-03-15T13:00:00Z')];
        expect(findOverlappingEvents(target, others)).toHaveLength(0);
    });

    it('returns overlapping events', () => {
        const target = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T12:00:00Z');
        const others = [
            makeEvent(2, '2026-03-15T11:00:00Z', '2026-03-15T13:00:00Z'),
            makeEvent(3, '2026-03-15T14:00:00Z', '2026-03-15T15:00:00Z'),
        ];
        const result = findOverlappingEvents(target, others);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
    });
});

describe('checkOverlapWithConfirm', () => {
    it('returns true when no overlapping events', async () => {
        const event = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z');
        const confirmFn = vi.fn();
        const result = await checkOverlapWithConfirm(event, [], confirmFn);
        expect(result).toBe(true);
        expect(confirmFn).not.toHaveBeenCalled();
    });

    it('calls confirmFn and returns its result when overlapping', async () => {
        const event = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T12:00:00Z');
        const overlapping = [makeEvent(2, '2026-03-15T11:00:00Z', '2026-03-15T13:00:00Z')];
        const confirmFn = vi.fn().mockResolvedValue(true);
        const result = await checkOverlapWithConfirm(event, overlapping, confirmFn);
        expect(confirmFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Scheduling Conflict' }));
        expect(result).toBe(true);
    });

    it('returns false when user declines overlap', async () => {
        const event = makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T12:00:00Z');
        const overlapping = [makeEvent(2, '2026-03-15T11:00:00Z', '2026-03-15T13:00:00Z')];
        const confirmFn = vi.fn().mockResolvedValue(false);
        const result = await checkOverlapWithConfirm(event, overlapping, confirmFn);
        expect(result).toBe(false);
    });
});

describe('calculateEventColumns', () => {
    it('returns empty map for empty array', () => {
        expect(calculateEventColumns([])).toEqual(new Map());
    });

    it('assigns single event to column 0 with totalColumns 1', () => {
        const events = [makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z')];
        const result = calculateEventColumns(events);
        expect(result.get(getEventKey(events[0]))).toEqual({ column: 0, totalColumns: 1 });
    });

    it('assigns overlapping events to separate columns', () => {
        const events = [
            makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T12:00:00Z'),
            makeEvent(2, '2026-03-15T10:30:00Z', '2026-03-15T11:30:00Z'),
        ];
        const result = calculateEventColumns(events);
        expect(result.get(getEventKey(events[0])).column).toBe(0);
        expect(result.get(getEventKey(events[1])).column).toBe(1);
        expect(result.get(getEventKey(events[0])).totalColumns).toBe(2);
        expect(result.get(getEventKey(events[1])).totalColumns).toBe(2);
    });

    it('assigns non-overlapping events to separate groups', () => {
        const events = [
            makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T11:00:00Z'),
            makeEvent(2, '2026-03-15T12:00:00Z', '2026-03-15T13:00:00Z'),
        ];
        const result = calculateEventColumns(events);
        expect(result.get(getEventKey(events[0]))).toEqual({ column: 0, totalColumns: 1 });
        expect(result.get(getEventKey(events[1]))).toEqual({ column: 0, totalColumns: 1 });
    });

    it('handles three overlapping events', () => {
        const events = [
            makeEvent(1, '2026-03-15T10:00:00Z', '2026-03-15T13:00:00Z'),
            makeEvent(2, '2026-03-15T10:00:00Z', '2026-03-15T13:00:00Z'),
            makeEvent(3, '2026-03-15T10:00:00Z', '2026-03-15T13:00:00Z'),
        ];
        const result = calculateEventColumns(events);
        const cols = [result.get(getEventKey(events[0])).column, result.get(getEventKey(events[1])).column, result.get(getEventKey(events[2])).column];
        cols.sort();
        expect(cols).toEqual([0, 1, 2]);
        expect(result.get(getEventKey(events[0])).totalColumns).toBe(3);
    });

    it('reuses columns when earlier event in same group ends before next starts', () => {
        const events = [
            makeEvent(1, '2026-03-15T08:00:00Z', '2026-03-15T09:00:00Z'),
            makeEvent(2, '2026-03-15T08:00:00Z', '2026-03-15T12:00:00Z'),
            makeEvent(3, '2026-03-15T09:00:00Z', '2026-03-15T10:00:00Z'),
        ];
        const result = calculateEventColumns(events);
        // event 3 starts when event 1 ends, so it can reuse column 0
        expect(result.get(getEventKey(events[2])).column).toBe(0);
    });
});
