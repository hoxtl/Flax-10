/**
 * formUtils - Event form state management and submission logic.
 * Handles form initialization, validation, and CRUD operations.
 */

import { checkOverlapWithConfirm } from './overlapUtils';
import { extractBaseEventId, hasRecurrence } from './eventUtils';
import { validateDateRange } from './dateValidation';
import { geocodeAddress } from '../../../api/geocodeApi';
import { formatForDateTimeInput } from '../../../utils/dateTimeInput';

/** Creates initial form state from an existing event or defaults. */

export function getInitialForm(event, options = {}) {
    if (event) return getFormFromEvent(event, options);
    return getDefaultForm(options);
}

function getFormFromEvent(event, options) {
    return {
        title: event.title || '',
        description: event.description || '',
        start_time: formatForInput(event.start_time),
        end_time: formatForInput(event.end_time),
        recurrence: getRecurrenceFromEvent(event),
        reminder: Array.isArray(event.reminder_minutes) ? event.reminder_minutes : [],
        tag: event.tag ?? event.tag_details?.id ?? null,
        location: event.location || '',
        all_day: isAllDay(event),
        is_private: event.is_private ?? false,
    };
}

function getRecurrenceFromEvent(event) {
    if (event.recurrence_details) return parseRecurrenceDetails(event.recurrence_details);
    if (typeof event.recurrence === 'string') return { frequency: event.recurrence || 'none', interval: 1, end_date: null };
    return { frequency: 'none', interval: 1, end_date: null };
}

function parseRecurrenceDetails(details) {
    return { frequency: details.frequency || 'none', interval: details.interval || 1, end_date: details.end_date || null };
}

function isAllDay(event) {
    if (event.all_day || event.is_all_day || event.allDay) return true;
    const start = formatForInput(event.start_time);
    const end = formatForInput(event.end_time);
    return start.endsWith('T00:00') && end.endsWith('T00:00');
}

function getDefaultForm(options) {
    const now = options.initialDate ? new Date(options.initialDate) : new Date();
    return {
        title: '', description: '',
        start_time: formatForInput(now),
        end_time: formatForInput(new Date(now.getTime() + 3600000)),
        recurrence: { frequency: 'none', interval: 1, end_date: null },
        reminder: [],
        tag: options.initialTag || null,
        location: '', all_day: false,
        is_private: false,
    };
}

/** Validates form and submits event with overlap checking. */

export async function validateAndSubmit(e, form, event, actions, onClose, setError, confirmFn, allEvents, forceSave = false) {
    if (e) e.preventDefault();
    const error = validateForm(form);
    if (error) {
        setError(error);
        return false;
    }

    const data = await buildEventData(form);
    const others = allEvents.filter(ev => ev.id !== (event?.id));
    if (!forceSave && !(await checkOverlapWithConfirm({ ...data, id: event?.id }, others, confirmFn))) return false;

    return await submitEvent(event, data, actions, onClose, setError, confirmFn);
}

function validateForm(form) {
    if (!form.title.trim()) return 'Title is required';
    return validateDateRange(form.start_time, form.end_time);
}

async function submitEvent(event, data, actions, onClose, setError, confirmFn) {
    try {
        await saveEvent(event, data, actions, confirmFn);
        onClose();
        return true;
    } catch (err) {
        setError(err.message);
        return false;
    }
}

async function saveEvent(event, data, actions, confirmFn) {
    if (!event?.id) {
        await actions.addEvent(data);
    } else if (hasRecurrence(event)) {
        await handleRecurringEdit(event, data, actions, confirmFn);
    } else {
        await actions.editEvent(extractBaseEventId(event.id, event), data);
    }
}

async function handleRecurringEdit(event, data, actions, confirmFn) {
    const choice = await confirmFn({
        title: "Recurring Event",
        message: "This is a recurring event. How would you like to edit it?",
        confirmText: "Edit ALL occurrences",
        cancelText: "Edit ONLY this occurrence"
    });
    const baseId = extractBaseEventId(event.id, event);

    if (choice) {
        await actions.editEvent(baseId, data);
    } else {
        await editSingleOccurrence(event, data, actions, baseId);
    }
}

async function editSingleOccurrence(event, data, actions, baseId) {
    const originalDateStr = new Date(event.start_time).toISOString().slice(0, 10);
    const singleEventData = { ...data };
    delete singleEventData.recurrence_rule;
    await actions.addException(baseId, originalDateStr);
    await actions.addEvent(singleEventData);
}

/** Deletes an event (including all recurring instances). */

export async function executeDelete(event, actions) {
    const baseId = extractBaseEventId(event.id, event);
    await actions.removeEvent(baseId);
}

/** Deletes a single occurrence of a recurring event by adding an exception. */

export async function deleteRecurrenceOccurrence(event, actions) {
    const baseId = extractBaseEventId(event.id, event);
    const dateStr = new Date(event.start_time).toISOString().slice(0, 10);
    await actions.addException(baseId, dateStr);
}

export function isRecurringEvent(event) {
    return hasRecurrence(event);
}

async function fetchLocationCoords(location) {
    if (!location || !location.trim()) return null;
    const coords = await geocodeAddress(location);
    return coords ? { lat: coords.latitude, lon: coords.longitude, valid: true } : { valid: false };
}
async function buildEventData(form) {
    const data = buildBaseEventData(form);
    const loc = await fetchLocationCoords(form.location);
    if (loc) {
        data.location_latitude = loc.lat;
        data.location_longitude = loc.lon;
        data.location_validated = loc.valid;
    }
    const { frequency: f, interval: i, end_date: e } = form.recurrence || {};
    data.recurrence_rule = (f && f !== 'none') ? { frequency: f, interval: parseInt(i) || 1, end_date: e || null } : null;
    return data;
}

function buildBaseEventData(form) {
    return {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        location: form.location || '',
        tag: form.tag || null,
        reminder_minutes: form.reminder,
        all_day: form.all_day,
        is_private: form.is_private ?? false,
    };
}

function formatForInput(d) {
    return formatForDateTimeInput(d);
}
