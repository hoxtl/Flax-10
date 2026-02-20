let permissionRequested = false;

export function requestPermission() {
    if (permissionRequested || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
    permissionRequested = true;
}

export function sendBrowserNotification(title, body, tag = null) {
    if (!canSendNotification()) return;
    new Notification(title, { body, tag, requireInteraction: true });
}

function canSendNotification() {
    return 'Notification' in window && Notification.permission === 'granted';
}
