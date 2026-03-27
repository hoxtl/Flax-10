import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getOverlappingPairs,
    getNavigatorContext,
} from '../../pages/Homepage/utils/navigatorUtils';

const makeEvent = (id, start, end) => ({
    id,
    start_time: start,
    end_time: end,
    title: `Event ${id}`,
});

describe('getOverlappingPairs', () => {
    it('returns empty for empty array', () => {
        expect(getOverlappingPairs([])).toEqual([]);
    });

    it('returns empty for single event', () => {
        expect(getOverlappingPairs([makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T11:00:00')])).toEqual([]);
    });

    it('returns overlapping pair', () => {
        const events = [
            makeEvent(1, '2026-01-01T10:00:00', '2026-01-01T12:00:00'),
            makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T13:00:00'),
        ];
        const pairs = getOverlappingPairs(events);
        expect(pairs).toHaveLength(1);
        expect(pairs[0].a.id).toBe(1);
        expect(pairs[0].b.id).toBe(2);
    });

    it('returns no pair for non-overlapping events', () => {
        const events = [
            makeEvent(1, '2026-01-01T09:00:00', '2026-01-01T10:00:00'),
            makeEvent(2, '2026-01-01T11:00:00', '2026-01-01T12:00:00'),
        ];
        expect(getOverlappingPairs(events)).toEqual([]);
    });

    it('returns null for null input', () => {
        expect(getOverlappingPairs(null)).toEqual([]);
    });
});

describe('getNavigatorContext', () => {
    const selectedDate = new Date('2026-03-07');
    const isTodayFn = (d) => {
        const a = new Date(d);
        return a.toDateString() === selectedDate.toDateString();
    };

    it('returns none state when not today', () => {
        const tomorrow = new Date('2026-03-08');
        const ctx = getNavigatorContext(new Date(), tomorrow, [], (d) => false);
        expect(ctx.state).toBe('none');
    });

    it('returns none state when events empty', () => {
        const ctx = getNavigatorContext(selectedDate, selectedDate, [], isTodayFn);
        expect(ctx.state).toBe('none');
    });

    it('returns endOfDay when no future events and no current block', () => {
        // Past events
        const pastEvent = makeEvent(1, '2026-03-07T07:00:00', '2026-03-07T08:00:00');
        const now = new Date('2026-03-07T09:00:00');
        const ctx = getNavigatorContext(now, selectedDate, [pastEvent], isTodayFn);
        expect(ctx.state).toBe('endOfDay');
    });

    it('returns gap state with gapMins when next event is upcoming', () => {
        const now = new Date('2026-03-07T09:00:00');
        const futureEvent = makeEvent(1, '2026-03-07T10:00:00', '2026-03-07T11:00:00');
        const ctx = getNavigatorContext(now, selectedDate, [futureEvent], isTodayFn);
        expect(ctx.state).toBe('gap');
        expect(ctx.gapMins).toBe(60);
        expect(ctx.nextItem).toBeTruthy();
    });
});
