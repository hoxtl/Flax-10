import { useEffect, useState } from 'react';
import { requestPermission, sendBrowserNotification } from '../../Notifications/utils/browserNotification';

export const getProgress = (t) => {
    if (t.mode === 'break' || t.timeLeft <= 0) return 100;
    return ((t.workTime * 60 - t.timeLeft) / (t.workTime * 60)) * 100;
};

export const useCompletionCheck = (timer, startNext) => {
    useEffect(() => { requestPermission(); }, []);

    useEffect(() => {
        if (timer.timeLeft === 0 && timer.isActive) {
            handleCompletion(timer, startNext);
        }
    }, [timer.timeLeft, timer.isActive, timer.mode, timer.breakTime, startNext]);
};

export const useNotificationPermission = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (permission === 'default') Notification.requestPermission().then(setPermission);
    }, []);

    usePermissionPolling(permission, setPermission);
    return { permission, request: () => Notification.requestPermission().then(setPermission) };
};

function handleCompletion(timer, startNext) {
    if (timer.mode === 'work') return handleWorkCompletion(timer, startNext);
    playTimerSound();
    sendBrowserNotification("Break Over!", "Time to get back to work!");
}

function handleWorkCompletion(timer, startNext) {
    playTimerSound();
    sendBrowserNotification("Time's Up!", "Work session complete. Take a break!");
    if (timer.breakTime === 0) {
        timer.setIsActive(false);
        startNext();
    }
}

function playTimerSound() {
    const nodes = createAudioNodes();
    if (!nodes) return;
    try {
        configureOscillator(nodes.osc, nodes.ctx);
        configureGain(nodes.gain, nodes.ctx);
        nodes.osc.start(nodes.ctx.currentTime);
        nodes.osc.stop(nodes.ctx.currentTime + 0.5);
    } catch (e) { console.error("Audio play failed:", e); }
}

function createAudioNodes() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    return { ctx, osc, gain };
}

function configureOscillator(osc, ctx) {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
}

function configureGain(gain, ctx) {
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
}

function usePermissionPolling(permission, setPermission) {
    useEffect(() => {
        const interval = setInterval(() => {
            if (Notification.permission !== permission) setPermission(Notification.permission);
        }, 1000);
        return () => clearInterval(interval);
    }, [permission]);
}
