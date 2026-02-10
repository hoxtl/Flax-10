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
        if (shouldNotify(event, now, lastCheck, sent)) {
            triggerNotification(event, addNotification, sent);
        }
    });
}

function shouldNotify(event, now, lastCheck, sentSet) {
    if (!hasValidReminder(event)) return false;
    const key = getEventKey(event);
    if (sentSet.has(key)) return false;

    const reminderTime = getReminderTime(event);
    if (reminderTime > now) return false;

    const isDue = reminderTime > lastCheck && reminderTime <= now;
    const wasMissed = (now - reminderTime) < 60000;

    return isDue || wasMissed;
}

function triggerNotification(event, addNotification, sentSet) {
    sendBrowserNotification(event);
    addInAppNotification(event, addNotification);
    markAsSent(event, sentSet);
}

function markAsSent(event, sentSet) {
    const key = getEventKey(event);
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

function hasValidReminder(event) {
    return event.start_time && event.reminder_minutes != null && event.reminder_minutes >= 0;
}

function getReminderTime(event) {
    return new Date(new Date(event.start_time).getTime() - event.reminder_minutes * 60000);
}

function sendBrowserNotification(event) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`Reminder: ${event.title}`, {
        body: getNotificationBody(event),
        tag: getEventKey(event),
        requireInteraction: true
    });
}

function addInAppNotification(event, addNotification) {
    addNotification({
        title: `Reminder: ${event.title}`,
        message: getNotificationBody(event),
        time: new Date(),
        tag: getEventKey(event)
    });
}

function getNotificationBody(event) {
    const time = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prefix = event.reminder_minutes === 0 ? 'Starting now!' : `Starts at ${time}`;
    return event.description ? `${prefix}\n${event.description}` : prefix;
}

function getEventKey(event) {
    const dateStr = event.start_time instanceof Date
        ? event.start_time.toISOString()
        : new Date(event.start_time).toISOString();
    return `${event.id}_${dateStr}`;
}
