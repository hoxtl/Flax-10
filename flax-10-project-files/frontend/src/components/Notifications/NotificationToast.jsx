import { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationToast.css';

export function NotificationToast() {
    const { notifications } = useNotifications();
    const [visibleToast, setVisibleToast] = useState(null);
    const [lastCount, setLastCount] = useState(0);

    useEffect(() => {
        if (notifications.length > lastCount && notifications.length > 0) {
            showToast(notifications[0]);
        }
        setLastCount(notifications.length);
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
