import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { playNotificationSound } from '../../utils/notificationSound';
import './NotificationToast.css';

export function NotificationToast() {
    const { notifications, loading } = useNotifications();
    const [visibleToast, setVisibleToast] = useState(null);
    const seenIdsRef = useRef(new Set());
    const initializedRef = useRef(false);

    useEffect(() => {
        if (loading) return;
        if (!initializedRef.current) {
            markAllAsSeen(notifications, seenIdsRef.current);
            initializedRef.current = true;
            return;
        }
        checkForNewNotification(notifications, seenIdsRef.current, setVisibleToast);
    }, [notifications, loading]);

    if (!visibleToast) return null;

    return (
        <div className="notification-toast">
            <span className="toast-title">{visibleToast.title}</span>
            <span className="toast-message">{visibleToast.message}</span>
        </div>
    );
}

function markAllAsSeen(notifications, seenIds) {
    notifications.forEach(n => seenIds.add(n.id));
}

function checkForNewNotification(notifications, seenIds, setVisibleToast) {
    const newNotification = notifications.find(n => !seenIds.has(n.id));
    if (newNotification) showToast(newNotification, seenIds, setVisibleToast);
}

function showToast(notification, seenIds, setVisibleToast) {
    seenIds.add(notification.id);
    setVisibleToast(notification);
    playNotificationSound();
    setTimeout(() => setVisibleToast(null), 3000);
}
