import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getInitialForm,
    validateAndSubmit,
    executeDelete,
    deleteRecurrenceOccurrence,
    isRecurringEvent,
} from '../../components/Calendar/utils/formUtils';

vi.mock('../../components/Calendar/utils/overlapUtils', () => ({
    checkOverlapWithConfirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../components/Calendar/utils/eventUtils', () => ({
    extractBaseEventId: vi.fn((id) => typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id),
    hasRecurrence: vi.fn((event) => !!(event?.recurrence_rule || event?.recurrence_details)),
}));

vi.mock('../../components/Calendar/utils/dateValidation', () => ({
    validateDateRange: vi.fn().mockReturnValue(null),
}));

vi.mock('../../api/geocodeApi', () => ({
    geocodeAddress: vi.fn(),
}));

import { checkOverlapWithConfirm } from '../../components/Calendar/utils/overlapUtils';
import { extractBaseEventId, hasRecurrence } from '../../components/Calendar/utils/eventUtils';
import { geocodeAddress } from '../../api/geocodeApi';

describe('getInitialForm', () => {
    it('returns default form when no event', () => {
        const form = getInitialForm(null);
        expect(form.title).toBe('');
        expect(form.description).toBe('');
        expect(form.recurrence).toEqual({ frequency: 'none', interval: 1, end_date: null });
        expect(form.reminder).toEqual([]);
        expect(form.tag).toBeNull();
        expect(form.location).toBe('');
        expect(form.all_day).toBe(false);
        expect(form.is_private).toBe(false);
    });

    it('uses initialDate option in default form', () => {
        const initialDate = '2026-05-01T10:00:00';
        const form = getInitialForm(null, { initialDate });
        expect(form.start_time).toContain('2026-05-01');
    });

    it('uses initialTag option in default form', () => {
        const form = getInitialForm(null, { initialTag: 42 });
        expect(form.tag).toBe(42);
    });

    it('returns form from event', () => {
        const event = {
            title: 'Test Event',
            description: 'A description',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            reminder_minutes: [15, 30],
            tag: 5,
            location: 'Room 101',
            is_private: true,
        };
        const form = getInitialForm(event);
        expect(form.title).toBe('Test Event');
        expect(form.description).toBe('A description');
        expect(form.reminder).toEqual([15, 30]);
        expect(form.tag).toBe(5);
        expect(form.location).toBe('Room 101');
        expect(form.is_private).toBe(true);
    });

    it('uses tag_details.id when tag is absent', () => {
        const event = {
            title: 'X',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            tag_details: { id: 7 },
        };
        const form = getInitialForm(event);
        expect(form.tag).toBe(7);
    });

    it('uses recurrence_details when present', () => {
        const event = {
            title: 'Recurring',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            recurrence_details: { frequency: 'weekly', interval: 2, end_date: '2026-06-01' },
        };
        const form = getInitialForm(event);
        expect(form.recurrence.frequency).toBe('weekly');
        expect(form.recurrence.interval).toBe(2);
        expect(form.recurrence.end_date).toBe('2026-06-01');
    });

    it('handles string recurrence on event', () => {
        const event = {
            title: 'Daily',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            recurrence: 'daily',
        };
        const form = getInitialForm(event);
        expect(form.recurrence.frequency).toBe('daily');
    });

    it('marks all_day true from event.all_day flag', () => {
        const event = {
            title: 'Full day',
            start_time: '2026-03-07T00:00:00',
            end_time: '2026-03-08T00:00:00',
            all_day: true,
        };
        const form = getInitialForm(event);
        expect(form.all_day).toBe(true);
    });

    it('sets reminder to empty array when not array', () => {
        const event = {
            title: 'No reminder',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            reminder_minutes: null,
        };
        const form = getInitialForm(event);
        expect(form.reminder).toEqual([]);
    });

    it('reads all-day aliases and recurrence defaults from sparse events', () => {
        const form = getInitialForm({
            title: 'Alias all day',
            start_time: '2026-03-07T00:00:00',
            end_time: '2026-03-07T00:00:00',
            is_all_day: true,
            recurrence: '',
        });

        expect(form.all_day).toBe(true);
        expect(form.recurrence).toEqual({ frequency: 'none', interval: 1, end_date: null });
    });

    it('falls back to empty text fields and recurrence detail defaults', () => {
        const form = getInitialForm({
            title: '',
            description: '',
            location: '',
            start_time: '2026-03-07T09:00:00',
            end_time: '2026-03-07T10:00:00',
            recurrence_details: { frequency: '', interval: 0, end_date: '' },
        });

        expect(form.title).toBe('');
        expect(form.description).toBe('');
        expect(form.location).toBe('');
        expect(form.recurrence).toEqual({ frequency: 'none', interval: 1, end_date: null });
    });
});

