import { describe, it, expect } from 'vitest';
import {
    extractBaseEventId,
    hasRecurrence,
    getEventType,
    isReadOnlyEvent,
} from '../../../../components/calendar/utils/eventUtils';

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

    it('returns "group_meeting" for source=group_meeting', () => {
        expect(getEventType({ source: 'group_meeting' })).toBe('group_meeting');
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
