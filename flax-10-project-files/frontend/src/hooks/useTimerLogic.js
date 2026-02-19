import { useTimer } from './useTimer';
import { useState } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from './timerUtils';

export function useTimerLogic() {
  const t = useTimer();
  const [task, setTask] = useState('');
  const { modal, setModal, startNext, resetBlockId } = useTimerFlow({ ...t, task });
  const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId);
  const ot = t.timeLeft <= 0;
  return {
    ...t, task, setTask, modal, handlers, progress: getProgress(t),
    isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot};}