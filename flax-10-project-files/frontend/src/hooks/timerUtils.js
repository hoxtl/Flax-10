import { useEffect } from 'react';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

const handleCompletion = (timer, startNext) => {
    new Notification("Time's Up!", { body: "Overtime started. Keep focusing or take a break!" });
    if (timer.breakTime === 0) {
        timer.setIsActive(false);
        startNext();
    }
};

export const useCompletionCheck = (timer, startNext, setModal) => {
    useEffect(() => {
        if (Notification.permission === 'default') Notification.requestPermission();
    }, []);

    useEffect(() => {
        if (timer.mode === 'work' && timer.timeLeft === 0 && timer.isActive)
            handleCompletion(timer, startNext);
    }, [timer.timeLeft, timer.isActive, timer.mode, timer.breakTime, startNext]);
};
