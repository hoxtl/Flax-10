/*
 * Keeps timer popup auto-start side effects isolated.
 */

import { useEffect } from 'react';
import { AUTOSTART_KEY } from '../utils/presetUtils';

function shouldAutoStartBreak(modal) {
  return modal === 'break' && localStorage.getItem(AUTOSTART_KEY) === 'true';
}

function shouldFinishAutoBreak(t) {
  return t.modal === 'autoBreak' && t.isActive && t.timeLeft <= 0;
}

export function useTimerPopupEffects(t) {
  useEffect(() => {
    if (!shouldAutoStartBreak(t.modal)) return;
    const id = setTimeout(() => t.handlers.break(), 2000);
    return () => clearTimeout(id);
  }, [t.modal, t.handlers]);

  useEffect(() => {
    if (!shouldFinishAutoBreak(t)) return;
    const id = setTimeout(() => t.handlers.autoBreakDone(), 250);
    return () => clearTimeout(id);
  }, [t]);
}
