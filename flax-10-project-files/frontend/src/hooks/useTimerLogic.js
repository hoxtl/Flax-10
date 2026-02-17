import { useTimer } from './useTimer';
import { useState } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from './timerUtils';

export function useTimerLogic() {
    const t = useTimer();
    const [task, setTask] = useState('');
    // Combine task with timer state for flow hook
    const timerWithTask = { ...t, task };

    const { modal, setModal, startNext, resetBlockId } = useTimerFlow(timerWithTask);
    const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId);
    const ot = t.timeLeft <= 0;

    /** Returns composite timer state, derived boolean flags, and event handlers */
    return {
        ...t, task, setTask, modal, handlers, progress: getProgress(t),
        isOvertime: t.mode === 'work' && ot, isBreakOvertime: t.mode === 'break' && ot
    };
}
