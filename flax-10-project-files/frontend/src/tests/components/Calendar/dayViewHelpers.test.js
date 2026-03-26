/**
 * Tests for dayViewHelpers - day view calculation utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    getHoursOfDay,
    formatHour,
    calculateEventStyle,
    calculateNewEndTime,
} from '../../../components/Calendar/day_view/dayViewHelpers';

vi.mock('../../../components/Calendar/utils/overlapUtils', () => ({
    getEventKey: vi.fn((event) => `${event.id}-${new Date(event.start_time).getTime()}-${new Date(event.end_time).getTime()}`),
    calculateEventColumns: vi.fn((events) => {
        const map = new Map();
        events.forEach((e, i) => map.set(`${e.id}-${new Date(e.start_time).getTime()}-${new Date(e.end_time).getTime()}`, { column: i, totalColumns: events.length }));
        return map;
    }),
}));

const { calculateEventColumns, getEventKey } = await import('../../../components/Calendar/utils/overlapUtils');

describe('getHoursOfDay', () => {
    it('returns array of 24 hours', () => {
        const hours = getHoursOfDay();
        expect(hours).toHaveLength(24);
        expect(hours[0]).toBe(0);
        expect(hours[23]).toBe(23);
    });
});

describe('formatHour', () => {
    it('formats midnight as 12 AM', () => {
        expect(formatHour(0)).toBe('12 AM');
    });

    it('formats noon as 12 PM', () => {
        expect(formatHour(12)).toBe('12 PM');
    });

    it('formats morning hours with AM', () => {
        expect(formatHour(9)).toBe('9 AM');
        expect(formatHour(1)).toBe('1 AM');
    });

    it('formats afternoon hours with PM', () => {
        expect(formatHour(13)).toBe('1 PM');
        expect(formatHour(23)).toBe('11 PM');
    });
});

describe('calculateEventStyle', () => {
    const slotHeight = 80;

    it('returns base style for single event with no layout', () => {
        const event = {
            id: 1,
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        };
        const style = calculateEventStyle(event, slotHeight, null);
        expect(style.position).toBe('absolute');
        expect(style.width).toBe('100%');
        expect(style.left).toBe('0');
        expect(style.top).toBeDefined();
        expect(style.height).toBeDefined();
    });

    it('returns base style when allEvents has only 1 event', () => {
        const event = {
            id: 1,
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        };
        const style = calculateEventStyle(event, slotHeight, [event]);
        expect(style.width).toBe('100%');
    });

    it('calculates correct top offset', () => {
        const event = {
            id: 1,
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        };
        const style = calculateEventStyle(event, slotHeight, null);
        // 10 hours * 80px/hour + 1px = 801px
        expect(style.top).toBe('801px');
    });

    it('calculates correct height for 1-hour event', () => {
        const event = {
            id: 1,
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T11:00:00',
        };
        const style = calculateEventStyle(event, slotHeight, null);
        // 60min/60 * 80 - 2 = 78px
        expect(style.height).toBe('78px');
    });

    it('enforces minimum duration of 15 minutes', () => {
        const event = {
            id: 1,
            start_time: '2026-03-15T10:00:00',
            end_time: '2026-03-15T10:05:00', // only 5 minutes
        };
        const style = calculateEventStyle(event, slotHeight, null);
        // min 15 min -> 15/60 * 80 - 2 = 18px
        expect(style.height).toBe('18px');
    });

    it('applies layout when multiple events provided', () => {
        const event1 = { id: 1, start_time: '2026-03-15T10:00:00', end_time: '2026-03-15T11:00:00' };
        const event2 = { id: 2, start_time: '2026-03-15T10:00:00', end_time: '2026-03-15T11:00:00' };
        const style = calculateEventStyle(event1, slotHeight, [event1, event2]);
        // totalColumns = 2, so width should be calc(50% - 6px)
        expect(style.width).toBe('calc(50% - 6px)');
        expect(style.left).toBe('0%');
    });

    it('clips event to day boundaries when currentDate is provided', () => {
        // Event starts on previous day
        const event = {
            id: 1,
            start_time: '2026-03-14T22:00:00',
            end_time: '2026-03-15T02:00:00',
        };
        const currentDate = new Date('2026-03-15');
        const style = calculateEventStyle(event, slotHeight, null, currentDate);
        // Top should be 0 since clipped to midnight
        expect(style.top).toBe('1px');
    });

    it('does not apply layout adjustment when totalColumns is 1', () => {
        const event = { id: 1, start_time: '2026-03-15T10:00:00', end_time: '2026-03-15T11:00:00' };
        const otherEvent = { id: 2, start_time: '2026-03-15T12:00:00', end_time: '2026-03-15T13:00:00' };
        calculateEventColumns.mockReturnValueOnce(new Map([[getEventKey(event), { column: 0, totalColumns: 1 }]]));
        const style = calculateEventStyle(event, slotHeight, [event, otherEvent]);
        expect(style.width).toBe('100%');
    });
});

describe('calculateNewEndTime', () => {
    const slotHeight = 80;
    const snapInterval = 15;

    it('calculates new end time based on deltaY', () => {
        const event = {
            start_time: '2026-03-15T10:00:00Z',
            end_time: '2026-03-15T11:00:00Z',
        };
        // deltaY of 40px with slotHeight 80 = 30 minutes
        const newEnd = calculateNewEndTime(event, 40, slotHeight, snapInterval);
        const expected = new Date('2026-03-15T11:30:00Z');
        expect(newEnd.getHours()).toBe(expected.getHours());
        expect(newEnd.getMinutes()).toBe(expected.getMinutes());
    });

    it('snaps to nearest interval', () => {
        const event = {
            start_time: '2026-03-15T10:00:00Z',
            end_time: '2026-03-15T11:00:00Z',
        };
        // deltaY of 10px with slotHeight 80 = 7.5 min -> rounds to nearest 15 = 15
        const newEnd = calculateNewEndTime(event, 10, slotHeight, snapInterval);
        const expected = new Date('2026-03-15T11:15:00Z');
        expect(newEnd.getMinutes()).toBe(expected.getMinutes());
    });

    it('prevents end from being at or before start', () => {
        const event = {
            start_time: '2026-03-15T11:00:00Z',
            end_time: '2026-03-15T11:30:00Z',
        };
        // Large negative deltaY would make end before start
        const newEnd = calculateNewEndTime(event, -200, slotHeight, snapInterval);
        const start = new Date(event.start_time);
        expect(newEnd.getTime()).toBeGreaterThan(start.getTime());
    });

    it('adds exact snapInterval when new end equals start', () => {
        const event = {
            start_time: '2026-03-15T11:00:00Z',
            end_time: '2026-03-15T11:00:00Z', // same time
        };
        const newEnd = calculateNewEndTime(event, 0, slotHeight, snapInterval);
        // newEnd should be start + 15 min
        const expected = new Date('2026-03-15T11:15:00Z');
        expect(newEnd.getMinutes()).toBe(expected.getMinutes());
    });
});
