import { useState, useRef } from 'react';
import { useCompletionCheck } from '../utils/timerUtils';
import { saveSession } from '../utils/historyUtils';

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

export function useTimerFlow(t, notify) {
    const [modal, setModal] = useState(null);
    const studyBlockId = useRef(Date.now());
    const startNext = getStartNextHandler(t, studyBlockId, modal, setModal);

    useCompletionCheck(t, startNext, notify);
    return { modal, setModal, startNext, resetBlockId: () => studyBlockId.current = Date.now() };
}