describe('isRecurringEvent', () => {
    it('delegates to hasRecurrence', () => {
        const event = { recurrence_rule: { frequency: 'weekly' } };
        hasRecurrence.mockReturnValueOnce(true);
        expect(isRecurringEvent(event)).toBe(true);
    });

    it('returns false for non-recurring event', () => {
        hasRecurrence.mockReturnValueOnce(false);
        expect(isRecurringEvent({})).toBe(false);
    });
});

describe('executeDelete', () => {
    it('calls actions.removeEvent with base event id', async () => {
        const actions = { removeEvent: vi.fn().mockResolvedValue() };
        extractBaseEventId.mockReturnValueOnce(99);
        await executeDelete({ id: '99_2026-03-07', start_time: '2026-03-07T09:00:00' }, actions);
        expect(actions.removeEvent).toHaveBeenCalledWith(99);
    });
});

describe('deleteRecurrenceOccurrence', () => {
    it('calls actions.addException with base id and date string', async () => {
        const actions = { addException: vi.fn().mockResolvedValue() };
        extractBaseEventId.mockReturnValueOnce(5);
        const event = { id: '5_2026-03-07', start_time: '2026-03-07T09:00:00' };
        await deleteRecurrenceOccurrence(event, actions);
        expect(actions.addException).toHaveBeenCalledWith(5, '2026-03-07');
    });
});

