import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { playNotificationSound } from '../../utils/notificationSound';
import './NotificationToast.css';

export function NotificationToast() {
    const { notifications } = useNotifications();
    const [visibleToast, setVisibleToast] = useState(null);
    const lastCountRef = useRef(notifications.length);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (notifications.length > lastCountRef.current) {
            showToast(notifications[0]);
            playNotificationSound();
        }
        lastCountRef.current = notifications.length;
    }, [notifications.length]);

    function showToast(notification) {
        setVisibleToast(notification);
        setTimeout(() => setVisibleToast(null), 3000);
    }

    if (!visibleToast) return null;

    return (
        <div className="notification-toast">
            <span className="toast-title">{visibleToast.title}</span>
            <span className="toast-message">{visibleToast.message}</span>
        </div>
    );
}
