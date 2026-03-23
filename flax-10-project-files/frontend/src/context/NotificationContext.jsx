import { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import * as api from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { requestPermission, sendBrowserNotification } from '../components/Notifications/utils/browserNotification';
import { playNotificationSound } from '../components/Notifications/utils/notificationSound';
import { parseNotificationAction } from '../components/Notifications/utils/notificationAction';

const NotificationContext = createContext(null);
const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
    const { refreshProfile } = useAuth();
    const { notifications, setNotifications, loading } = useNotificationLoader();
    const [isOpen, setIsOpen] = useState(false);
    const knownIds = useRef(new Set());
    const actions = useNotificationActions(setNotifications, knownIds);

    useNotificationPolling(notifications, setNotifications, knownIds, refreshProfile);

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
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { notifications, setNotifications, loading };
}

function useNotificationPolling(notifications, setNotifications, knownIds, refreshProfile) {
    useEffect(() => {
        notifications.forEach(n => knownIds.current.add(n.id));
    }, [notifications, knownIds]);

    useEffect(() => {
        const interval = setInterval(() => pollNotifications(knownIds.current, setNotifications, refreshProfile), POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [setNotifications, knownIds, refreshProfile]);
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

function processNewNotifications(fresh, knownIds, setNotifications, refreshProfile) {
    const newOnes = fresh.filter(n => !knownIds.has(n.id));
    if (newOnes.length === 0) return;
    let needsSessionRefresh = false;
    newOnes.forEach(n => {
        notifyUser(n);
        knownIds.add(n.id);
        if (isRoleChangeNotification(n)) needsSessionRefresh = true;
    });
    setNotifications(fresh);
    if (needsSessionRefresh && refreshProfile) refreshProfile();
}

async function pollNotifications(knownIds, setNotifications, refreshProfile) {
    const fresh = await api.fetchNotifications().catch(() => null);
    if (fresh) processNewNotifications(fresh, knownIds, setNotifications, refreshProfile);
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
    } catch {}
}

async function dismissNotify(id, set) {
    try {
        await api.deleteNotification(id);
        set(prev => prev.filter(n => n.id !== id));
    } catch {}
}

async function markAll(set) {
    try {
        await api.markAllNotificationsRead();
        set(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
}

async function clear(set) {
    try {
        await api.clearAllNotifications();
        set([]);
    } catch {}
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}
