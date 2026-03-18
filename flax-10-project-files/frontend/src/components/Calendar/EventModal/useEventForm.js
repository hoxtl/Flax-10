import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { useEventActions } from '../hooks/useCalendarEvents';
import { getInitialForm, validateAndSubmit } from '../utils/formUtils';
import { getUserSettings } from '../../../api/userService';
import { isDuringSleepWindow } from '../../Settings/hooks/useSleepWarning';
import { useToast } from '../../../context/ToastContext';

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
    const confirmFn = useConfirm();
    const actions = useEventActions();
    const toast = useToast();
    const [form, setForm] = useState(() => getInitialForm(event, options));
    const [error, setError] = useState('');
    const [sleepWarning, setSleepWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(null);
    const [sleepSettings, setSleepSettings] = useState(null);
    const [overlapWarning, setOverlapWarning] = useState(null);

    useEffect(() => setForm(getInitialForm(event, options)), [event, options.initialTag, options.initialDate]);
    useEffect(() => { fetchSleepSettings().then(setSleepSettings); }, []);

    const doSubmit = async (e, skipOverlap = false) => {
        const saved = await validateAndSubmit(
            e,
            form,
            event,
            actions,
            onClose,
            setError,
            confirmFn,
            calendarContext?.events || [],
            skipOverlap,
        );
        if (saved && typeof toast === 'function') {
            toast(event?.id ? 'Event updated' : 'Event saved', { variant: 'success' });
        }
        return saved;
    };

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

    const handleConfirmSave = () =>
        validateAndSubmit(
            null,
            form,
            event,
            actions,
            onClose,
            setError,
            setOverlapWarning,
            calendarContext?.events || [],
            true
        );
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
        form,
        setForm,
        error,
        sleepWarning,
        sleepSettings,
        overlapWarning,
        isEditing: !!event?.id,
        handleSubmit,
        handleConfirmSleep,
        handleCancelSleep,
        handleConfirmSave,
        handleCancelSave,
        event
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
