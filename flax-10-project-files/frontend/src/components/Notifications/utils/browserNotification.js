import { executeNotificationAction } from './notificationAction';

let permissionRequested = false;

export function requestPermission() {
    if (permissionRequested || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
    permissionRequested = true;
}

export function sendBrowserNotification(title, body, tag = null, action = null) {
    if (!canSendNotification()) return;
    const notification = new Notification(title, { body, tag, requireInteraction: true });
    if (action) notification.onclick = () => handleBrowserNotificationClick(action);
}

function canSendNotification() {
    return 'Notification' in window && Notification.permission === 'granted';
}

function handleBrowserNotificationClick(action) {
    window.focus();
    executeNotificationAction(action);
}
