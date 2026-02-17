import { useState, useRef } from 'react';
import { useCompletionCheck } from './timerUtils';
import { saveSession } from '../utils/historyUtils';

/**
 * Manages timer state transitions and session logging.
 * Handles auto-reset of study blocks when goal is reached.
 */
/** Logic to advance to next session or goal state */
const getStartNextHandler = (t, studyBlockId, modal, setModal) => () => {
    saveSession(t.workTime, t.breakTime, t.completedSessions + 1, studyBlockId.current, t.task);
    const next = t.completedSessions + 1;
    t.setCompletedSessions(next);

    if (next >= t.targetSessions) {
        studyBlockId.current = Date.now();
        return setModal('goal');
    }
    t.setMode('work'); t.setTimeLeft(t.workTime * 60); t.setIsActive(modal !== 'break');
};

/**
 * Manages timer state transitions and session logging.
 * Handles auto-reset of study blocks when goal is reached.
 */
export function useTimerFlow(t) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());
    const startNext = getStartNextHandler(t, studyBlockId, modal, setModal);

    useCompletionCheck(t, startNext, setModal);
    return { modal, setModal, startNext, resetBlockId: () => studyBlockId.current = Date.now() };
}
