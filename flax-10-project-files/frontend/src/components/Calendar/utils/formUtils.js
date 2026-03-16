import { checkOverlapWithConfirm } from './overlapUtils';
import { extractBaseEventId, hasRecurrence } from './eventUtils';
import { validateDateRange } from './dateValidation';

export function getInitialForm(event, options = {}) {
    if (event) return getFormFromEvent(event, options);
    return getDefaultForm(options);
}

function getFormFromEvent(event, options = {}) {
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

export async function validateAndSubmit(e, form, event, actions, onClose, setError, confirmFn, allEvents, forceSave = false) {
    if (e) e.preventDefault();
    const error = validateForm(form);
    if (error) return setError(error);

    const data = buildEventData(form);
    const others = allEvents.filter(ev => ev.id !== (event?.id));
    if (!forceSave && !(await checkOverlapWithConfirm({ ...data, id: event?.id }, others, confirmFn))) return;

    await submitEvent(event, data, actions, onClose, setError, confirmFn);
}

function validateForm(form) {
    if (!form.title.trim()) return 'Title is required';
    return validateDateRange(form.start_time, form.end_time);
}

async function submitEvent(event, data, actions, onClose, setError, confirmFn) {
    try {
        await saveEvent(event, data, actions, confirmFn);
        onClose();
    } catch (err) {
        setError(err.message);
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

export async function executeDelete(event, actions) {
    const baseId = extractBaseEventId(event.id, event);
    await actions.removeEvent(baseId);
}

export async function deleteRecurrenceOccurrence(event, actions) {
    const baseId = extractBaseEventId(event.id, event);
    const dateStr = new Date(event.start_time).toISOString().slice(0, 10);
    await actions.addException(baseId, dateStr);
}

export function isRecurringEvent(event) {
    return hasRecurrence(event);
}

function buildEventData(form) {
    const data = buildBaseEventData(form);
    const { frequency, interval, end_date } = form.recurrence || {};
    if (frequency && frequency !== 'none') {
        data.recurrence_rule = { frequency, interval: parseInt(interval) || 1, end_date: end_date || null };
    } else {
        data.recurrence_rule = null;
    }
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
    if (!d) return new Date().toISOString().slice(0, 16);
    const date = typeof d === 'string' ? new Date(d) : d;
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}
