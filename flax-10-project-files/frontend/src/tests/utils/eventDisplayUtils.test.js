import { describe, it, expect } from 'vitest';
import {
    isAllDayEvent,
    shouldShowInTimeGrid,
    isFullDay,
    getAllDayVisualRange,
} from '../../components/calendar/utils/eventDisplayUtils';

const makeEvent = (startTime, endTime, extraProps = {}) => ({
    id: 1,
    start_time: startTime,
    end_time: endTime,
    ...extraProps,
});

describe('isAllDayEvent', () => {
    it('returns true when all_day is set', () => {
        expect(isAllDayEvent(makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00', { all_day: true }))).toBe(true);
    });

    it('returns true when is_all_day is set', () => {
        expect(isAllDayEvent(makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00', { is_all_day: true }))).toBe(true);
    });

    it('returns true when allDay is set', () => {
        expect(isAllDayEvent(makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00', { allDay: true }))).toBe(true);
    });

    it('returns true for midnight-to-midnight event', () => {
        expect(isAllDayEvent(makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00'))).toBe(true);
    });

    it('returns false for timed event', () => {
        expect(isAllDayEvent(makeEvent('2026-01-01T09:00:00', '2026-01-01T10:00:00'))).toBe(false);
    });
});

describe('shouldShowInTimeGrid', () => {
    it('returns false for all-day event', () => {
        const event = makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00', { all_day: true });
        expect(shouldShowInTimeGrid(event, new Date('2026-01-01'))).toBe(false);
    });

    it('returns true for timed event on the same day', () => {
        const event = makeEvent('2026-01-01T09:00:00', '2026-01-01T10:00:00');
        expect(shouldShowInTimeGrid(event, new Date('2026-01-01'))).toBe(true);
    });

    it('returns false for timed event on different day', () => {
        const event = makeEvent('2026-01-01T09:00:00', '2026-01-01T10:00:00');
        expect(shouldShowInTimeGrid(event, new Date('2026-01-02'))).toBe(false);
    });
});

describe('isFullDay', () => {
    it('returns true when event covers entire day', () => {
        const event = makeEvent('2026-01-01T00:00:00', '2026-01-02T00:00:00');
        expect(isFullDay(event, new Date('2026-01-01'))).toBe(true);
    });

    it('returns false for partial day event', () => {
        const event = makeEvent('2026-01-01T09:00:00', '2026-01-01T10:00:00');
        expect(isFullDay(event, new Date('2026-01-01'))).toBe(false);
    });
});

describe('getAllDayVisualRange', () => {
    it('returns visual range for all-day event', () => {
        const event = makeEvent('2026-01-01T00:00:00', '2026-01-03T00:00:00', { all_day: true });
        const range = getAllDayVisualRange(event);
        // end midnight adjusted back by 1 day
        expect(range.start.toISOString().slice(0, 10)).toBe('2026-01-01');
        expect(range.end.toISOString().slice(0, 10)).toBe('2026-01-02');
    });

    it('keeps the visual end date when an all-day event ends after midnight', () => {
        const event = makeEvent('2026-01-01T00:00:00', '2026-01-03T12:00:00', { all_day: true });
        const range = getAllDayVisualRange(event);
        expect(range.end.toISOString().slice(0, 10)).toBe('2026-01-03');
    });

    it('returns null when visual start > visual end for timed multi-day events', () => {
        // Timed event that starts and ends on same day (non-all-day)
        // start 09:00, vStart = Jan 2 midnight; end 10:00, vEnd = Jan 1 midnight (-1 day) = Jan 0 — null
        const event = makeEvent('2026-01-01T09:00:00', '2026-01-01T10:00:00');
        const range = getAllDayVisualRange(event);
        expect(range).toBeNull();
    });

    it('returns range for timed multi-day event', () => {
        // Goes from Jan 1 09:00 to Jan 3 09:00
        // vStart = Jan 2 midnight (since 09:00 != midnight, add 1)
        // vEnd = Jan 3 midnight - 1 day = Jan 2 midnight
        const event = makeEvent('2026-01-01T09:00:00', '2026-01-03T09:00:00');
        const range = getAllDayVisualRange(event);
        expect(range).not.toBeNull();
        expect(range.start.toISOString().slice(0, 10)).toBe('2026-01-02');
        expect(range.end.toISOString().slice(0, 10)).toBe('2026-01-02');
    });
});
