import { useTimer } from './useTimer';
import { useState, useCallback } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from '../utils/timerUtils';
import { useNotify } from '../../Notifications/hooks/useNotify';

const TIMER_TASK_ID_KEY = 'timerTaskId';

export function useTimerLogic() {
  const t = useTimer();
  const [task, setTask] = useState('');
  const notify = useNotify();
  const { modal, setModal, startNext, resetBlockId } = useTimerFlow({ ...t, task }, notify);
  const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId);
  const ot = t.timeLeft <= 0;

  const setActiveTaskId = useCallback((id, opts) => {
    try {
      if (id != null) sessionStorage.setItem(TIMER_TASK_ID_KEY, String(id));
      else sessionStorage.removeItem(TIMER_TASK_ID_KEY);
      if (opts?.title != null) setTask(opts.title);
    } catch (_) {}
  }, []);

  return {
    ...t, task, setTask, setActiveTaskId, modal, handlers, progress: getProgress(t),
    isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot };
}