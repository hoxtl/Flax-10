/*
    This file is used to handle the form logic for the event modal.
*/

import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useEventActions } from "../../../hooks/useCalendarEvents";
import { getInitialForm, validateAndSubmit, confirmDelete } from "../../../utils/formUtils";

export function useEventForm(event, onClose, options = {}) {
    const { events } = useCalendar();
    const actions = useEventActions();
    const [form, setForm] = useState(() => getInitialForm(event, options));
    const [error, setError] = useState('');
    const [overlapWarning, setOverlapWarning] = useState(null);

    useEffect(() => setForm(getInitialForm(event, options)), [event, options.initialTag, options.initialDate]);

    const handleSubmit = (e) => validateAndSubmit(e, form, event, actions, onClose, setError, setOverlapWarning, events, false);
    const handleConfirmSave = () => validateAndSubmit(null, form, event, actions, onClose, setError, setOverlapWarning, events, true);
    const handleCancelSave = () => setOverlapWarning(null);

    const handleDelete = () => confirmDelete(event, actions, onClose);

    return { form, setForm, error, overlapWarning, isEditing: !!event?.id, handleSubmit, handleConfirmSave, handleCancelSave, handleDelete };
}
