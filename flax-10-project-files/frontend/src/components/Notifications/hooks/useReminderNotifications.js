import { useEffect, useRef } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { requestPermission, sendBrowserNotification } from '../utils/browserNotification';
import { createEventPopupAction } from '../utils/notificationAction';

export function useReminderNotifications(events) {
    const { addNotification } = useNotifications();
    const lastCheckRef = useRef(new Date());

    useEffect(() => { requestPermission(); }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            checkAndNotify(events, now, lastCheckRef.current, addNotification);
            lastCheckRef.current = now;
        }, 10000);
        return () => clearInterval(interval);
    }, [events, addNotification]);
}

function checkAndNotify(events, now, lastCheck, addNotification) {
    const sent = getSentReminders();
    events.forEach(event => checkEventReminders(event, now, lastCheck, sent, addNotification));
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
    return isReminderDue(event, minutes, now, lastCheck);
}

function isReminderDue(event, minutes, now, lastCheck) {
    const reminderTime = getReminderTime(event, minutes);
    if (reminderTime > now) return false;
    const isDue = reminderTime > lastCheck && reminderTime <= now;
    const wasMissed = (now - reminderTime) < 60000;
    return isDue || wasMissed;
}

function triggerNotification(event, minutes, addNotification, sentSet) {
    markAsSent(event, minutes, sentSet);
    const title = `Reminder: ${event.title}`;
    const body = getNotificationBody(event, minutes);
    const tag = getReminderKey(event, minutes);
    const action = createEventPopupAction(event.id);

    sendBrowserNotification(title, body, tag, action);
    addNotification({ title, message: body, notification_type: 'reminder', action_url: 'calendar', scroll_to_id: String(event.id) });
}

function markAsSent(event, minutes, sentSet) {
    sentSet.add(getReminderKey(event, minutes));
    saveSentReminders(sentSet);
}

function getSentReminders() {
    try {
        const saved = localStorage.getItem('sent_reminders');
        return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
}

function saveSentReminders(set) {
    try { localStorage.setItem('sent_reminders', JSON.stringify([...set])); }
    catch (err) { console.error('Failed to save sent reminders', err); }
}

function getReminderTime(event, minutes) {
    return new Date(new Date(event.start_time).getTime() - minutes * 60000);
}

function getReminderKey(event, minutes) {
    return `${event.id}_${new Date(event.start_time).toISOString()}_${minutes}`;
}

function getNotificationBody(event, minutes) {
    const time = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prefix = minutes === 0 ? 'Starting now!' : `Starts at ${time}`;
    return event.description ? `${prefix}\n${event.description}` : prefix;
}
