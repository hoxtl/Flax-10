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
  const { modal, setModal, startNext, resetBlockId, endEarly } = useTimerFlow({ ...t, task, activeTaskId}, notify);
  const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId, endEarly);
  const ot = t.timeLeft <= 0;

  /* When navigating from a task card "Play", pre-fill the task input from context */
  useEffect(() => {
    if (activeTaskMeta?.title != null && activeTaskMeta.title !== '') {
      setTask(activeTaskMeta.title);
    }
  }, [activeTaskMeta?.title]);

  /* Map task estimated blocks into timer duration when launched from task play.
     1 block = 25m, rendered as one timer session with that full work duration. */
  useEffect(() => {
    const workMins = Number(activeTaskMeta?.estimatedWorkMinutes);
    const sessions = Number(activeTaskMeta?.estimatedSessionCount);
    const blocks = Number(activeTaskMeta?.estimatedBlocks);
    if (!Number.isFinite(workMins) || workMins <= 0) {
      if (!Number.isFinite(blocks) || blocks <= 0) return;
    }
    const mins = Number.isFinite(workMins) && workMins > 0 ? workMins : Math.max(25, blocks * 25);
    const targetSessions = Number.isFinite(sessions) && sessions > 0 ? sessions : 1;
    t.updateTime('sessions', targetSessions);
    t.updateTime('work', mins);
    t.setCompletedSessions(0);
    t.setMode('work');
    t.setTimeLeft(mins * 60);
  }, [activeTaskId, activeTaskMeta?.estimatedBlocks, activeTaskMeta?.estimatedSessionCount, activeTaskMeta?.estimatedWorkMinutes]);

  return {
    ...t, task, setTask, modal, setModal, handlers, progress: getProgress(t),
    isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot
  };
}
