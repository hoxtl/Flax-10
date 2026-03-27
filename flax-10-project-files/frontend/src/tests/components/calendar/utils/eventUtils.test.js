import { describe, it, expect, vi } from 'vitest';
import {
    extractBaseEventId,
    hasRecurrence,
    isReadOnlyEvent,
    getEventType,
    getEffectiveTagName,
    getVisibleEventsInView,
    sortByStartTime,
    isAllDay,
} from '../../../../components/calendar/utils/eventUtils';

// Mock dateUtils.overlapsDay for day view tests
vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
    overlapsDay: vi.fn((start, end, day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return start <= dayEnd && end >= dayStart;
    }),
}));


describe('extractBaseEventId', () => {
    it('returns event._baseId if present', () => {
        expect(extractBaseEventId('100_1', { _baseId: 99 })).toBe(99);
    });

    it('returns event._baseId=0 (falsy but defined)', () => {
        expect(extractBaseEventId('100_1', { _baseId: 0 })).toBe(0);
    });

    it('parses numeric base from "123_2" string id', () => {
        expect(extractBaseEventId('123_2')).toBe(123);
    });

    it('returns string base when base part is non-numeric', () => {
        expect(extractBaseEventId('abc_2')).toBe('abc');
    });

    it('extracts base from large numeric id (>= 1000000)', () => {
        // 10000 * baseId + occurrence
        expect(extractBaseEventId(50010001)).toBe(5001);
    });

    it('returns numeric id unchanged when < 1000000', () => {
        expect(extractBaseEventId(42)).toBe(42);
    });

    it('returns string id unchanged when no underscore', () => {
        expect(extractBaseEventId('event-no-underscore')).toBe('event-no-underscore');
    });

    it('returns null as-is', () => {
        expect(extractBaseEventId(null)).toBe(null);
    });

    it('returns undefined as-is', () => {
        expect(extractBaseEventId(undefined)).toBe(undefined);
    });
});


describe('hasRecurrence', () => {
    it('returns false for null event', () => {
        expect(hasRecurrence(null)).toBe(false);
    });

    it('returns false for undefined event', () => {
        expect(hasRecurrence(undefined)).toBe(false);
    });

    it('returns true when recurrence_details present', () => {
        expect(hasRecurrence({ recurrence_details: { freq: 'daily' } })).toBe(true);
    });

    it('returns true when recurrence_rule present', () => {
        expect(hasRecurrence({ recurrence_rule: 'RRULE:FREQ=WEEKLY' })).toBe(true);
    });

    it('returns true when recurrence is a non-none string', () => {
        expect(hasRecurrence({ recurrence: 'weekly' })).toBe(true);
    });

    it('returns false when recurrence is "none"', () => {
        expect(hasRecurrence({ recurrence: 'none' })).toBe(false);
    });

    it('returns false when recurrence is not a string', () => {
        expect(hasRecurrence({ recurrence: 42 })).toBe(false);
    });

    it('returns false for plain event with no recurrence fields', () => {
        expect(hasRecurrence({ id: 1, title: 'Normal' })).toBe(false);
    });
});


