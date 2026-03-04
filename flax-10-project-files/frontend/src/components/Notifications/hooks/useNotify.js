import { useCallback } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { sendBrowserNotification } from '../utils/browserNotification';
import { playNotificationSound } from '../utils/notificationSound';
import { createNotificationAction } from '../utils/notificationAction';

export function useNotify() {
    const { addNotification } = useNotifications();

    const notify = useCallback((title, message, options = {}) => {
        const action = createNotificationAction(options.url, options.scrollToId);
        sendBrowserNotification(title, message, options.tag, action);
        playNotificationSound();
        addNotification({ title, message, action });
    }, [addNotification]);

    return notify;
}