describe('validateAndSubmit', () => {
    let actions, onClose, setError, confirmFn;

    beforeEach(() => {
        actions = {
            addEvent: vi.fn().mockResolvedValue(),
            editEvent: vi.fn().mockResolvedValue(),
            addException: vi.fn().mockResolvedValue(),
        };
        onClose = vi.fn();
        setError = vi.fn();
        confirmFn = vi.fn().mockResolvedValue(true);
        checkOverlapWithConfirm.mockResolvedValue(true);
        hasRecurrence.mockReturnValue(false);
        extractBaseEventId.mockImplementation((id) => id);
        geocodeAddress.mockReset();
    });

    it('calls setError when title is empty', async () => {
        const form = {
            title: '',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(setError).toHaveBeenCalledWith('Title is required');
        expect(actions.addEvent).not.toHaveBeenCalled();
    });

    it('calls addEvent for new event (no id)', async () => {
        const form = {
            title: 'New Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('applies recurring-rule interval and end-date fallbacks when submitting', async () => {
        const form = {
            title: 'Recurring Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'weekly', interval: '', end_date: '' },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };

        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);

        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            recurrence_rule: { frequency: 'weekly', interval: 1, end_date: null },
        }));
    });

    it('calls editEvent for existing non-recurring event', async () => {
        const event = { id: 10 };
        const form = {
            title: 'Updated Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        extractBaseEventId.mockReturnValue(10);
        await validateAndSubmit(null, form, event, actions, onClose, setError, confirmFn, []);
        expect(actions.editEvent).toHaveBeenCalledWith(10, expect.any(Object));
        expect(onClose).toHaveBeenCalled();
    });

    it('returns early when overlap check fails', async () => {
        checkOverlapWithConfirm.mockResolvedValue(false);
        const form = {
            title: 'Overlap Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('filters the current event out of overlap checks and handles blank recurrence/location fallbacks', async () => {
        const event = { id: 10 };
        const form = {
            title: 'Updated Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: null,
            reminder: [],
            tag: '',
            location: '   ',
            all_day: false,
            is_private: undefined,
        };

        await validateAndSubmit(null, form, event, actions, onClose, setError, confirmFn, [{ id: 10 }, { id: 11 }]);

        expect(checkOverlapWithConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 10,
                recurrence_rule: null,
                is_private: false,
                tag: null,
            }),
            [{ id: 11 }],
            confirmFn,
        );
    });

    it('includes recurrence_rule in data when frequency is not none', async () => {
        const form = {
            title: 'Weekly Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'weekly', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).toHaveBeenCalledWith(
            expect.objectContaining({ recurrence_rule: expect.objectContaining({ frequency: 'weekly' }) })
        );
    });

    it('sets recurrence_rule to null when frequency is none', async () => {
        const form = {
            title: 'One-off',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).toHaveBeenCalledWith(
            expect.objectContaining({ recurrence_rule: null })
        );
    });

    it('geocodes locations and keeps invalid lookups marked as unvalidated', async () => {
        geocodeAddress
            .mockResolvedValueOnce({ latitude: 1.2, longitude: 3.4 })
            .mockResolvedValueOnce(null);

        const geocodedForm = {
            title: 'Mapped Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'daily', interval: '2', end_date: '' },
            reminder: [],
            tag: null,
            location: 'Library',
            all_day: false,
            is_private: false,
        };

        await validateAndSubmit(null, geocodedForm, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            location_latitude: 1.2,
            location_longitude: 3.4,
            location_validated: true,
            recurrence_rule: { frequency: 'daily', interval: 2, end_date: null },
        }));

        await validateAndSubmit(null, { ...geocodedForm, location: 'Unknown room' }, null, actions, onClose, setError, confirmFn, []);
        expect(actions.addEvent).toHaveBeenLastCalledWith(expect.objectContaining({
            location_validated: false,
        }));
    });

    it('calls setError when addEvent throws', async () => {
        actions.addEvent.mockRejectedValueOnce(new Error('Server error'));
        const form = {
            title: 'Throw Event',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'none', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, null, actions, onClose, setError, confirmFn, []);
        expect(setError).toHaveBeenCalledWith('Server error');
    });

    it('handles recurring event with all occurrences edit (confirmFn returns true)', async () => {
        const event = { id: 5, recurrence_details: { frequency: 'weekly' } };
        hasRecurrence.mockReturnValue(true);
        extractBaseEventId.mockReturnValue(5);
        confirmFn.mockResolvedValueOnce(true); // edit all
        const form = {
            title: 'Recurring Edit',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'weekly', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, event, actions, onClose, setError, confirmFn, [], true);
        expect(actions.editEvent).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it('handles recurring event with single occurrence edit (confirmFn returns false)', async () => {
        const event = { id: 5, recurrence_details: { frequency: 'weekly' }, start_time: '2026-03-07T09:00:00' };
        hasRecurrence.mockReturnValue(true);
        extractBaseEventId.mockReturnValue(5);
        // First confirmFn call is for overlap check (returns true), second is for recurring edit (returns false)
        confirmFn
            .mockResolvedValueOnce(false); // edit only this one
        checkOverlapWithConfirm.mockResolvedValue(true);
        const form = {
            title: 'Recurring Single Edit',
            description: '',
            start_time: '2026-03-07T09:00',
            end_time: '2026-03-07T10:00',
            recurrence: { frequency: 'weekly', interval: 1, end_date: null },
            reminder: [],
            tag: null,
            location: '',
            all_day: false,
            is_private: false,
        };
        await validateAndSubmit(null, form, event, actions, onClose, setError, confirmFn, [], true);
        expect(actions.addException).toHaveBeenCalledWith(5, '2026-03-07');
        expect(actions.addEvent).toHaveBeenCalled();
    });
});
