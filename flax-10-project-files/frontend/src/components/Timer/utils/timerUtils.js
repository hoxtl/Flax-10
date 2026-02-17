import { useEffect, useState } from 'react';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

const createAudioNodes = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    return { ctx, osc, gain };
};

const configureOscillator = (osc, ctx) => {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
};

const configureGain = (gain, ctx) => {
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
};

const playNotificationSound = () => {
    try {
        const nodes = createAudioNodes();
        if (!nodes) return;
        configureOscillator(nodes.osc, nodes.ctx);
        configureGain(nodes.gain, nodes.ctx);
        nodes.osc.start(nodes.ctx.currentTime);
        nodes.osc.stop(nodes.ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed:", e);
    }
};

const sendNotification = (title, body) => {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

const handleWorkCompletion = (timer, startNext) => {
    playNotificationSound();
    sendNotification("Time's Up!", "Work session complete. Take a break!");
    if (timer.breakTime === 0) {
        timer.setIsActive(false);
        startNext();
    }
};

const handleCompletion = (timer, startNext) => {
    if (timer.mode === 'work') return handleWorkCompletion(timer, startNext);

    playNotificationSound();
    sendNotification("Break Over!", "Time to get back to work!");
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
