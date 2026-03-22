/*
 * Fetches, creates, marks read, and clears user notifications.
 */

import { fetchApi } from '../client';

export async function fetchNotifications() {
    return fetchApi('/notifications/');
}

export async function createNotification(notification) {
    return fetchApi('/notifications/', {
        method: 'POST',
        body: JSON.stringify(notification),
    });
}

export async function deleteNotification(id) {
    return fetchApi(`/notifications/${id}/`, { method: 'DELETE' });
}

export async function markAllNotificationsRead() {
    return fetchApi('/notifications/mark-all-read/', { method: 'POST' });
}

export async function clearAllNotifications() {
    return fetchApi('/notifications/clear-all/', { method: 'DELETE' });
}
