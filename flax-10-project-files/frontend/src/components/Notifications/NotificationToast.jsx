import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { playNotificationSound } from './utils/notificationSound';
import { executeNotificationAction, parseNotificationAction, hasNotificationAction } from './utils/notificationAction';
import AppToast from '../Common/AppToast/AppToast';

export function NotificationToast() {
    const { notifications, loading } = useNotifications();
    const [currentToast, setCurrentToast] = useState(null);
    const refs = useToastRefs();
    const showNext = useShowNext(refs.queue, refs.timeout, setCurrentToast);
    const dismissToast = useCallback(() => {
        if (refs.timeout.current) {
            clearTimeout(refs.timeout.current);
            refs.timeout.current = null;
        }
        setCurrentToast(null);
    }, [refs.timeout]);

    useToastEffect(notifications, loading, refs, currentToast, showNext);

    useEffect(() => () => {
        if (refs.timeout.current) {
            clearTimeout(refs.timeout.current);
            refs.timeout.current = null;
        }
    }, [refs.timeout]);

    return (
        <AnimatePresence initial={false}>
            {currentToast && <Toast key={currentToast.id} notification={currentToast} onClose={dismissToast} />}
        </AnimatePresence>
    );
}

function useToastRefs() {
    return {
        queue: useRef([]),
        seenIds: useRef(new Set()),
        initialised: useRef(false),
        timeout: useRef(null),
    };
}

function useShowNext(queueRef, timeoutRef, setCurrentToast) {
    return useCallback(() => {
        showNextToast(queueRef, setCurrentToast, timeoutRef);
    }, [queueRef, timeoutRef, setCurrentToast]);
}

export function showNextToast(queueRef, setCurrentToast, timeoutRef = { current: null }) {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    if (queueRef.current.length === 0) return setCurrentToast(null);
    setCurrentToast(queueRef.current.shift());
    playNotificationSound();
    timeoutRef.current = setTimeout(() => {
        setCurrentToast(prev => prev ? null : prev);
        timeoutRef.current = null;
    }, 3000);
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

function getToastVariant(notification) {
    const title = String(notification?.title || '').toLowerCase();
    if (title.includes('failed') || title.includes('rejected') || title.includes('⚠')) return 'error';
    if (title.includes('done') || title.includes('approved') || title.includes('✓')) return 'success';
    return 'info';
}

function Toast({ notification, onClose }) {
    const isClickable = hasNotificationAction(notification);
    const handleAction = () => {
        const action = parseNotificationAction(notification);
        executeNotificationAction(action);
    };

    return (
        <AppToast
            title={notification.title}
            description={notification.message}
            variant={getToastVariant(notification)}
            actionLabel={isClickable ? 'Open' : null}
            onAction={isClickable ? handleAction : null}
            onClose={onClose}
        />
    );
}
