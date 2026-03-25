/*
 * Warns before running actions during a user's sleep window.
 */

import { doesEventOverlapSleepWindow, isDuringSleepWindow } from "../sleep/sleepWarningUtils";
import useSleepWarningState from "./useSleepWarningState";

export { doesEventOverlapSleepWindow, isDuringSleepWindow };

function getSleepWindow(settings) {
  return {
    sleepTime: settings?.sleep_time || "23:00",
    wakeTime: settings?.wake_time || "07:00",
  };
}

export function useSleepWarning(settings) {
  const state = useSleepWarningState();
  const { sleepTime, wakeTime } = getSleepWindow(settings);
  const checkSleepAndRun = (taskDate, action) => handleSleepAction(taskDate, action, sleepTime, wakeTime, state);
  const sleepWarningProps = createSleepWarningProps(state, sleepTime, wakeTime);
  return { sleepWarning: state.sleepWarning, checkSleepAndRun, sleepWarningProps };
}

function handleSleepAction(taskDate, action, sleepTime, wakeTime, state) {
  const date = taskDate ? new Date(taskDate) : new Date();
  if (!isDuringSleepWindow(sleepTime, wakeTime, date)) return action();
  state.setPendingAction(() => action);
  state.setSleepWarning(true);
}

function clearSleepWarning(state) {
  state.setSleepWarning(false);
  state.setPendingAction(null);
}

function createSleepWarningProps(state, sleepTime, wakeTime) {
  return {
    sleepTime,
    wakeTime,
    onConfirm: () => {
      state.pendingAction?.();
      clearSleepWarning(state);
    },
    onCancel: () => clearSleepWarning(state),
  };
}
