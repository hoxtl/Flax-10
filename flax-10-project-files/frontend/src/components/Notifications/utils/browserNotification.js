import { executeNotificationAction } from './notificationAction';

const SENT_KEY = 'sent_browser_notifications';
const EXPIRY_MS = 120000;
let permissionRequested = false;

export function requestPermission() {
    if (permissionRequested || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
    permissionRequested = true;
}

export function sendBrowserNotification(title, body, tag = null, action = null) {
    if (!canSendNotification() || (tag && hasBeenSent(tag))) return;
    if (tag) markAsSent(tag);
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

function hasBeenSent(tag) {
    const sent = getSentNotifications();
    const entry = sent[tag];
    return entry && (Date.now() - entry) < EXPIRY_MS;
}

function markAsSent(tag) {
    const sent = getSentNotifications();
    sent[tag] = Date.now();
    cleanExpired(sent);
    saveSentNotifications(sent);
}

function cleanExpired(sent) {
    const now = Date.now();
    Object.keys(sent).forEach(key => { if (now - sent[key] >= EXPIRY_MS) delete sent[key]; });
}

function getSentNotifications() {
    try { return JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); }
    catch { return {}; }
}

function saveSentNotifications(sent) {
    try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); }
    catch { /* ignore */ }
}
