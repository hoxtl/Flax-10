import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { playNotificationSound } from '../../utils/notificationSound';
import './NotificationToast.css';

export function NotificationToast() {
    const { notifications, loading } = useNotifications();
    const [currentToast, setCurrentToast] = useState(null);
    const queueRef = useRef([]);
    const seenIdsRef = useRef(new Set());
    const initializedRef = useRef(false);

    const showNext = useCallback(() => {
        if (queueRef.current.length === 0) return setCurrentToast(null);
        const next = queueRef.current.shift();
        setCurrentToast(next);
        playNotificationSound();
        setTimeout(showNext, 3000);
    }, []);

    useEffect(() => {
        if (loading) return;
        if (!initializedRef.current) return initialize(notifications, seenIdsRef.current, initializedRef);
        queueNewNotifications(notifications, seenIdsRef.current, queueRef.current, currentToast, showNext);
    }, [notifications, loading, currentToast, showNext]);

    if (!currentToast) return null;
    return <Toast notification={currentToast} />;
}

function initialize(notifications, seenIds, initializedRef) {
    notifications.forEach(n => seenIds.add(n.id));
    initializedRef.current = true;
}

function queueNewNotifications(notifications, seenIds, queue, currentToast, showNext) {
    const newOnes = notifications.filter(n => !seenIds.has(n.id));
    newOnes.forEach(n => seenIds.add(n.id));
    queue.push(...newOnes);
    if (!currentToast && queue.length > 0) showNext();
}

function Toast({ notification }) {
    return (
        <div className="notification-toast">
            <span className="toast-title">{notification.title}</span>
            <span className="toast-message">{notification.message}</span>
        </div>
    );
}
