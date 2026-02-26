import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useEventActions } from '../hooks/useCalendarEvents';
import { getInitialForm, validateAndSubmit, executeDelete } from '../utils/formUtils';

export function useEventForm(event, onClose, options = {}) {
    const calendarContext = useCalendar();
    const actions = useEventActions();
    const [form, setForm] = useState(() => getInitialForm(event, options));
    const [error, setError] = useState('');
    const [overlapWarning, setOverlapWarning] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => setForm(getInitialForm(event, options)), [event, options.initialTag, options.initialDate]);

    const handleSubmit = options.customSubmit
        ? createCustomSubmitHandler(form, options.customSubmit, onClose, setError)
        : (e) => validateAndSubmit(e, form, event, actions, onClose, setError, setOverlapWarning, calendarContext?.events || [], false);
    const handleConfirmSave = () => validateAndSubmit(null, form, event, actions, onClose, setError, setOverlapWarning, calendarContext?.events || [], true);
    const handleCancelSave = () => setOverlapWarning(null);
    const handleDeleteRequest = () => setShowDeleteConfirm(true);
    const handleDeleteCancel = () => setShowDeleteConfirm(false);
    const handleDeleteConfirm = async () => {
        if (options.customSubmit) { options.customSubmit({ ...form, _delete: true }); onClose(); }
        else await executeDelete(event, actions, onClose);
    };

    return {
        form, setForm, error, overlapWarning, isEditing: !!event?.id,
        handleSubmit, handleConfirmSave, handleCancelSave,
        handleDelete: handleDeleteRequest, showDeleteConfirm, handleDeleteCancel, handleDeleteConfirm, event
    };
}

function createCustomSubmitHandler(form, customSubmit, onClose, setError) {
    return (e) => {
        e?.preventDefault();
        if (!form.title?.trim()) { setError('Title is required'); return; }
        customSubmit(form);
        onClose();
    };
}
