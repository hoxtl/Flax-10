/*
    This file is used to handle the form logic for the event modal.
*/

import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useEventActions } from "../../../hooks/useCalendarEvents";
import { getInitialForm, validateAndSubmit, confirmDelete } from "./formUtils";

/*
    This function is used to handle the form logic for the event modal.
*/
export function useEventForm(event, onClose) {
    const { events } = useCalendar();
    const actions = useEventActions();
    const [form, setForm] = useState(() => getInitialForm(event));
    const [error, setError] = useState('');

    useEffect(() => setForm(getInitialForm(event)), [event]);

    const handleSubmit = (e) => validateAndSubmit(e, form, event, actions, onClose, setError, events);
    const handleDelete = () => confirmDelete(event, actions, onClose);

    return { form, setForm, error, isEditing: !!event?.id, handleSubmit, handleDelete };
}
