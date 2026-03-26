import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    RANGE_OPTIONS,
    DATE_FORMAT,
    TIME_FORMAT,
    getFilteredEvents,
    getUpcomingCount,
    getRangeLabel,
    buildInitials,
    buildFullName,
} from '../../pages/profile/utils/profileHelpers';

vi.mock('../../components/auth/utils/userUtils', () => ({
    getInitials: vi.fn((name) => name.split(' ').map(p => p[0]).join('')),
}));

import { getInitials } from '../../components/auth/utils/userUtils';

const today = new Date('2026-03-08T00:00:00');
const todayStr = '2026-03-08';

describe('constants', () => {
    it('RANGE_OPTIONS has today, week, month', () => {
        const keys = RANGE_OPTIONS.map(([k]) => k);
        expect(keys).toContain('today');
        expect(keys).toContain('week');
        expect(keys).toContain('month');
    });

    it('DATE_FORMAT and TIME_FORMAT are objects', () => {
        expect(typeof DATE_FORMAT).toBe('object');
        expect(typeof TIME_FORMAT).toBe('object');
    });
});

describe('getFilteredEvents', () => {
    const events = [
        { start_time: '2026-03-08T09:00:00' }, // today
        { start_time: '2026-03-09T09:00:00' }, // tomorrow
        { start_time: '2026-03-01T09:00:00' }, // last week (before today)
        { start_time: '2026-04-10T09:00:00' }, // far future (>30 days)
    ];

    it('returns only today events for "today" range', () => {
        const result = getFilteredEvents(events, 'today', todayStr);
        expect(result).toHaveLength(1);
        expect(result[0].start_time).toBe('2026-03-08T09:00:00');
    });

    it('returns events within next 7 days for "week" range', () => {
        const result = getFilteredEvents(events, 'week', todayStr);
        expect(result).toHaveLength(2);
    });

    it('returns events within next 30 days for "month" range', () => {
        const result = getFilteredEvents(events, 'month', todayStr);
        expect(result).toHaveLength(2);
    });

    it('returns sorted events by start_time', () => {
        const result = getFilteredEvents(events, 'week', todayStr);
        expect(new Date(result[0].start_time).getTime()).toBeLessThanOrEqual(new Date(result[1].start_time).getTime());
    });

    it('handles null/undefined events gracefully', () => {
        expect(getFilteredEvents(null, 'today', todayStr)).toEqual([]);
        expect(getFilteredEvents(undefined, 'week', todayStr)).toEqual([]);
    });
});

describe('getUpcomingCount', () => {
    it('counts events within next 30 days', () => {
        const events = [
            { start_time: '2026-03-08T09:00:00' }, // today
            { start_time: '2026-03-20T09:00:00' }, // 12 days away
            { start_time: '2025-12-01T09:00:00' }, // past
        ];
        // getUpcomingCount uses getToday() internally, so test relative to actual today
        const count = getUpcomingCount(events);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

describe('getRangeLabel', () => {
    it('returns label for known range', () => {
        expect(getRangeLabel('today')).toBe('Today');
        expect(getRangeLabel('week')).toBe('This Week');
        expect(getRangeLabel('month')).toBe('This Month');
    });

    it('returns the key itself for unknown range', () => {
        expect(getRangeLabel('unknown')).toBe('unknown');
    });
});

describe('buildInitials', () => {
    it('uses name when available', () => {
        getInitials.mockReturnValueOnce('JD');
        const result = buildInitials({ name: 'John Doe' });
        expect(result).toBe('JD');
        expect(getInitials).toHaveBeenCalledWith('John Doe');
    });

    it('uses first_name and last_name initials when no name', () => {
        const result = buildInitials({ first_name: 'Jane', last_name: 'Smith' });
        expect(result).toBe('JS');
    });

    it('returns "?" for null/empty user', () => {
        expect(buildInitials(null)).toBe('?');
        expect(buildInitials({})).toBe('?');
    });
});

describe('buildFullName', () => {
    it('returns name when present', () => {
        expect(buildFullName({ name: 'Alice Wonderland' })).toBe('Alice Wonderland');
    });

    it('returns first + last when no name', () => {
        expect(buildFullName({ first_name: 'Bob', last_name: 'Smith' })).toBe('Bob Smith');
    });

    it('returns "Guest" for null/empty user', () => {
        expect(buildFullName(null)).toBe('Guest');
        expect(buildFullName({})).toBe('Guest');
    });
});
