import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';

export function useReminderNotifications(events) {
    const lastCheckRef = useRef(new Date());
    const notifiedRef = useRef(new Set());
    const { addNotification } = useNotifications();

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            checkReminders(events, now, lastCheckRef.current, notifiedRef.current, addNotification);
            lastCheckRef.current = now;
        }, 10000);
        return () => clearInterval(interval);
    }, [events, addNotification]);
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function checkReminders(events, now, lastCheck, notifiedSet, addNotification) {
    events.forEach(event => processEventReminder(event, now, lastCheck, notifiedSet, addNotification));
}

function processEventReminder(event, now, lastCheck, notifiedSet, addNotification) {
    if (!shouldNotify(event, now, lastCheck, notifiedSet)) return;
    sendBrowserNotification(event);
    addInAppNotification(event, addNotification);
    notifiedSet.add(getEventKey(event));
}

function addInAppNotification(event, addNotification) {
    addNotification({
        title: `Reminder: ${event.title}`,
        message: getNotificationBody(event),
        time: new Date(),
    });
}

function shouldNotify(event, now, lastCheck, notifiedSet) {
    if (!hasValidReminder(event)) return false;
    const reminderTime = getReminderTime(event);
    if (reminderTime > now) return false;
    const isDue = reminderTime > lastCheck && reminderTime <= now;
    const wasRecentlyMissed = (now - reminderTime) < 60000;
    return (isDue || wasRecentlyMissed) && !notifiedSet.has(getEventKey(event));
}

function hasValidReminder(event) {
    return event.start_time && event.reminder_minutes != null && event.reminder_minutes >= 0;
}

function getReminderTime(event) {
    return new Date(new Date(event.start_time).getTime() - event.reminder_minutes * 60000);
}

function sendBrowserNotification(event) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        const notification = new Notification(`Reminder: ${event.title}`, {
            body: getNotificationBody(event),
            tag: getEventKey(event),
            requireInteraction: true
        });
        notification.onclick = () => window.focus();
    } catch (err) {
        console.error('[Reminder] Failed to create notification:', err);
    }
}

function getNotificationBody(event) {
    const time = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prefix = event.reminder_minutes === 0 ? 'Starting now!' : `Starts at ${time}`;
    return event.description ? `${prefix}\n${event.description}` : prefix;
}

function getEventKey(event) {
    return `${event.id}_${event.start_time}`;
}
