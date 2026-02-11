import { useEffect } from 'react';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

export const useCompletionCheck = (timer, startNext, setModal) => {
    useEffect(() => {
        if (timer.mode === 'work' && timer.timeLeft === 0 && timer.isActive) {
            timer.setIsActive(false);
            timer.breakTime === 0 ? startNext() : setModal('break');
        }
    }, [timer.timeLeft, timer.isActive, timer.mode, timer.breakTime]);
};