describe('getEventType', () => {
    it('returns "personal" for null event', () => {
        expect(getEventType(null)).toBe('personal');
    });

    it('returns "personal" for undefined event', () => {
        expect(getEventType(undefined)).toBe('personal');
    });

    it('returns "society" for source=society', () => {
        expect(getEventType({ source: 'society' })).toBe('society');
    });

    it('returns "module" for source starting with module_', () => {
        expect(getEventType({ source: 'module_CS101' })).toBe('module');
    });

    it('returns "timetable" for source=timetable', () => {
        expect(getEventType({ source: 'timetable' })).toBe('timetable');
    });

    it('returns "module" when event.module is present', () => {
        expect(getEventType({ module: { id: 1 } })).toBe('module');
    });

    it('returns "timetable" when source and external_id present', () => {
        expect(getEventType({ source: 'external', external_id: 'ext-1' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (deadline)', () => {
        expect(getEventType({ tag_name: 'deadline' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (exam)', () => {
        expect(getEventType({ tag_name: 'exam' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (assignment)', () => {
        expect(getEventType({ tag_name: 'assignment' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (lab)', () => {
        expect(getEventType({ tag_name: 'lab' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (practical)', () => {
        expect(getEventType({ tag_name: 'practical' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag names (lecture)', () => {
        expect(getEventType({ tag_name: 'lecture' })).toBe('timetable');
    });

    it('returns "timetable" for fixed tag name via tag object', () => {
        expect(getEventType({ tag: { name: 'Lecture' } })).toBe('timetable');
    });

    it('returns "personal" for unknown tag_name', () => {
        expect(getEventType({ tag_name: 'work' })).toBe('personal');
    });

    it('returns "personal" for event with no special fields', () => {
        expect(getEventType({ id: 1, title: 'Meeting' })).toBe('personal');
    });

    it('handles tag_name with mixed case (case-insensitive)', () => {
        expect(getEventType({ tag_name: 'DEADLINE' })).toBe('timetable');
    });

    it('handles tag_name with leading/trailing spaces', () => {
        expect(getEventType({ tag_name: '  exam  ' })).toBe('timetable');
    });

    it('returns "personal" when tag is a string (not object)', () => {
        expect(getEventType({ tag: 'work' })).toBe('personal');
    });
});


describe('isReadOnlyEvent', () => {
    it('returns false for personal event', () => {
        expect(isReadOnlyEvent({ id: 1, title: 'Personal' })).toBe(false);
    });

    it('returns true for society event', () => {
        expect(isReadOnlyEvent({ source: 'society' })).toBe(true);
    });

    it('returns true for module event', () => {
        expect(isReadOnlyEvent({ source: 'module_CS101' })).toBe(true);
    });

    it('returns true for timetable event', () => {
        expect(isReadOnlyEvent({ tag_name: 'lecture' })).toBe(true);
    });
});


describe('getEffectiveTagName', () => {
    it('returns "other" for null event', () => {
        expect(getEffectiveTagName(null)).toBe('other');
    });

    it('returns "other" for undefined event', () => {
        expect(getEffectiveTagName(undefined)).toBe('other');
    });

    it('returns "societies" for source=society', () => {
        expect(getEffectiveTagName({ source: 'society' })).toBe('societies');
    });

    it('returns lowercase tag_name when present', () => {
        expect(getEffectiveTagName({ tag_name: 'Work' })).toBe('work');
    });

    it('returns lowercase tag name from tag object', () => {
        expect(getEffectiveTagName({ tag: { name: 'Study' } })).toBe('study');
    });

    it('returns "other" when no tag_name and tag is not object', () => {
        expect(getEffectiveTagName({ tag: 'work' })).toBe('other');
    });

    it('returns "other" when no tag at all', () => {
        expect(getEffectiveTagName({ id: 1 })).toBe('other');
    });

    it('returns "other" when tag_name is falsy empty string', () => {
        expect(getEffectiveTagName({ tag_name: '' })).toBe('other');
    });

    it('prefers tag_name over tag.name', () => {
        expect(getEffectiveTagName({ tag_name: 'work', tag: { name: 'study' } })).toBe('work');
    });

    it('returns tag.name when tag_name is not present', () => {
        expect(getEffectiveTagName({ tag: { name: 'Exercise' } })).toBe('exercise');
    });
});


describe('sortByStartTime', () => {
    it('sorts events ascending by start_time', () => {
        const events = [
            { id: 2, start_time: '2026-03-10T12:00:00' },
            { id: 1, start_time: '2026-03-10T08:00:00' },
            { id: 3, start_time: '2026-03-10T18:00:00' },
        ];
        const sorted = sortByStartTime(events);
        expect(sorted[0].id).toBe(1);
        expect(sorted[1].id).toBe(2);
        expect(sorted[2].id).toBe(3);
    });

    it('does not mutate the original array', () => {
        const events = [
            { id: 2, start_time: '2026-03-10T12:00:00' },
            { id: 1, start_time: '2026-03-10T08:00:00' },
        ];
        const sorted = sortByStartTime(events);
        expect(sorted).not.toBe(events);
        expect(events[0].id).toBe(2);
    });

    it('returns empty array for empty input', () => {
        expect(sortByStartTime([])).toEqual([]);
    });

    it('returns single element unchanged', () => {
        const events = [{ id: 1, start_time: '2026-03-10T09:00:00' }];
        expect(sortByStartTime(events)).toEqual(events);
    });
});


describe('isAllDay', () => {
    it('returns true when all_day flag is set', () => {
        expect(isAllDay({ all_day: true, start_time: '2026-03-10T00:00:00', end_time: '2026-03-11T00:00:00' })).toBe(true);
    });

    it('returns true when is_all_day flag is set', () => {
        expect(isAllDay({ is_all_day: true, start_time: '2026-03-10T00:00:00', end_time: '2026-03-11T00:00:00' })).toBe(true);
    });

    it('returns true for midnight-to-midnight spanning different days', () => {
        expect(isAllDay({
            start_time: '2026-03-10T00:00:00',
            end_time: '2026-03-11T00:00:00',
        })).toBe(true);
    });

    it('returns false when start is not midnight', () => {
        expect(isAllDay({
            start_time: '2026-03-10T08:00:00',
            end_time: '2026-03-11T00:00:00',
        })).toBe(false);
    });

    it('returns false when end is not midnight', () => {
        expect(isAllDay({
            start_time: '2026-03-10T00:00:00',
            end_time: '2026-03-11T01:00:00',
        })).toBe(false);
    });

    it('returns false when same day (not spanning to next day)', () => {
        expect(isAllDay({
            start_time: '2026-03-10T00:00:00',
            end_time: '2026-03-10T00:00:00',
        })).toBe(false);
    });

    it('returns true for multi-day all-day event', () => {
        expect(isAllDay({
            start_time: '2026-03-10T00:00:00',
            end_time: '2026-03-13T00:00:00',
        })).toBe(true);
    });
});


describe('getVisibleEventsInView', () => {
    it('returns empty array for null events', () => {
        expect(getVisibleEventsInView(null, new Date(), 'month')).toEqual([]);
    });

    it('returns empty array for empty events', () => {
        expect(getVisibleEventsInView([], new Date(), 'month')).toEqual([]);
    });

    it('returns all events for unknown viewMode', () => {
        const events = [
            { id: 1, start_time: '2026-01-01T10:00:00', end_time: '2026-01-01T11:00:00' },
        ];
        expect(getVisibleEventsInView(events, new Date(), 'unknown')).toEqual(events);
    });

    it('filters month view events to current month', () => {
        const march = new Date(2026, 2, 15);
        const events = [
            { id: 1, start_time: '2026-03-10T10:00:00', end_time: '2026-03-10T11:00:00' },
            { id: 2, start_time: '2026-04-01T10:00:00', end_time: '2026-04-01T11:00:00' },
            { id: 3, start_time: '2026-02-28T10:00:00', end_time: '2026-02-28T11:00:00' },
        ];
        const result = getVisibleEventsInView(events, march, 'month');
        expect(result.map(e => e.id)).toContain(1);
        expect(result.map(e => e.id)).not.toContain(2);
        expect(result.map(e => e.id)).not.toContain(3);
    });

    it('includes event that spans into month from previous month', () => {
        const march = new Date(2026, 2, 15);
        const events = [
            // Starts Feb 28, ends March 1 – spans into March
            { id: 10, start_time: '2026-02-28T10:00:00', end_time: '2026-03-01T10:00:00' },
        ];
        const result = getVisibleEventsInView(events, march, 'month');
        expect(result.map(e => e.id)).toContain(10);
    });

    it('filters week view events to current week', () => {
        // March 22 2026 is a Sunday (day 0)
        const sunday = new Date(2026, 2, 22);
        const events = [
            { id: 1, start_time: '2026-03-22T10:00:00', end_time: '2026-03-22T11:00:00' },
            { id: 2, start_time: '2026-03-28T10:00:00', end_time: '2026-03-28T11:00:00' }, // Saturday same week
            { id: 3, start_time: '2026-03-29T10:00:00', end_time: '2026-03-29T11:00:00' }, // Next Sunday
        ];
        const result = getVisibleEventsInView(events, sunday, 'week');
        expect(result.map(e => e.id)).toContain(1);
        expect(result.map(e => e.id)).toContain(2);
        expect(result.map(e => e.id)).not.toContain(3);
    });

    it('filters day view events to selected day using overlapsDay', () => {
        const day = new Date(2026, 2, 15);
        const events = [
            { id: 1, start_time: '2026-03-15T10:00:00', end_time: '2026-03-15T11:00:00' },
            { id: 2, start_time: '2026-03-16T10:00:00', end_time: '2026-03-16T11:00:00' },
        ];
        const result = getVisibleEventsInView(events, day, 'day');
        expect(result.map(e => e.id)).toContain(1);
        expect(result.map(e => e.id)).not.toContain(2);
    });
});
