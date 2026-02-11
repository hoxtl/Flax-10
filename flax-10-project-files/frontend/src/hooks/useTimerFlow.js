import { useState } from 'react';
import { useCompletionCheck } from './timerUtils';

export function useTimerFlow(t) {
    const [modal, setModal] = useState(null);

    const startNext = () => {
        const next = t.completedSessions + 1;
        t.setCompletedSessions(next);
        if (next >= t.targetSessions) return setModal('goal');
        t.setMode('work'); t.setTimeLeft(t.workTime * 60); t.setIsActive(modal !== 'break');
    };

    useCompletionCheck(t, startNext, setModal);
    return { modal, setModal, startNext };
}
