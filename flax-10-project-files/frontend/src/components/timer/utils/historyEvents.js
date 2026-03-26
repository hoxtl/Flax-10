/*
 * Shared timer history event names and listener helpers.
 */

export const TIMER_HISTORY_EVENTS = ["timerHistoryUpdated", "historyCleared"];

export function listenToTimerHistoryEvents(refresh) {
  TIMER_HISTORY_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));
  return () => removeTimerHistoryListeners(refresh);
}

export function removeTimerHistoryListeners(refresh) {
  TIMER_HISTORY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
}

export function dispatchTimerHistoryCleared() {
  window.dispatchEvent(new Event("historyCleared"));
}
