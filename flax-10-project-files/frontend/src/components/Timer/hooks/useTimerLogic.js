import { useTimer } from './useTimer';
import { useState, useMemo } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from '../utils/timerUtils';
import { useNotify } from '../../Notifications/hooks/useNotify';

function useTaskIdFromUrl() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('taskId') || null;
    }, []);
}

export function useTimerLogic() {
    const t = useTimer();
    const [task, setTask] = useState('');
    const taskId = useTaskIdFromUrl();
    const notify = useNotify();
    const { modal, setModal, startNext, resetBlockId } = useTimerFlow(
        { ...t, task, taskId },
        notify
    );
    const handlers = useTimerHandlers(t, modal, setModal, startNext, resetBlockId);
    const ot = t.timeLeft <= 0;
    return {
        ...t, task, setTask, taskId, modal, handlers, progress: getProgress(t),
        isOvertime: t.mode === 'work' && ot,
        isBreakOvertime: t.mode === 'break' && ot,
    };
}