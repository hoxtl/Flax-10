import { checkOverlapWithConfirm } from './overlapUtils';
import { extractBaseEventId, hasRecurrence } from './eventUtils';

function checkOverlap(event, allEvents) {
    const others = allEvents.filter(e => e.id !== event.id);
    return checkOverlapWithConfirm(event, others);
}

export function getInitialForm(event, options = {}) {
    if (event) return getFormFromEvent(event);
    return getDefaultForm(options);
}

function getFormFromEvent(event) {
    return {
        title: event.title || '',
        description: event.description || '',
        start_time: formatForInput(event.start_time),
        end_time: formatForInput(event.end_time),
        recurrence: event.recurrence_details?.frequency || 'none',
        tag: event.tag_name || event.tag_details?.name || '',
        location: event.locution || event.location || '',
        all_day: event.all_day || event.is_all_day || event.allDay || (
            formatForInput(event.start_time).endsWith('T00:00') &&
            formatForInput(event.end_time).endsWith('T00:00')
        ),
    };
}

function getDefaultForm(options) {
    const now = options.initialDate ? new Date(options.initialDate) : new Date();
    const later = new Date(now.getTime() + 3600000);
    return {
        title: '',
        description: '',
        start_time: formatForInput(now),
        end_time: formatForInput(later),
        recurrence: 'none',
        tag: options.initialTag || null,
        location: '',
        all_day: false,
    };
}

export async function validateAndSubmit(e, form, event, actions, onClose, setError, allEvents) {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) return setError(validationError);

    const data = buildEventData(form);
    if (!checkOverlap({ ...data, id: event?.id }, allEvents)) return;

    await submitEvent(event, data, actions, onClose, setError);
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
    const choice = window.confirm(
        'This is a recurring event.\n\nOK = Edit ALL occurrences\nCancel = Edit only this occurrence'
    );
    const baseId = extractBaseEventId(event.id);
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
    return {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        location: form.location || '',
        tag: form.tag || null,
        all_day: form.all_day,
    };
}

function addRecurrenceIfNeeded(data, form) {
    if (form.recurrence && form.recurrence !== 'none') {
        data.recurrence_rule = { frequency: form.recurrence, interval: 1 };
    } else {
        data.recurrence_rule = null;
    }
}

function formatForInput(d) {
    const date = d ? (typeof d === 'string' ? new Date(d) : d) : new Date();
    return toLocalISOString(date);
}

function toLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
