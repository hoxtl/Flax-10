/*
    This file is for the form utils.
    It is used to get the initial form for the event modal.
    It is also used to validate and submit the form.
    It is also used to confirm the deletion of an event.
*/

import { checkOverlapWithConfirm } from './overlapUtils';

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
        tag: event.tag || null,
        location: event.location || '',
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
    };
}

/*
    This function is used to validate and submit the form.
*/
export async function validateAndSubmit(e, form, event, actions, onClose, setError, allEvents) {
    e.preventDefault();
    if (new Date(form.start_time) >= new Date(form.end_time)) return setError('Start must be before end');
    if (!form.title.trim()) return setError('Title is required');
    const data = buildEventData(form);
    const testEvent = { ...data, id: event?.id };
    if (!checkOverlap(testEvent, allEvents)) return;
    try {
        event?.id ? await actions.editEvent(event.id, data) : await actions.addEvent(data);
        onClose();
    } catch (err) {
        setError(err.message);
    }
}

/*
    This function is used to confirm the deletion of an event.
*/
export function confirmDelete(event, actions, onClose) {
    if (confirm('Delete this event?')) {
        actions.removeEvent(event.id);
        onClose();
    }
}

function buildEventData(form) {
    const data = buildBaseEventData(form);
    addRecurrenceIfNeeded(data, form);
    return data;
}

function buildBaseEventData(form) {
    const data = {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        location: form.location || '',
    };
    if (form.tag && typeof form.tag === 'number') {
        data.tag = form.tag;
    }
    return data;
}

function addRecurrenceIfNeeded(data, form) {
    if (form.recurrence && form.recurrence !== 'none') {
        data.recurrence_rule = { frequency: form.recurrence, interval: 1 };
    }
}

/*
    This function is used to format the date for the input.
*/
function formatForInput(d) {
    return (d ? (typeof d === 'string' ? new Date(d) : d) : new Date()).toISOString().slice(0, 16);
}
