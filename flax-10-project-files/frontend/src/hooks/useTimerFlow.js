import { useState, useRef } from 'react';
import { useCompletionCheck } from './timerUtils';
import { saveSession } from '../utils/historyUtils';

export function useTimerFlow(t) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());

    // Reset block ID if we are back to session 0 (manual reset)
    if (t.completedSessions === 0 && !t.isActive && t.workTime * 60 === t.timeLeft) {
        // This check is a bit loose, better to expose a reset handler or rely on t.completedSessions reset
    }

    const startNext = () => {
        saveSession(t.workTime, t.breakTime, t.completedSessions + 1, studyBlockId.current);
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);

        if (next >= t.targetSessions) {
            studyBlockId.current = Date.now(); // Reset for next time
            return setModal('goal');
        }

        t.setMode('work'); t.setTimeLeft(t.workTime * 60); t.setIsActive(modal !== 'break');
    };

    useCompletionCheck(t, startNext, setModal);
    return { modal, setModal, startNext, resetBlockId: () => studyBlockId.current = Date.now() };
}
