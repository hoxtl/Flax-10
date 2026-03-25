/**
 * Tests for eventDisplayUtils - event display logic for all-day and timed events.
 */

import { describe, it, expect } from 'vitest';
import { isAllDayEvent, shouldShowInTimeGrid, isFullDay, getAllDayVisualRange } from '../../../../components/Calendar/utils/eventDisplayUtils';

const makeEvent = (overrides) => ({
    start_time: '2026-03-15T10:00:00Z',
    end_time: '2026-03-15T11:00:00Z',
    all_day: false,
    is_all_day: false,
    allDay: false,
    ...overrides,
});

describe('isAllDayEvent', () => {
    it('returns true when all_day is set', () => {
        expect(isAllDayEvent(makeEvent({ all_day: true }))).toBe(true);
    });

    it('returns true when is_all_day is set', () => {
        expect(isAllDayEvent(makeEvent({ is_all_day: true }))).toBe(true);
    });

    it('returns true when allDay is set', () => {
        expect(isAllDayEvent(makeEvent({ allDay: true }))).toBe(true);
    });

    it('returns true when event starts and ends at midnight', () => {
        const event = makeEvent({
            start_time: '2026-03-15T00:00:00Z',
            end_time: '2026-03-16T00:00:00Z',
        });
        expect(isAllDayEvent(event)).toBe(true);
    });

    it('returns false for a timed event', () => {
        expect(isAllDayEvent(makeEvent())).toBe(false);
    });
});

describe('shouldShowInTimeGrid', () => {
    it('returns false for all-day event', () => {
        const event = makeEvent({ all_day: true });
        expect(shouldShowInTimeGrid(event, new Date('2026-03-15'))).toBe(false);
    });

    it('returns true when timed event falls on the day', () => {
        const event = makeEvent({
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        });
        const day = new Date('2026-03-15');
        expect(shouldShowInTimeGrid(event, day)).toBe(true);
    });

    it('returns false for event on a different day', () => {
        const event = makeEvent({
            start_time: '2026-03-16T10:00:00',
            end_time: '2026-03-16T11:00:00',
        });
        const day = new Date('2026-03-15');
        expect(shouldShowInTimeGrid(event, day)).toBe(false);
    });

    it('returns false for event that spans the full day', () => {
        // Event spans from day before to day after - full day coverage
        const event = makeEvent({
            start_time: '2026-03-14T00:00:00',
            end_time: '2026-03-16T00:00:00',
        });
        const day = new Date('2026-03-15');
        expect(shouldShowInTimeGrid(event, day)).toBe(false);
    });
});

describe('isFullDay', () => {
    it('returns true when event spans the entire day', () => {
        const event = makeEvent({
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-16T00:00:00',
        });
        const day = new Date('2026-03-15');
        expect(isFullDay(event, day)).toBe(true);
    });

    it('returns false for partial day event', () => {
        const event = makeEvent({
            start_time: '2026-03-15T08:00:00',
            end_time: '2026-03-15T17:00:00',
        });
        const day = new Date('2026-03-15');
        expect(isFullDay(event, day)).toBe(false);
    });

    it('returns true for multi-day event fully covering a day', () => {
        const event = makeEvent({
            start_time: '2026-03-14T00:00:00',
            end_time: '2026-03-17T00:00:00',
        });
        const day = new Date('2026-03-15');
        expect(isFullDay(event, day)).toBe(true);
    });
});

describe('getAllDayVisualRange', () => {
    it('returns range for explicit all-day event', () => {
        const event = makeEvent({
            all_day: true,
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-16T00:00:00',
        });
        const range = getAllDayVisualRange(event);
        expect(range).not.toBeNull();
        expect(range.start).toBeDefined();
        expect(range.end).toBeDefined();
    });

    it('subtracts one day from end when end is midnight and after start for all-day events', () => {
        const event = makeEvent({
            all_day: true,
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-16T00:00:00',
        });
        const range = getAllDayVisualRange(event);
        // End should be adjusted to the 15th
        expect(range.end.getDate()).toBe(15);
    });

    it('handles multi-day all-day event', () => {
        const event = makeEvent({
            all_day: true,
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-18T00:00:00',
        });
        const range = getAllDayVisualRange(event);
        expect(range.start.getDate()).toBe(15);
        expect(range.end.getDate()).toBe(17);
    });

    it('returns null for timed event where no full-day span', () => {
        // Timed event that starts at 10am and ends at 11am same day - getTimedAllDayRange will return null
        const event = makeEvent({
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        });
        const range = getAllDayVisualRange(event);
        expect(range).toBeNull();
    });

    it('returns a range for timed multi-day event', () => {
        // Event starts at midnight and ends at midnight two days later - covers the middle day
        const event = makeEvent({
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-17T00:00:00',
        });
        const range = getAllDayVisualRange(event);
        // isAllDayEvent will be true (midnight aligned), so uses explicit all-day range
        expect(range).not.toBeNull();
    });

    it('handles timed event starting before midnight - no range if vStart > vEnd', () => {
        // Event from 10pm to 11pm - timed range: vStart rounds up to next day, vEnd rounds down to today
        // vStart (next day) > vEnd (today) so should return null
        const event = makeEvent({
            start_time: '2026-03-15T22:00:00',
            end_time: '2026-03-15T23:00:00',
        });
        const range = getAllDayVisualRange(event);
        expect(range).toBeNull();
    });

    it('handles midnight-aligned single day event with same start and end midnight', () => {
        // Event at same midnight - technically zero-length but end is not > start
        const event = makeEvent({
            all_day: true,
            start_time: '2026-03-15T00:00:00',
            end_time: '2026-03-15T00:00:00',
        });
        const range = getAllDayVisualRange(event);
        // end.getTime() === vEnd.getTime() but end is NOT > start, so no adjustment
        expect(range).toBeDefined();
    });
});
