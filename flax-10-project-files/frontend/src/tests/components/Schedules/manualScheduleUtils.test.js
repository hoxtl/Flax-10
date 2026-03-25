import { describe, it, expect } from 'vitest';
import {
    filterScheduleEvents,
    toggleSelectedEventId,
    getManualScheduleError,
} from '../../../components/Schedules/manual/manualScheduleUtils';

describe('filterScheduleEvents', () => {
    const events = [
        { id: 1, title: 'Lecture on React' },
        { id: 2, title: 'Chemistry Lab' },
        { id: 3, title: 'Advanced Maths' },
    ];

    it('returns all events when query is empty string', () => {
        expect(filterScheduleEvents(events, '')).toHaveLength(3);
    });

    it('returns all events when query is only whitespace', () => {
        expect(filterScheduleEvents(events, '   ')).toHaveLength(3);
    });

    it('filters events by title case-insensitively', () => {
        expect(filterScheduleEvents(events, 'react')).toEqual([events[0]]);
        expect(filterScheduleEvents(events, 'CHEMISTRY')).toEqual([events[1]]);
    });

    it('trims the query before filtering', () => {
        expect(filterScheduleEvents(events, '  lab  ')).toEqual([events[1]]);
    });

    it('returns empty array when nothing matches', () => {
        expect(filterScheduleEvents(events, 'zzz')).toHaveLength(0);
    });

    it('handles events with no title gracefully', () => {
        const noTitle = [{ id: 1, title: null }, { id: 2, title: undefined }];
        expect(() => filterScheduleEvents(noTitle, 'test')).not.toThrow();
    });
});

describe('toggleSelectedEventId', () => {
    it('adds an ID not in the list', () => {
        expect(toggleSelectedEventId([1, 2], 3)).toEqual([1, 2, 3]);
    });

    it('removes an ID already in the list', () => {
        expect(toggleSelectedEventId([1, 2, 3], 2)).toEqual([1, 3]);
    });

    it('works on empty list – adds the id', () => {
        expect(toggleSelectedEventId([], 5)).toEqual([5]);
    });

    it('returns empty list when last item is removed', () => {
        expect(toggleSelectedEventId([5], 5)).toEqual([]);
    });
});

describe('getManualScheduleError', () => {
    it('returns error when title is empty string', () => {
        expect(getManualScheduleError('', [1])).toBe('Please enter a schedule name.');
    });

    it('returns error when title is only whitespace', () => {
        expect(getManualScheduleError('   ', [1])).toBe('Please enter a schedule name.');
    });

    it('returns error when selected array is empty', () => {
        expect(getManualScheduleError('My Plan', [])).toBe('Select at least one event tagged as schedule.');
    });

    it('returns null when both title and selected are valid', () => {
        expect(getManualScheduleError('My Plan', [1, 2])).toBeNull();
    });

    it('checks title before selected', () => {
        // Both invalid – should return the title error first
        expect(getManualScheduleError('', [])).toBe('Please enter a schedule name.');
    });
});
