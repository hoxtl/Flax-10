/*
 * Applies a suggested timer task stored in session storage.
 */

import { useEffect } from 'react';

function applySuggestedTask(t) {
  const suggested = sessionStorage.getItem('timerSuggestedTask');
  if (!suggested || typeof t.setTask !== 'function') return;
  t.setTask(suggested);
  sessionStorage.removeItem('timerSuggestedTask');
}

export function useSuggestedTimerTask(t) {
  useEffect(() => {
    try {
      applySuggestedTask(t);
    } catch {}
  }, [t]);
}
