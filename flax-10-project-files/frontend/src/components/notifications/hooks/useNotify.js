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
        addNotification(buildNotificationPayload(title, message, options));
    }, [addNotification]);

    return notify;
}

function buildNotificationPayload(title, message, options) {
    return {
        title,
        message,
        action_url: options.url || null,
        scroll_to_id: options.scrollToId || null,
        notification_type: options.notificationType || 'general',
    };
}
