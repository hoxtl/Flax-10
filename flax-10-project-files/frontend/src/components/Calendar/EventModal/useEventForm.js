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
import { useToast } from '../../../context/ToastContext';

async function fetchSleepSettings() {
  try {
    const data = await getUserSettings();
    return { sleepTime: data?.sleep_time?.slice(0, 5) || '23:00', wakeTime: data?.wake_time?.slice(0, 5) || '07:00' };
  } catch {
    return { sleepTime: '23:00', wakeTime: '07:00' };
  }
}

function useFormHandlers(state, event, onClose, options, actions, confirmFn, events, toast) {
  const doSubmit = async (e, skipOverlap) => {
    const saved = await validateAndSubmit(e, state.form, event, actions, onClose, state.setError, confirmFn, events, skipOverlap);
    if (saved && typeof toast === 'function') {
      toast(event?.id ? 'Event updated' : 'Event saved', { variant: 'success' });
    }
    return saved;
  };

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
  const toast = useToast();
  const sleepSettings = useSleepSettingsLoader();
  const state = { ...useFormState(event, options), sleepSettings };
  const handlers = useFormHandlers(state, event, onClose, options, actions, confirmFn, calendarContext?.events || [], toast);
  return { form: state.form, setForm: state.setForm, error: state.error, sleepWarning: state.sleepWarning, sleepSettings, overlapWarning: state.overlapWarning, isEditing: !!event?.id, ...handlers, event };
}
