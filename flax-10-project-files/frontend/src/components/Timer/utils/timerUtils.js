import { useEffect, useState, useRef } from 'react';
import { requestPermission } from '../../Notifications/utils/browserNotification';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

export const useCompletionCheck = (timer, startNext, notify) => {
    const hasNotified = useRef(false);
    useEffect(() => { requestPermission(); }, []);

    useEffect(() => {
        if (timer.timeLeft === 0 && timer.isActive && !hasNotified.current) {
            hasNotified.current = true;
            handleCompletion(timer, startNext, notify);
        } else if (timer.timeLeft > 0) {
            hasNotified.current = false;
        }
    }, [timer.timeLeft, timer.isActive, timer.mode, timer.breakTime, startNext, notify]);
};

export const useNotificationPermission = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (permission === 'default') Notification.requestPermission().then(setPermission);
    }, []);

    usePermissionPolling(permission, setPermission);
    return { permission, request: () => Notification.requestPermission().then(setPermission) };
};

function handleCompletion(timer, startNext, notify) {
    if (timer.mode === 'work') return handleWorkCompletion(timer, startNext, notify);
    if (notify) notify("Break Over!", "Time to get back to work!", { url: 'timer' });
}

function handleWorkCompletion(timer, startNext, notify) {
    if (notify) notify("Time's Up!", "Work session complete. Take a break!", { url: 'timer' });
    if (timer.breakTime === 0) {
        timer.setIsActive(false);
        startNext();
    }
}

function usePermissionPolling(permission, setPermission) {
    useEffect(() => {
        const interval = setInterval(() => {
            if (Notification.permission !== permission) setPermission(Notification.permission);
        }, 1000);
        return () => clearInterval(interval);
    }, [permission]);
}
