import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/notificationApi';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { notifications, setNotifications, loading } = useNotificationLoader();
    const [isOpen, setIsOpen] = useState(false);
    const actions = useNotificationActions(setNotifications);
    const hasUnread = notifications.some(n => !n.read);
    const value = {
        notifications, isOpen, hasUnread, loading, ...actions,
        togglePanel: () => setIsOpen(p => !p),
        closePanel: () => setIsOpen(false)
    };
    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

function useNotificationLoader() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.fetchNotifications()
            .then(setNotifications)
            .catch(err => console.error('Failed to fetch notifications:', err))
            .finally(() => setLoading(false));
    }, []);

    return { notifications, setNotifications, loading };
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
