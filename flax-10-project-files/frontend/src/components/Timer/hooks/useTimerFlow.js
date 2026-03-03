import { useState, useRef, useCallback } from 'react';
import { useCompletionCheck } from '../utils/timerUtils';
import { saveSession } from '../utils/historyUtils';

export function useTimerFlow(t, notify) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());

    const startNext = useCallback(() => {
        saveSession(t.totalWork, t.totalBreak, t.completedSessions + 1, studyBlockId.current, t.task, t.totalPaused);
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);

        // Reset counters for next session
        t.updateSettings({ totalWork: 0, totalBreak: 0, totalPaused: 0 });

        if (next >= t.targetSessions) {
            studyBlockId.current = Date.now();
            t.setIsActive(false);
            t.setTimeLeft(t.workTime * 60);
            return setModal('goal');
        }
        t.setMode('work');
        t.setTimeLeft(t.workTime * 60);
        t.setIsActive(modal !== 'break');
    }, [t.totalWork, t.totalBreak, t.completedSessions, t.task, t.totalPaused, t.targetSessions, modal, t.setCompletedSessions, t.updateSettings, t.setMode, t.setTimeLeft, t.setIsActive]);

    useCompletionCheck(t, startNext, notify);
    return {
        modal,
        setModal,
        startNext,
        resetBlockId: useCallback(() => studyBlockId.current = Date.now(), [])
    };
}
