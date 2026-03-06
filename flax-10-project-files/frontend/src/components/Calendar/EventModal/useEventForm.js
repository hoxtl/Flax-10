import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useEventActions } from '../hooks/useCalendarEvents';
import { getInitialForm, validateAndSubmit } from '../utils/formUtils';
import { getUserSettings } from '../../../api/userService';
import { isDuringSleepWindow } from '../../Settings/hooks/useSleepWarning';

async function fetchSleepSettings() {
    try {
        const data = await getUserSettings();
        return { sleepTime: data?.sleep_time?.slice(0, 5) || '23:00', wakeTime: data?.wake_time?.slice(0, 5) || '07:00' };
    } catch {
        return { sleepTime: '23:00', wakeTime: '07:00' };
    }
}

export function useEventForm(event, onClose, options = {}) {
    const calendarContext = useCalendar();
    const actions = useEventActions();
    const [form, setForm] = useState(() => getInitialForm(event, options));
    const [error, setError] = useState('');
    const [overlapWarning, setOverlapWarning] = useState(null);
    const [sleepWarning, setSleepWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(null);
    const [sleepSettings, setSleepSettings] = useState(null);

    useEffect(() => setForm(getInitialForm(event, options)), [event, options.initialTag, options.initialDate]);
    useEffect(() => { fetchSleepSettings().then(setSleepSettings); }, []);

    const doSubmit = (e, skipOverlap = false) =>
        validateAndSubmit(e, form, event, actions, onClose, setError, setOverlapWarning, calendarContext?.events || [], skipOverlap);

    const handleSubmit = options.customSubmit
        ? createCustomSubmitHandler(form, options.customSubmit, onClose, setError)
        : (e) => {
            e?.preventDefault();
            if (sleepSettings && form.start_time) {
                const date = new Date(form.start_time);
                if (isDuringSleepWindow(sleepSettings.sleepTime, sleepSettings.wakeTime, date)) {
                    setPendingSubmit(() => () => doSubmit(null, false));
                    setSleepWarning(true);
                    return;
                }
            }
            doSubmit(e, false);
        };

    const handleConfirmSave = () => validateAndSubmit(null, form, event, actions, onClose, setError, setOverlapWarning, calendarContext?.events || [], true);
    const handleCancelSave = () => setOverlapWarning(null);

    const handleConfirmSleep = () => {
        setSleepWarning(false);
        pendingSubmit?.();
        setPendingSubmit(null);
    };
    const handleCancelSleep = () => {
        setSleepWarning(false);
        setPendingSubmit(null);
    };

    return {
        form, setForm, error, overlapWarning, sleepWarning,
        sleepSettings, isEditing: !!event?.id,
        handleSubmit, handleConfirmSave, handleCancelSave,
        handleConfirmSleep, handleCancelSleep, event
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
