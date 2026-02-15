import { useEffect, useState } from 'react';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

const sendNotification = (title, body) => {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

const handleCompletion = (timer, startNext) => {
    if (timer.mode === 'work') {
        sendNotification("Time's Up!", "Work session complete. Take a break!");
        if (timer.breakTime === 0) {
            timer.setIsActive(false);
            startNext();
        }
    } else if (timer.mode === 'break') {
        sendNotification("Break Over!", "Time to get back to work!");
    }
};

export const useCompletionCheck = (timer, startNext, setModal) => {
    useEffect(() => {
        if (Notification.permission === 'default') Notification.requestPermission();
    }, []);

    useEffect(() => {
        if (timer.timeLeft === 0 && timer.isActive) {
            handleCompletion(timer, startNext);
        }
    }, [timer.timeLeft, timer.isActive, timer.mode, timer.breakTime, startNext]);
};

export const useNotificationPermission = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (permission === 'default') {
            Notification.requestPermission().then(setPermission);
        }
    }, []);

    const request = () => Notification.requestPermission().then(setPermission);

    // Poll for permission changes (e.g. if changed in browser settings)
    useEffect(() => {
        const interval = setInterval(() => {
            if (Notification.permission !== permission) {
                setPermission(Notification.permission);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [permission]);

    return { permission, request };
};
