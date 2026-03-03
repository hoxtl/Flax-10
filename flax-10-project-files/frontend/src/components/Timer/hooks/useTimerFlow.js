import { useState, useRef, useCallback } from 'react';
import { useCompletionCheck } from '../utils/timerUtils';
import { saveSession } from '../utils/historyUtils';

export function useTimerFlow(t, notify) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());

    const startNext = useCallback(() => {
        saveSession(t.workTime, t.breakTime, t.completedSessions + 1, studyBlockId.current, t.task, t.totalPaused);
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);

        if (next >= t.targetSessions) {
            studyBlockId.current = Date.now();
            return setModal('goal');
        }
        t.setMode('work');
        t.setTimeLeft(t.workTime * 60);
        t.setIsActive(modal !== 'break');
    }, [t.workTime, t.breakTime, t.completedSessions, t.task, t.totalPaused, t.targetSessions, modal, t.setCompletedSessions, t.setMode, t.setTimeLeft, t.setIsActive]);

    useCompletionCheck(t, startNext, notify);
    return {
        modal,
        setModal,
        startNext,
        resetBlockId: useCallback(() => studyBlockId.current = Date.now(), [])
    };
}
