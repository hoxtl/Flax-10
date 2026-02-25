import { useTimer } from './useTimer';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from '../utils/timerUtils';
import { useNotify } from '../../Notifications/hooks/useNotify';

function useTaskIdFromUrl() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('taskId');
        if (fromUrl) return fromUrl;
        try {
            const fromStorage = sessionStorage.getItem('timerTaskId');
            if (fromStorage) {
                sessionStorage.removeItem('timerTaskId');
                return fromStorage;
            }
        } catch (_) {}
        return null;
    }, []);
}

export function useTimerLogic() {
    const t = useTimer();
    const [task, setTaskState] = useState('');
    const [selectedTaskColor, setSelectedTaskColor] = useState(null);
    const taskId = useTaskIdFromUrl();
    const notify = useNotify();

    const setTask = useCallback((v) => {
        setTaskState(v);
        if (!v) setSelectedTaskColor(null);
    }, []);

    useEffect(() => {
        if (!taskId) return;
        import('../../../api/taskService').then(({ getTask }) => {
            getTask(taskId)
                .then((taskData) => {
                    if (taskData && taskData.title) {
                        setTask(taskData.title);
                        const mins = ((taskData.estimated_blocks || 1) * 25);
                        t.updateTime('work', mins);
                        t.setTimeLeft(mins * 60);
                        t.setIsActive(true);
                    }
                })
                .catch(() => {});
        });
    }, [taskId, setTask]);
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
        selectedTaskColor,
        setSelectedTaskColor,
    };
}