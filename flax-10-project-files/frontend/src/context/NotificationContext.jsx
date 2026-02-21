import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/notificationApi';
import { requestPermission, sendBrowserNotification } from '../components/Notifications/utils/browserNotification';
import { playNotificationSound } from '../components/Notifications/utils/notificationSound';

const NotificationContext = createContext(null);
const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
    const { notifications, setNotifications, loading } = useNotificationLoader();
    const [isOpen, setIsOpen] = useState(false);
    const actions = useNotificationActions(setNotifications);

    useNotificationPolling(notifications, setNotifications);

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

function useNotificationPolling(notifications, setNotifications) {
    const knownIds = useRef(new Set());

    useEffect(() => {
        notifications.forEach(n => knownIds.current.add(n.id));
    }, [notifications]);

    useEffect(() => {
        const interval = setInterval(() => pollNotifications(knownIds.current, setNotifications), POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [setNotifications]);
}

function processNewNotifications(fresh, knownIds, setNotifications) {
    const newOnes = fresh.filter(n => !knownIds.has(n.id));
    if (newOnes.length === 0) return;
    newOnes.forEach(n => { notifyUser(n); knownIds.add(n.id); });
    setNotifications(fresh);
}
  
async function pollNotifications(knownIds, setNotifications) {
    const fresh = await api.fetchNotifications().catch(err => {
      console.error('Failed to poll notifications:', err);
      return null;
    });
    if (fresh) processNewNotifications(fresh, knownIds, setNotifications);
}

function notifyUser(notification) {
    sendBrowserNotification(notification.title, notification.message);
    playNotificationSound();
}

function useNotificationActions(set) {
    const addNotification = useCallback((n) => createNotify(n, set), [set]);
    const dismissNotification = useCallback((id) => dismissNotify(id, set), [set]);
    const markAllRead = useCallback(() => markAll(set), [set]);
    const clearAll = useCallback(() => clear(set), [set]);

    return { addNotification, dismissNotification, markAllRead, clearAll };
}

async function createNotify(notification, set) {
    try {
        const created = await api.createNotification(notification);
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
