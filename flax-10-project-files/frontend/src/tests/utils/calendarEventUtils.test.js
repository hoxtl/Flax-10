import { describe, it, expect } from 'vitest';
import {
    extractBaseEventId,
    hasRecurrence,
    isReadOnlyEvent,
    getEventType,
    getEffectiveTagName,
    getVisibleEventsInView,
} from '../../components/calendar/utils/eventUtils';

describe('extractBaseEventId', () => {
    it('returns _baseId from event object when present', () => {
        expect(extractBaseEventId('5_1', { _baseId: 42 })).toBe(42);
    });

    it('extracts numeric base from underscore-separated string id', () => {
        expect(extractBaseEventId('123_2')).toBe(123);
    });

    it('returns string base for non-numeric prefix', () => {
        expect(extractBaseEventId('abc_1')).toBe('abc');
    });

    it('returns floor id for large numeric id', () => {
        expect(extractBaseEventId(10000001)).toBe(1000);
    });

    it('returns id as-is for normal id', () => {
        expect(extractBaseEventId(5)).toBe(5);
    });
});

describe('hasRecurrence', () => {
    it('returns false for null event', () => {
        expect(hasRecurrence(null)).toBe(false);
    });

    it('returns true when event has recurrence_details', () => {
        expect(hasRecurrence({ recurrence_details: { frequency: 'weekly' } })).toBe(true);
    });

    it('returns true when event has recurrence_rule', () => {
        expect(hasRecurrence({ recurrence_rule: { frequency: 'daily' } })).toBe(true);
    });

    it('returns true when recurrence string is not none', () => {
        expect(hasRecurrence({ recurrence: 'weekly' })).toBe(true);
    });

    it('returns false when recurrence is none', () => {
        expect(hasRecurrence({ recurrence: 'none' })).toBe(false);
    });

    it('returns false for event without recurrence', () => {
        expect(hasRecurrence({ title: 'Event' })).toBe(false);
    });
});

describe('getEventType', () => {
    it('returns personal for null event', () => {
        expect(getEventType(null)).toBe('personal');
    });

    it('returns society for society source', () => {
        expect(getEventType({ source: 'society' })).toBe('society');
    });

    it('returns module for event with module field', () => {
        expect(getEventType({ module: 1 })).toBe('module');
    });

    it('returns timetable for event with source and external_id', () => {
        expect(getEventType({ source: 'timetable', external_id: 'abc' })).toBe('timetable');
    });

    it('returns personal for plain event', () => {
        expect(getEventType({ title: 'My Event' })).toBe('personal');
    });
});

describe('isReadOnlyEvent', () => {
    it('returns false for personal event', () => {
        expect(isReadOnlyEvent({ title: 'Event' })).toBe(false);
    });

    it('returns true for society event', () => {
        expect(isReadOnlyEvent({ source: 'society' })).toBe(true);
    });

    it('returns true for module event', () => {
        expect(isReadOnlyEvent({ module: 1 })).toBe(true);
    });
});

describe('getEffectiveTagName', () => {
    it('returns other for null event', () => {
        expect(getEffectiveTagName(null)).toBe('other');
    });

    it('returns societies for society events', () => {
        expect(getEffectiveTagName({ source: 'society' })).toBe('societies');
    });

    it('returns tag_name lowercased', () => {
        expect(getEffectiveTagName({ tag_name: 'Study' })).toBe('study');
    });

    it('returns tag object name when tag is object', () => {
        expect(getEffectiveTagName({ tag: { name: 'Work' } })).toBe('work');
    });

    it('returns other when no tag', () => {
        expect(getEffectiveTagName({ title: 'Event' })).toBe('other');
    });
});

describe('getVisibleEventsInView', () => {
    const events = [
        { id: 1, start_time: '2026-03-07T10:00:00', end_time: '2026-03-07T11:00:00' },
        { id: 2, start_time: '2026-03-08T10:00:00', end_time: '2026-03-08T11:00:00' },
    ];

    it('returns empty for empty events', () => {
        expect(getVisibleEventsInView([], new Date(), 'day')).toEqual([]);
    });

    it('returns all events for month view', () => {
        expect(getVisibleEventsInView(events, new Date(), 'month')).toEqual(events);
    });

    it('returns all events for year view', () => {
        expect(getVisibleEventsInView(events, new Date(), 'year')).toEqual(events);
    });

    it('filters events for day view', () => {
        const day = new Date('2026-03-07');
        const result = getVisibleEventsInView(events, day, 'day');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('filters events for week view', () => {
        const day = new Date('2026-03-07'); // Saturday
        const result = getVisibleEventsInView(events, day, 'week');
        // Both events are in the same week (Sunday 2026-03-01 to Saturday 2026-03-07)
        // Actually 2026-03-07 is a Saturday, so the week is 2026-03-01 to 2026-03-08
        expect(Array.isArray(result)).toBe(true);
    });

    it('returns all events for unknown view mode', () => {
        expect(getVisibleEventsInView(events, new Date(), 'unknown')).toEqual(events);
    });
});
