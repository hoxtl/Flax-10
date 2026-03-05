import { useTimer } from './useTimer';
import { useState, useEffect } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from '../utils/timerUtils';
import { useNotify } from '../../Notifications/hooks/useNotify';

export function useTimerLogic(activeTaskId, setActiveTaskId, activeTaskMeta) {
  const t = useTimer();
  const [task, setTask] = useState('');
  const notify = useNotify();
  const { modal, setModal, startNext, resetBlockId, endEarly } = useTimerFlow({ ...t, task }, notify);
  const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId, endEarly);
  const ot = t.timeLeft <= 0;

  /* When navigating from a task card "Play", pre-fill the task input from context */
  useEffect(() => {
    if (activeTaskMeta?.title != null && activeTaskMeta.title !== '') {
      setTask(activeTaskMeta.title);
    }
  }, [activeTaskMeta?.title]);

  return {
    ...t, task, setTask, modal, setModal, handlers, progress: getProgress(t),
    isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot
  };
}