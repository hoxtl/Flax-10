import { useState, useCallback } from 'react';

export function isDuringSleepWindow(sleepTime, wakeTime, date = new Date()) {
  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);

  const totalMins = date.getHours() * 60 + date.getMinutes();
  const sleepMins = sleepH * 60 + sleepM;
  const wakeMins = wakeH * 60 + wakeM;

  if (sleepMins > wakeMins) {
    return totalMins >= sleepMins || totalMins < wakeMins;
  }

  return totalMins >= sleepMins && totalMins < wakeMins;
}

export function useSleepWarning(settings) {
  const [sleepWarning, setSleepWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const sleepTime = settings?.sleep_time || '23:00';
  const wakeTime = settings?.wake_time || '07:00';

  const checkSleepAndRun = useCallback((taskDate, action) => {
    const date = taskDate ? new Date(taskDate) : new Date();

    if (isDuringSleepWindow(sleepTime, wakeTime, date)) {
      setPendingAction(() => action);
      setSleepWarning(true);
    } else {
      action();
    }
  }, [sleepTime, wakeTime]);

  const confirmDespiteWarning = useCallback(() => {
    pendingAction?.();
    setSleepWarning(false);
    setPendingAction(null);
  }, [pendingAction]);

  const dismissWarning = useCallback(() => {
    setSleepWarning(false);
    setPendingAction(null);
  }, []);

  return {
    sleepWarning,
    checkSleepAndRun,
    sleepWarningProps: {
      sleepTime,
      wakeTime,
      onConfirm: confirmDespiteWarning,
      onCancel: dismissWarning,
    },
  };
}
