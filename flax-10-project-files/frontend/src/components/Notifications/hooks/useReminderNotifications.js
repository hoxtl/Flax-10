import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';

export function useReminderNotifications(events) {
    const { addNotification } = useNotifications();
    const lastCheckRef = useRef(new Date());

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            checkAndNotify(events, now, lastCheckRef.current, addNotification);
            lastCheckRef.current = now;
        }, 10000);
        return () => clearInterval(interval);
    }, [events, addNotification]);
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
}

function checkAndNotify(events, now, lastCheck, addNotification) {
    const sent = getSentReminders();
    events.forEach(event => {
        checkEventReminders(event, now, lastCheck, sent, addNotification);
    });
}

function checkEventReminders(event, now, lastCheck, sent, addNotification) {
    const reminders = getReminders(event);
    reminders.forEach(minutes => {
        if (shouldNotify(event, minutes, now, lastCheck, sent)) {
            triggerNotification(event, minutes, addNotification, sent);
        }
    });
}

function getReminders(event) {
    if (Array.isArray(event.reminder_minutes)) return event.reminder_minutes;
    if (event.reminder_minutes != null && event.reminder_minutes >= 0) return [event.reminder_minutes];
    return [];
}

function shouldNotify(event, minutes, now, lastCheck, sentSet) {
    if (!event.start_time) return false;
    const key = getReminderKey(event, minutes);
    if (sentSet.has(key)) return false;

    const reminderTime = getReminderTime(event, minutes);
    if (reminderTime > now) return false;

    const isDue = reminderTime > lastCheck && reminderTime <= now;
    const wasMissed = (now - reminderTime) < 60000;

    return isDue || wasMissed;
}

function triggerNotification(event, minutes, addNotification, sentSet) {
    sendBrowserNotification(event, minutes);
    addInAppNotification(event, minutes, addNotification);
    markAsSent(event, minutes, sentSet);
}

function markAsSent(event, minutes, sentSet) {
    const key = getReminderKey(event, minutes);
    sentSet.add(key);
    saveSentReminders(sentSet);
}

function getSentReminders() {
    try {
        const saved = localStorage.getItem('sent_reminders');
        return new Set(saved ? JSON.parse(saved) : []);
    } catch {
        return new Set();
    }
}

function saveSentReminders(set) {
    try {
        localStorage.setItem('sent_reminders', JSON.stringify([...set]));
    } catch (e) {
        console.error('Failed to save sent reminders', e);
    }
}

function getReminderTime(event, minutes) {
    return new Date(new Date(event.start_time).getTime() - minutes * 60000);
}

function getReminderKey(event, minutes) {
    const dateStr = new Date(event.start_time).toISOString();
    return `${event.id}_${dateStr}_${minutes}`;
}

function sendBrowserNotification(event, minutes) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`Reminder: ${event.title}`, {
        body: getNotificationBody(event, minutes),
        tag: getReminderKey(event, minutes),
        requireInteraction: true
    });
}

function addInAppNotification(event, minutes, addNotification) {
    addNotification({
        title: `Reminder: ${event.title}`,
        message: getNotificationBody(event, minutes),
    });
}

function getNotificationBody(event, minutes) {
    const time = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prefix = minutes === 0 ? 'Starting now!' : `Starts at ${time}`;
    return event.description ? `${prefix}\n${event.description}` : prefix;
}
