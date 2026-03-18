import { useState, useRef, useCallback } from 'react';
import { useCompletionCheck } from '../utils/timerUtils';
import { saveSession } from '../utils/historyUtils';
import { logTaskTime } from '../../../api/taskService';
import { playCompletionChime } from '../../../lib/sounds';

export function useTimerFlow(t, notify) {
    const [modal, setModal] = useState(null);
    const [distractionCount, setDistractionCount] = useState(0);
    const studyBlockId = useRef(Date.now());
    const {activeTaskId} = t;
    const AUTO_BREAK_SECONDS = 5 * 60;

    const resetDistractions = useCallback(() => setDistractionCount(0), []);
    const addDistraction = useCallback(() => setDistractionCount((n) => n + 1), []);

    const resetTimerWithState = useCallback(() => {
        setModal(null);
        resetDistractions();
        t.resetTimer();
    }, [t, resetDistractions]);

    const save = useCallback((st = 'Completed') => {
        const c = st === 'Completed' ? t.completedSessions + 1 : t.completedSessions;
        const moduleCode = t.activeTaskMeta?.moduleCode;
        const task = t.task ? `${t.task}${moduleCode ? ` - ${moduleCode}` : ''}` : '';
        saveSession(t.totalWork, t.totalBreak, c, studyBlockId.current, task, t.totalPaused, st, distractionCount);
    }, [t.totalWork, t.totalBreak, t.completedSessions, t.task, t.totalPaused, distractionCount, t.activeTaskMeta?.moduleCode]);

    const startNext = useCallback(() => {
        save('Completed');
        if (activeTaskId) logTaskTime(activeTaskId, Math.round(t.totalWork/60));
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);
        setDistractionCount(0);
        t.updateSettings({ totalWork: 0, totalBreak: 0, totalPaused: 0 });
        if (next >= t.targetSessions) {
            studyBlockId.current = Date.now(); t.setIsActive(false); t.setTimeLeft(t.workTime * 60);
            return setModal('goal');
        }
        t.setMode('work'); t.setTimeLeft(t.workTime * 60); t.setIsActive(modal !== 'break');
    }, [save, activeTaskId, t.totalWork, t.completedSessions, t.targetSessions, modal, t.setCompletedSessions, t.updateSettings, t.setMode, t.setTimeLeft, t.setIsActive, t.workTime, setDistractionCount]);

    const endEarly = useCallback(() => {
        if (t.totalWork > 0) {
            save('Incomplete');
            if (activeTaskId) logTaskTime(activeTaskId, Math.round(t.totalWork / 60));
        }
        resetTimerWithState();
        setModal(null);
        studyBlockId.current = Date.now();
    }, [save, activeTaskId, t.totalWork, resetTimerWithState, setModal]);

    const onWorkComplete = useCallback(() => {
        playCompletionChime(0.3);
        setModal('autoBreak');
        setDistractionCount((n) => n);
        t.setMode('break');
        t.setTimeLeft(AUTO_BREAK_SECONDS);
        t.setIsActive(true);
    }, [t]);

    const autoBreakDone = useCallback(() => {
        setDistractionCount(0);
        if (modal !== 'autoBreak') return;
        return startNext();
    }, [modal, startNext]);

    useCompletionCheck(t, startNext, notify, onWorkComplete);
    return {
        modal,
        setModal,
        startNext,
        endEarly,
        addDistraction,
        distractionCount,
        resetBlockId: useCallback(() => studyBlockId.current = Date.now(), []),
        autoBreakDone,
        resetTimer: resetTimerWithState,
    };
}
