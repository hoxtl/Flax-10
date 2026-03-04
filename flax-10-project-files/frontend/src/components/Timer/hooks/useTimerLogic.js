import { useTimer } from './useTimer';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';
import { getProgress } from '../utils/timerUtils';
import { useNotify } from '../../Notifications/hooks/useNotify';

function useTaskIdFromUrl() {
    return useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('taskId');
    }, []);
}

function useTaskMetaFromStorage() {
    return useMemo(() => {
        try {
            const id = sessionStorage.getItem('timerTaskId');
            const title = sessionStorage.getItem('timerTaskTitle');
            const categoryColor = sessionStorage.getItem('timerTaskCategoryColor');
            if (id) {
                sessionStorage.removeItem('timerTaskId');
                if (title) sessionStorage.removeItem('timerTaskTitle');
                if (categoryColor) sessionStorage.removeItem('timerTaskCategoryColor');
                return { id, title: title || null, categoryColor: categoryColor || null };
            }
        } catch (_) {}
        return null;
    }, []);
}

export function useTimerLogic(activeTaskIdFromContext, setActiveTaskIdFromContext, activeTaskMetaFromContext) {
    const t = useTimer();
    const [task, setTaskState] = useState('');
    const [selectedTaskColor, setSelectedTaskColor] = useState(null);
    const taskIdFromUrl = useTaskIdFromUrl();
    const metaFromStorage = useTaskMetaFromStorage();
    const taskId = activeTaskIdFromContext ?? taskIdFromUrl ?? (metaFromStorage?.id ?? null);
    const notify = useNotify();

    const setTask = useCallback((v) => {
        setTaskState(v);
        if (!v) setSelectedTaskColor(null);
    }, []);

    /* When coming from Task Card Play: use meta (title + categoryColor) immediately */
    useEffect(() => {
        if (activeTaskIdFromContext && activeTaskMetaFromContext?.title) {
            setTask(activeTaskMetaFromContext.title);
            if (activeTaskMetaFromContext.categoryColor) setSelectedTaskColor(activeTaskMetaFromContext.categoryColor);
        }
    }, [activeTaskIdFromContext, activeTaskMetaFromContext, setTask]);

    useEffect(() => {
        if (!taskId) return;
        const meta = activeTaskIdFromContext ? activeTaskMetaFromContext : metaFromStorage;
        if (meta?.title) {
            setTask(meta.title);
            if (meta.categoryColor) setSelectedTaskColor(meta.categoryColor);
        }
        import('../../../api/taskService').then(({ getTask }) => {
            getTask(taskId)
                .then((taskData) => {
                    if (taskData) {
                        if (!meta?.title && taskData.title) setTask(taskData.title);
                        const mins = ((taskData.estimated_blocks || 1) * 25);
                        t.updateTime('work', mins);
                        t.setTimeLeft(mins * 60);
                        if (taskData.task_list?.color) setSelectedTaskColor(taskData.task_list.color);
                    }
                    if (setActiveTaskIdFromContext) setActiveTaskIdFromContext(null);
                })
                .catch(() => {
                    if (setActiveTaskIdFromContext) setActiveTaskIdFromContext(null);
                });
        });
    }, [taskId, setTask, setActiveTaskIdFromContext, activeTaskIdFromContext, activeTaskMetaFromContext, metaFromStorage]);
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