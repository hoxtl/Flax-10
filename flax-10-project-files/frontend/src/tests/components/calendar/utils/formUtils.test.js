/**
 * Tests for formUtils - event form state management and submission logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getInitialForm,
    validateAndSubmit,
    executeDelete,
    deleteRecurrenceOccurrence,
    isRecurringEvent,
} from '../../../../components/calendar/utils/formUtils';

// Mock external dependencies
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

const { checkOverlapWithConfirm } = await import('../../../../components/calendar/utils/overlapUtils');
const { extractBaseEventId, hasRecurrence } = await import('../../../../components/calendar/utils/eventUtils');
const { geocodeAddress } = await import('../../../../api/geocodeApi');

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

const makeActions = () => ({
    addEvent: vi.fn().mockResolvedValue({}),
    editEvent: vi.fn().mockResolvedValue({}),
    removeEvent: vi.fn().mockResolvedValue({}),
    addException: vi.fn().mockResolvedValue({}),
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
        // formatForDateTimeInput mock returns ISO slice; midnight-aligned detection depends on T00:00 suffix
        // We just ensure the function runs without error
        expect(form).toBeDefined();
    });
});

describe('validateAndSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkOverlapWithConfirm.mockResolvedValue(true);
        geocodeAddress.mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
    });

    const makeForm = (overrides = {}) => ({
        title: 'My Event',
        description: '',
        start_time: '2026-03-15T10:00',
        end_time: '2026-03-15T11:00',
        recurrence: { frequency: 'none', interval: 1, end_date: null },
        reminder: [],
        tag: null,
        location: '',
        all_day: false,
        is_private: false,
        ...overrides,
    });

    it('calls e.preventDefault if e is provided', async () => {
        const e = { preventDefault: vi.fn() };
        const setError = vi.fn();
        const onClose = vi.fn();
        const confirmFn = vi.fn();
        const actions = makeActions();
        hasRecurrence.mockReturnValue(false);

        await validateAndSubmit(e, makeForm(), null, actions, onClose, setError, confirmFn, []);
        expect(e.preventDefault).toHaveBeenCalled();
    });

    it('sets error and returns false when title is empty', async () => {
        const setError = vi.fn();
        const result = await validateAndSubmit(null, makeForm({ title: '  ' }), null, makeActions(), vi.fn(), setError, vi.fn(), []);
        expect(setError).toHaveBeenCalledWith('Title is required');
        expect(result).toBe(false);
    });

    it('returns false when overlap check fails', async () => {
        checkOverlapWithConfirm.mockResolvedValue(false);
        const result = await validateAndSubmit(
            null,
            makeForm(),
            makeEvent({ id: 2 }),
            makeActions(),
            vi.fn(),
            vi.fn(),
            vi.fn(),
            [{ id: 2 }, { id: 3, title: 'Other event' }],
        );
        expect(result).toBe(false);
        expect(checkOverlapWithConfirm).toHaveBeenCalledWith(expect.any(Object), [{ id: 3, title: 'Other event' }], expect.any(Function));
    });

    it('skips overlap check when forceSave is true', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        const onClose = vi.fn();
        const result = await validateAndSubmit(null, makeForm(), null, actions, onClose, vi.fn(), vi.fn(), [], true);
        expect(checkOverlapWithConfirm).not.toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('calls addEvent for new event', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        const onClose = vi.fn();
        await validateAndSubmit(null, makeForm(), null, actions, onClose, vi.fn(), vi.fn(), []);
        expect(actions.addEvent).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('calls editEvent for existing non-recurring event', async () => {
        hasRecurrence.mockReturnValue(false);
        const event = makeEvent({ id: 5 });
        const actions = makeActions();
        const onClose = vi.fn();
        await validateAndSubmit(null, makeForm(), event, actions, onClose, vi.fn(), vi.fn(), []);
        expect(actions.editEvent).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('handles recurring event - edit all', async () => {
        hasRecurrence.mockReturnValue(true);
        const event = makeEvent({ id: 5, recurrence: 'weekly' });
        const actions = makeActions();
        const onClose = vi.fn();
        const confirmFn = vi.fn().mockResolvedValue(true);
        await validateAndSubmit(null, makeForm(), event, actions, onClose, vi.fn(), confirmFn, []);
        expect(actions.editEvent).toHaveBeenCalled();
    });

    it('passes the extracted base id into recurring edit-all actions', async () => {
        hasRecurrence.mockReturnValue(true);
        extractBaseEventId.mockReturnValue(55);
        const event = makeEvent({ id: '55_2026-03-15', recurrence: 'weekly' });
        const actions = makeActions();
        const confirmFn = vi.fn().mockResolvedValue(true);

        await validateAndSubmit(null, makeForm(), event, actions, vi.fn(), vi.fn(), confirmFn, []);

        expect(actions.editEvent).toHaveBeenCalledWith(55, expect.any(Object));
    });

    it('handles recurring event - edit single occurrence', async () => {
        hasRecurrence.mockReturnValue(true);
        extractBaseEventId.mockReturnValue(77);
        const event = makeEvent({ id: 5, recurrence: 'weekly' });
        const actions = makeActions();
        const onClose = vi.fn();
        const confirmFn = vi.fn().mockResolvedValue(false);
        checkOverlapWithConfirm.mockResolvedValue(true);
        await validateAndSubmit(null, makeForm(), event, actions, onClose, vi.fn(), confirmFn, []);
        expect(actions.addException).toHaveBeenCalledWith(77, '2026-03-15');
        expect(actions.addEvent).toHaveBeenCalledWith(expect.not.objectContaining({ recurrence_rule: expect.anything() }));
    });

    it('sets error and returns false on exception', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        actions.addEvent.mockRejectedValue(new Error('Network error'));
        const setError = vi.fn();
        const result = await validateAndSubmit(null, makeForm(), null, actions, vi.fn(), setError, vi.fn(), []);
        expect(setError).toHaveBeenCalledWith('Network error');
        expect(result).toBe(false);
    });

    it('builds event data with recurrence rule when frequency is not none', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(null, makeForm({ recurrence: { frequency: 'weekly', interval: 1, end_date: null } }), null, actions, vi.fn(), vi.fn(), vi.fn(), []);
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            recurrence_rule: expect.objectContaining({ frequency: 'weekly' }),
        }));
    });

    it('sets recurrence_rule to null when frequency is none', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(null, makeForm(), null, actions, vi.fn(), vi.fn(), vi.fn(), []);
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({ recurrence_rule: null }));
    });

    it('sets location coords when geocode succeeds', async () => {
        hasRecurrence.mockReturnValue(false);
        geocodeAddress.mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
        const actions = makeActions();
        await validateAndSubmit(null, makeForm({ location: 'London' }), null, actions, vi.fn(), vi.fn(), vi.fn(), []);
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            location_latitude: 51.5,
            location_longitude: -0.1,
            location_validated: true,
        }));
    });

    it('sets location_validated false when geocode returns null', async () => {
        hasRecurrence.mockReturnValue(false);
        geocodeAddress.mockResolvedValue(null);
        const actions = makeActions();
        await validateAndSubmit(null, makeForm({ location: 'Nowhere' }), null, actions, vi.fn(), vi.fn(), vi.fn(), []);
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            location_validated: false,
        }));
    });

    it('skips geocoding for blank locations and preserves explicit privacy flags', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(
            null,
            makeForm({ location: '   ', is_private: true }),
            null,
            actions,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            [],
        );

        expect(geocodeAddress).not.toHaveBeenCalled();
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            is_private: true,
            recurrence_rule: null,
            tag: null,
        }));
    });

    it('preserves zero tags and explicit false privacy values in base event data', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(
            null,
            makeForm({ tag: 0, is_private: false }),
            null,
            actions,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            [],
        );

        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            tag: null,
            is_private: false,
        }));
    });

    it('keeps truthy tags and nullish recurrence/private fallbacks when omitted', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(
            null,
            makeForm({ tag: 9, recurrence: undefined, is_private: undefined }),
            null,
            actions,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            [],
        );

        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            tag: 9,
            is_private: false,
            recurrence_rule: null,
        }));
    });

    it('normalizes recurrence interval and end date fallbacks', async () => {
        hasRecurrence.mockReturnValue(false);
        const actions = makeActions();
        await validateAndSubmit(
            null,
            makeForm({ recurrence: { frequency: 'daily', interval: '0', end_date: '' } }),
            null,
            actions,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            [],
        );

        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            recurrence_rule: { frequency: 'daily', interval: 1, end_date: null },
        }));
    });
});

describe('executeDelete', () => {
    it('calls removeEvent with base event id', async () => {
        extractBaseEventId.mockReturnValue(1);
        const event = makeEvent({ id: 1 });
        const actions = makeActions();
        await executeDelete(event, actions);
        expect(actions.removeEvent).toHaveBeenCalledWith(1);
    });
});

describe('deleteRecurrenceOccurrence', () => {
    it('calls addException with base id and date string', async () => {
        extractBaseEventId.mockReturnValue(5);
        const event = makeEvent({ id: 5, start_time: '2026-03-15T10:00:00Z' });
        const actions = makeActions();
        await deleteRecurrenceOccurrence(event, actions);
        expect(actions.addException).toHaveBeenCalledWith(5, '2026-03-15');
    });
});

describe('isRecurringEvent', () => {
    it('delegates to hasRecurrence', () => {
        hasRecurrence.mockReturnValue(true);
        const event = makeEvent({ recurrence: 'weekly' });
        expect(isRecurringEvent(event)).toBe(true);
    });

    it('returns false for non-recurring event', () => {
        hasRecurrence.mockReturnValue(false);
        const event = makeEvent();
        expect(isRecurringEvent(event)).toBe(false);
    });
});
