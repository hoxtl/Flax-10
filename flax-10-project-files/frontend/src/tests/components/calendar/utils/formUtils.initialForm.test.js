/*
 * Tests for getInitialForm — initial form state derived from an event or defaults.
 */

import { describe, it, expect, vi } from 'vitest';
import { getInitialForm } from '../../../../components/calendar/utils/formUtils';

vi.mock('../../../../components/calendar/utils/overlapUtils', () => ({
    checkOverlapWithConfirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    extractBaseEventId: vi.fn((id) => typeof id === 'string' ? parseInt(id.split('_')[0]) || id : id),
    hasRecurrence: vi.fn((event) => !!event?.recurrence_details || !!event?.recurrence_rule || (typeof event?.recurrence === 'string' && event.recurrence !== 'none')),
}));

vi.mock('../../../../components/calendar/utils/dateValidation', () => ({
    validateDateRange: vi.fn((start, end) => {
        if (new Date(start) >= new Date(end)) return 'Start must be before end';
        return null;
    }),
}));

vi.mock('../../../../api/geocodeApi', () => ({
    geocodeAddress: vi.fn().mockResolvedValue({ latitude: 51.5, longitude: -0.1 }),
}));

vi.mock('../../../../utils/dateTimeInput', () => ({
    formatForDateTimeInput: vi.fn((d) => {
        if (!d) return '2026-03-15T10:00';
        const date = typeof d === 'string' ? new Date(d) : d;
        return date.toISOString().slice(0, 16);
    }),
}));

const makeEvent = (overrides = {}) => ({
    id: 1,
    title: 'Test Event',
    description: 'A test',
    start_time: '2026-03-15T10:00:00Z',
    end_time: '2026-03-15T11:00:00Z',
    recurrence: 'none',
    reminder_minutes: [],
    tag: null,
    location: '',
    all_day: false,
    is_private: false,
    ...overrides,
});

describe('getInitialForm', () => {
    it('returns form from event when event is provided', () => {
        const event = makeEvent({ title: 'My Event', description: 'desc' });
        const form = getInitialForm(event);
        expect(form.title).toBe('My Event');
        expect(form.description).toBe('desc');
    });

    it('returns default form when no event', () => {
        const form = getInitialForm(null);
        expect(form.title).toBe('');
        expect(form.description).toBe('');
        expect(form.reminder).toEqual([]);
        expect(form.all_day).toBe(false);
        expect(form.is_private).toBe(false);
    });

    it('uses initialDate option for default form', () => {
        const form = getInitialForm(null, { initialDate: new Date('2026-04-01T09:00:00Z') });
        expect(form.start_time).toBeTruthy();
    });

    it('uses initialTag option for default form', () => {
        const form = getInitialForm(null, { initialTag: 5 });
        expect(form.tag).toBe(5);
    });

    it('maps event reminder_minutes as array', () => {
        const event = makeEvent({ reminder_minutes: [10, 30] });
        const form = getInitialForm(event);
        expect(form.reminder).toEqual([10, 30]);
    });

    it('uses empty array when reminder_minutes is not array', () => {
        const event = makeEvent({ reminder_minutes: null });
        const form = getInitialForm(event);
        expect(form.reminder).toEqual([]);
    });

    it('uses tag_details id when tag is not set', () => {
        const event = makeEvent({ tag: null, tag_details: { id: 3 } });
        const form = getInitialForm(event);
        expect(form.tag).toBe(3);
    });

    it('handles recurrence_details', () => {
        const event = makeEvent({
            recurrence_details: { frequency: 'weekly', interval: 2, end_date: '2026-06-01' },
        });
        const form = getInitialForm(event);
        expect(form.recurrence.frequency).toBe('weekly');
        expect(form.recurrence.interval).toBe(2);
        expect(form.recurrence.end_date).toBe('2026-06-01');
    });

    it('handles string recurrence', () => {
        const event = makeEvent({ recurrence: 'daily' });
        const form = getInitialForm(event);
        expect(form.recurrence.frequency).toBe('daily');
        expect(form.recurrence.interval).toBe(1);
    });

    it('returns none recurrence when recurrence is not string or details', () => {
        const event = makeEvent({ recurrence: null });
        const form = getInitialForm(event);
        expect(form.recurrence.frequency).toBe('none');
    });

    it('falls back missing title, description, empty string recurrence, and privacy defaults', () => {
        const event = makeEvent({
            title: '',
            description: '',
            recurrence: '',
            is_private: undefined,
            location: '',
        });
        const form = getInitialForm(event);
        expect(form.title).toBe('');
        expect(form.description).toBe('');
        expect(form.recurrence).toEqual({ frequency: 'none', interval: 1, end_date: null });
        expect(form.is_private).toBe(false);
        expect(form.location).toBe('');
    });

    it('normalizes recurrence details fallbacks from partial values', () => {
        const event = makeEvent({
            recurrence_details: { frequency: '', interval: 0, end_date: '' },
        });
        const form = getInitialForm(event);
        expect(form.recurrence).toEqual({ frequency: 'none', interval: 1, end_date: null });
    });

    it('detects all_day from event flags', () => {
        const event = makeEvent({ all_day: true });
        const form = getInitialForm(event);
        expect(form.all_day).toBe(true);
    });

    it('detects all_day from midnight-aligned times', () => {
        const event = makeEvent({
            start_time: '2026-03-15T00:00:00Z',
            end_time: '2026-03-16T00:00:00Z',
            all_day: false,
        });
        const form = getInitialForm(event);
        expect(form).toBeDefined();
    });
});
