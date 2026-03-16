import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { playNotificationSound } from './utils/notificationSound';
import { executeNotificationAction, parseNotificationAction, hasNotificationAction } from './utils/notificationAction';
import './NotificationToast.css';

export function NotificationToast() {
    const { notifications, loading } = useNotifications();
    const [currentToast, setCurrentToast] = useState(null);
    const refs = useToastRefs();
    const showNext = useShowNext(refs.queue, setCurrentToast);

    useToastEffect(notifications, loading, refs, currentToast, showNext);

    if (!currentToast) return null;
    return <Toast notification={currentToast} />;
}

function useToastRefs() {
    return {
        queue: useRef([]),
        seenIds: useRef(new Set()),
        initialised: useRef(false)
    };
}

function useShowNext(queueRef, setCurrentToast) {
    return useCallback(() => {
        showNextToast(queueRef, setCurrentToast);
    }, [queueRef, setCurrentToast]);
}

export function showNextToast(queueRef, setCurrentToast) {
    if (queueRef.current.length === 0) return setCurrentToast(null);
    setCurrentToast(queueRef.current.shift());
    playNotificationSound();
    setTimeout(() => setCurrentToast(prev => prev ? null : prev), 3000);
}

function useToastEffect(notifications, loading, refs, currentToast, showNext) {
    useEffect(() => {
        if (loading) return;
        if (!refs.initialised.current) return initialise(notifications, refs);
        queueNew(notifications, refs, currentToast, showNext);
    }, [notifications, loading, currentToast, showNext, refs]);
}

function initialise(notifications, refs) {
    notifications.forEach(n => refs.seenIds.current.add(n.id));
    refs.initialised.current = true;
}

function queueNew(notifications, refs, currentToast, showNext) {
    const newOnes = notifications.filter(n => !refs.seenIds.current.has(n.id));
    newOnes.forEach(n => refs.seenIds.current.add(n.id));
    refs.queue.current.push(...newOnes);
    if (!currentToast && refs.queue.current.length > 0) showNext();
}

function Toast({ notification }) {
    const isClickable = hasNotificationAction(notification);
    const handleClick = () => {
        const action = parseNotificationAction(notification);
        executeNotificationAction(action);
    };

    return (
        <div className={`notification-toast ${isClickable ? 'clickable' : ''}`} onClick={isClickable ? handleClick : undefined}>
            <span className="toast-title">{notification.title}</span>
            <span className="toast-message">{notification.message}</span>
        </div>
    );
}
