import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/notificationApi';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        try {
            const data = await api.fetchNotifications();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }

    const actions = useNotificationActions(setNotifications);
    const hasUnread = notifications.some(n => !n.read);
    const value = { notifications, isOpen, hasUnread, loading, ...actions, togglePanel, closePanel };

    function togglePanel() { setIsOpen(prev => !prev); }
    function closePanel() { setIsOpen(false); }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

function useNotificationActions(setNotifications) {
    const addNotification = useCallback(async (notification) => {
        try {
            const created = await api.createNotification(notification);
            setNotifications(prev => [created, ...prev]);
        } catch (err) {
            console.error('Failed to create notification:', err);
        }
    }, [setNotifications]);

    const dismissNotification = useCallback(async (id) => {
        try {
            await api.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    }, [setNotifications]);

    const markAllRead = useCallback(async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    }, [setNotifications]);

    const clearAll = useCallback(async () => {
        try {
            await api.clearAllNotifications();
            setNotifications([]);
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    }, [setNotifications]);

    return { addNotification, dismissNotification, markAllRead, clearAll };
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}
