import { createContext, useState, useCallback, useRef, useContext } from 'react';
import * as api from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { useNotificationLoader, useNotificationPolling } from './useNotificationData';

const NotificationContext = createContext(null);

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
