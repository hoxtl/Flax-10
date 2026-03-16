/**
 * useEventForm - Form state management for event creation and editing.
 * Handles validation, sleep time warnings, and overlap detection.
 */
import { useState, useEffect } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { useConfirm } from "../../../context/ConfirmContext";
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

function useSleepSettingsLoader() {
  const [sleepSettings, setSleepSettings] = useState(null);
  useEffect(() => { fetchSleepSettings().then(setSleepSettings); }, []);
  return sleepSettings;
}

function createCustomSubmitHandler(form, customSubmit, onClose, setError) {
  return (e) => {
    e?.preventDefault();
    if (!form.title?.trim()) { setError('Title is required'); return; }
    customSubmit(form);
    onClose();
  };
}

function useFormState(event, options) {
  const [form, setForm] = useState(() => getInitialForm(event, options));
  const [error, setError] = useState('');
  const [sleepWarning, setSleepWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState(null);
  useEffect(() => setForm(getInitialForm(event, options)), [event, options.initialTag, options.initialDate]);
  return { form, setForm, error, setError, sleepWarning, setSleepWarning, pendingSubmit, setPendingSubmit, overlapWarning, setOverlapWarning };
}

function isSleepConflict(sleepSettings, form) {
  if (!sleepSettings || !form.start_time) return false;
  const date = new Date(form.start_time);
  return isDuringSleepWindow(sleepSettings.sleepTime, sleepSettings.wakeTime, date);
}

function checkSleepWindow(sleepSettings, form, doSubmit, setPendingSubmit, setSleepWarning, e) {
  e?.preventDefault();
  if (isSleepConflict(sleepSettings, form)) {
    setPendingSubmit(() => () => doSubmit(null, false));
    setSleepWarning(true);
    return;
  }
  doSubmit(e, false);
}

function useFormHandlers(state, event, onClose, options, actions, confirmFn, events) {
  const doSubmit = (e, skipOverlap) => validateAndSubmit(e, state.form, event, actions, onClose, state.setError, confirmFn, events, skipOverlap);
  const checkSleepAndSubmit = (e) => checkSleepWindow(state.sleepSettings, state.form, doSubmit, state.setPendingSubmit, state.setSleepWarning, e);
  const handleSubmit = options.customSubmit ? createCustomSubmitHandler(state.form, options.customSubmit, onClose, state.setError) : checkSleepAndSubmit;
  const handleConfirmSave = () => validateAndSubmit(null, state.form, event, actions, onClose, state.setError, state.setOverlapWarning, events, true);
  const handleCancelSave = () => state.setOverlapWarning(null);
  const handleConfirmSleep = () => { state.setSleepWarning(false); state.pendingSubmit?.(); state.setPendingSubmit(null); };
  const handleCancelSleep = () => { state.setSleepWarning(false); state.setPendingSubmit(null); };
  return { handleSubmit, handleConfirmSave, handleCancelSave, handleConfirmSleep, handleCancelSleep };
}

/** Hook for managing event form state and submission. */
export function useEventForm(event, onClose, options = {}) {
  const calendarContext = useCalendar();
  const confirmFn = useConfirm();
  const actions = useEventActions();
  const sleepSettings = useSleepSettingsLoader();
  const state = { ...useFormState(event, options), sleepSettings };
  const handlers = useFormHandlers(state, event, onClose, options, actions, confirmFn, calendarContext?.events || []);
  return { form: state.form, setForm: state.setForm, error: state.error, sleepWarning: state.sleepWarning, sleepSettings, overlapWarning: state.overlapWarning, isEditing: !!event?.id, ...handlers, event };
}
