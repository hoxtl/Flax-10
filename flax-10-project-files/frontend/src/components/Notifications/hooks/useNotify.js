import { useCallback } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { sendBrowserNotification } from '../utils/browserNotification';
import { playNotificationSound } from '../utils/notificationSound';

export function useNotify() {
    const { addNotification } = useNotifications();

    const notify = useCallback((title, message, options = {}) => {
        const tag = options.tag || null;
        sendBrowserNotification(title, message, tag);
        playNotificationSound();
        addNotification({ title, message });
    }, [addNotification]);

    return notify;
}
