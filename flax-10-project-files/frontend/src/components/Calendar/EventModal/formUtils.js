/*
    This file is for the form utils.
    It is used to get the initial form for the event modal.
    It is also used to validate and submit the form.
    It is also used to confirm the deletion of an event.
*/

import { checkOverlapWithConfirm } from '../../../utils/overlapUtils';

function checkOverlap(event, allEvents) {
    const others = allEvents.filter(e => e.id !== event.id);
    return checkOverlapWithConfirm(event, others);
}

/*
    This function is used to get the initial form for the event modal.
*/
export function getInitialForm(event) {
    if (event) return {
        title: event.title || '',
        description: event.description || '',
        start_time: formatForInput(event.start_time),
        end_time: formatForInput(event.end_time),
        recurrence: event.recurrence_details?.frequency || 'none',
    };
    const now = new Date();
    const later = new Date(now.getTime() + 3600000);
    return { title: '', description: '', start_time: formatForInput(now), end_time: formatForInput(later), recurrence: 'none' };
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

/*
    This function is used to build the event data.
*/
function buildEventData(form) {
    const data = {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
    };
    if (form.recurrence && form.recurrence !== 'none') {
        data.recurrence_rule = { frequency: form.recurrence, interval: 1 };
    }
    return data;
}

/*
    This function is used to format the date for the input.
*/
function formatForInput(d) {
    return (d ? (typeof d === 'string' ? new Date(d) : d) : new Date()).toISOString().slice(0, 16);
}
