import { findOverlappingEvents } from './overlapUtils';
import { extractBaseEventId, hasRecurrence } from './eventUtils';



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
        tag: event.tag || event.tag_details?.id || options.initialTag || null,
        location: event.locution || event.location || '',
        all_day: isAllDay(event),
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
    };
}

export async function validateAndSubmit(e, form, event, actions, onClose, setError, setOverlapWarning, allEvents, forceSave = false) {
    if (e) e.preventDefault();
    const error = validateForm(form);
    if (error) return setError(error);

    const data = buildEventData(form);
    if (!forceSave && hasOverlaps(data, event, allEvents, setOverlapWarning)) return;

    await submitEvent(event, data, actions, onClose, setError);
}

function hasOverlaps(data, event, allEvents, setOverlapWarning) {
    const others = allEvents.filter(e => e.id !== (event?.id));
    const overlapping = findOverlappingEvents({ ...data, id: event?.id }, others);

    if (overlapping.length > 0) {
        setOverlapWarning(overlapping);
        return true;
    }
    return false;
}

function validateForm(form) {
    if (new Date(form.start_time) >= new Date(form.end_time)) return 'Start must be before end';
    if (!form.title.trim()) return 'Title is required';
    return null;
}

async function submitEvent(event, data, actions, onClose, setError) {
    try {
        await saveEvent(event, data, actions);
        onClose();
    } catch (err) {
        setError(err.message);
    }
}

async function saveEvent(event, data, actions) {
    if (!event?.id) {
        await actions.addEvent(data);
    } else if (hasRecurrence(event)) {
        await handleRecurringEdit(event, data, actions);
    } else {
        await actions.editEvent(extractBaseEventId(event.id), data);
    }
}

async function handleRecurringEdit(event, data, actions) {
    const choice = confirmRecurringEdit();
    const baseId = extractBaseEventId(event.id);

    if (choice) {
        await actions.editEvent(baseId, data);
    } else {
        await editSingleOccurrence(event, data, actions, baseId);
    }
}

function confirmRecurringEdit() {
    return window.confirm(
        'This is a recurring event.\n\nOK = Edit ALL occurrences\nCancel = Edit only this occurrence'
    );
}

async function editSingleOccurrence(event, data, actions, baseId) {
    const originalDateStr = new Date(event.start_time).toISOString().slice(0, 10);
    const singleEventData = { ...data };
    delete singleEventData.recurrence_rule;
    await actions.addException(baseId, originalDateStr);
    await actions.addEvent(singleEventData);
}

export async function confirmDelete(event, actions, onClose) {
    if (hasRecurrence(event)) {
        await handleRecurringDelete(event, actions, onClose);
    } else {
        await handleSingleDelete(event, actions, onClose);
    }
}

async function handleRecurringDelete(event, actions, onClose) {
    const choice = window.confirm(
        'This is a recurring event.\n\nOK = Delete ALL occurrences\nCancel = Delete only this occurrence'
    );
    const baseId = extractBaseEventId(event.id);
    if (choice) {
        await actions.removeEvent(baseId);
    } else {
        const dateStr = new Date(event.start_time).toISOString().slice(0, 10);
        await actions.addException(baseId, dateStr);
    }
    onClose();
}

async function handleSingleDelete(event, actions, onClose) {
    if (!confirm('Delete this event?')) return;
    await actions.removeEvent(extractBaseEventId(event.id));
    onClose();
}

function buildEventData(form) {
    const data = buildBaseEventData(form);
    addRecurrenceIfNeeded(data, form);
    return data;
}

function buildBaseEventData(form) {
    const title = (form.title || "").trim();
    const isRoutineTitle = /^(breakfast|lunch|dinner|sleep|brunch|coffee|meal\s*prep)$/i.test(title);
    const tag = form.tag != null && form.tag !== "" ? form.tag : (isRoutineTitle ? "Routine" : null);
    return {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        location: form.location || "",
        tag,
        reminder_minutes: form.reminder,
        all_day: form.all_day,
    };
}

function addRecurrenceIfNeeded(data, form) {
    const { frequency, interval, end_date } = form.recurrence || {};
    if (frequency && frequency !== 'none') {
        data.recurrence_rule = { frequency, interval: parseInt(interval) || 1, end_date: end_date || null };
    } else {
        data.recurrence_rule = null;
    }
}

function formatForInput(d) {
    if (!d) return new Date().toISOString().slice(0, 16); // Fallback
    const date = typeof d === 'string' ? new Date(d) : d;
    // Adjust for timezone to ensure the input shows local time
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}
