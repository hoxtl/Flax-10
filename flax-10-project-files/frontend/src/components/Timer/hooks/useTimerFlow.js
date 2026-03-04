import { useState, useRef, useCallback } from 'react';
import { useCompletionCheck } from '../utils/timerUtils';
import { saveSession } from '../utils/historyUtils';

export function useTimerFlow(t, notify) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());

    const save = useCallback((st = 'Completed') => {
        const c = st === 'Completed' ? t.completedSessions + 1 : t.completedSessions;
        saveSession(t.totalWork, t.totalBreak, c, studyBlockId.current, t.task, t.totalPaused, st);
    }, [t.totalWork, t.totalBreak, t.completedSessions, t.task, t.totalPaused]);

    const startNext = useCallback(() => {
        save('Completed');
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);
        t.updateSettings({ totalWork: 0, totalBreak: 0, totalPaused: 0 });
        if (next >= t.targetSessions) {
            studyBlockId.current = Date.now(); t.setIsActive(false); t.setTimeLeft(t.workTime * 60);
            return setModal('goal');
        }
        t.setMode('work'); t.setTimeLeft(t.workTime * 60); t.setIsActive(modal !== 'break');
    }, [save, t.completedSessions, t.targetSessions, modal, t.setCompletedSessions, t.updateSettings, t.setMode, t.setTimeLeft, t.setIsActive]);

    const endEarly = useCallback(() => {
        if (t.totalWork > 0) save('Incomplete');
        t.resetTimer();
        setModal(null);
        studyBlockId.current = Date.now();
    }, [save, t.resetTimer, setModal]);

    useCompletionCheck(t, startNext, notify);
    return { modal, setModal, startNext, endEarly, resetBlockId: useCallback(() => studyBlockId.current = Date.now(), []) };
}
