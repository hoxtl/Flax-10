import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/notificationApi';
import { requestPermission, sendBrowserNotification } from '../components/Notifications/utils/browserNotification';
import { playNotificationSound } from '../components/Notifications/utils/notificationSound';
import { parseNotificationAction } from '../components/Notifications/utils/notificationAction';
import { getUserProfile } from '../api/userService';

const NotificationContext = createContext(null);
const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
    const { notifications, setNotifications, loading } = useNotificationLoader();
    const [isOpen, setIsOpen] = useState(false);
    const knownIds = useRef(new Set());
    const actions = useNotificationActions(setNotifications, knownIds);

    useNotificationPolling(notifications, setNotifications, knownIds);

    const value = {
        notifications, isOpen, hasUnread: notifications.some(n => !n.read), loading, ...actions,
        togglePanel: () => setIsOpen(p => !p), closePanel: () => setIsOpen(false)
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

function useNotificationLoader() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        requestPermission();
        api.fetchNotifications()
            .then(setNotifications)
            .catch(err => console.error('Failed to fetch notifications:', err))
            .finally(() => setLoading(false));
    }, []);

    return { notifications, setNotifications, loading };
}

function useNotificationPolling(notifications, setNotifications, knownIds) {
    useEffect(() => {
        notifications.forEach(n => knownIds.current.add(n.id));
    }, [notifications, knownIds]);

    useEffect(() => {
        const interval = setInterval(() => pollNotifications(knownIds.current, setNotifications), POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [setNotifications, knownIds]);
}

const ROLE_CHANGE_TITLES = new Set([
    'teacher role approved',
    'teacher request rejected',
    'course change approved',
    'course change rejected',
]);

function isRoleChangeNotification(notification) {
    return ROLE_CHANGE_TITLES.has((notification.title || '').toLowerCase());
}

function reloadIfRoleChanged(oldRole, newRole) {
    if (oldRole !== newRole) setTimeout(() => window.location.reload(), 1500);
}

function applySessionUpdate(profile) {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, role: profile.role, name: profile.name, major: profile.major, year: profile.year, bio: profile.bio };
    localStorage.setItem('user', JSON.stringify(updated));
    window.dispatchEvent(new Event('auth-changed'));
    reloadIfRoleChanged(stored.role, profile.role);
}

async function refreshUserSession() {
    const profile = await getUserProfile().catch(err => {
        console.error('Failed to refresh user session after role change:', err);
        return null;
    });
    if (profile) applySessionUpdate(profile);
}

function processNewNotifications(fresh, knownIds, setNotifications) {
    const newOnes = fresh.filter(n => !knownIds.has(n.id));
    if (newOnes.length === 0) return;
    let needsSessionRefresh = false;
    newOnes.forEach(n => {
        notifyUser(n);
        knownIds.add(n.id);
        if (isRoleChangeNotification(n)) needsSessionRefresh = true;
    });
    setNotifications(fresh);
    if (needsSessionRefresh) refreshUserSession();
}
  
async function pollNotifications(knownIds, setNotifications) {
    const fresh = await api.fetchNotifications().catch(err => {
      console.error('Failed to poll notifications:', err);
      return null;
    });
    if (fresh) processNewNotifications(fresh, knownIds, setNotifications);
}

function notifyUser(notification) {
    if (isReminderNotification(notification)) return;
    const action = parseNotificationAction(notification);
    const tag = `notification-${notification.id}`;
    sendBrowserNotification(notification.title, notification.message, tag, action);
    playNotificationSound();
}

function isReminderNotification(notification) {
    return notification.notification_type === 'reminder';
}

function useNotificationActions(set, knownIds) {
    const addNotification = useCallback((n) => createNotify(n, set, knownIds), [set, knownIds]);
    const dismissNotification = useCallback((id) => dismissNotify(id, set), [set]);
    const markAllRead = useCallback(() => markAll(set), [set]);
    const clearAll = useCallback(() => clear(set), [set]);

    return { addNotification, dismissNotification, markAllRead, clearAll };
}

function trackKnownId(knownIds, id) {
    if (knownIds?.current) knownIds.current.add(id);
}

async function createNotify(notification, set, knownIds) {
    try {
        const created = await api.createNotification(notification);
        trackKnownId(knownIds, created.id);
        set(prev => [created, ...prev]);
    } catch (err) { console.error('Failed to create notification:', err); }
}

async function dismissNotify(id, set) {
    try {
        await api.deleteNotification(id);
        set(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error('Failed to delete notification:', err); }
}

async function markAll(set) {
    try {
        await api.markAllNotificationsRead();
        set(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error('Failed to mark all read:', err); }
}

async function clear(set) {
    try {
        await api.clearAllNotifications();
        set([]);
    } catch (err) { console.error('Failed to clear notifications:', err); }
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}
