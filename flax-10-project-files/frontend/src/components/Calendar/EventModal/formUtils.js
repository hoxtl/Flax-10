/*
    This file is for the form utils.
    It is used to get the initial form for the event modal.
    It is also used to validate and submit the form.
    It is also used to confirm the deletion of an event.
*/

/*
    This function is used to get the initial form for the event modal.
*/
export function getInitialForm(event) {
    if (event) return {
        title: event.title || '',
        description: event.description || '',
        start_time: formatForInput(event.start_time),
        end_time: formatForInput(event.end_time),
    };
    const now = new Date();
    const later = new Date(now.getTime() + 3600000); // 1 hour
    return { title: '', description: '', start_time: formatForInput(now), end_time: formatForInput(later) };
}

/*
    This function is used to validate and submit the form.
*/
export async function validateAndSubmit(e, form, event, actions, onClose, setError) {
    e.preventDefault();
    if (new Date(form.start_time) >= new Date(form.end_time)) return setError('Start must be before end');
    if (!form.title.trim()) return setError('Title is required');

    try {
        const data = buildEventData(form);
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
    return {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
    };
}

/*
    This function is used to format the date for the input.
*/
function formatForInput(d) {
    return (d ? (typeof d === 'string' ? new Date(d) : d) : new Date()).toISOString().slice(0, 16);
}
