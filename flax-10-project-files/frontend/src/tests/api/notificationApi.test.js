import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/social/notificationApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('notificationApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch notifications', async () => {
        await api.fetchNotifications();
        expect(fetchApi).toHaveBeenCalledWith('/notifications/');
    });

    it('should create notification', async () => {
        const payload = { title: 'Test' };
        await api.createNotification(payload);
        expect(fetchApi).toHaveBeenCalledWith('/notifications/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    });

    it('should delete notification', async () => {
        await api.deleteNotification(1);
        expect(fetchApi).toHaveBeenCalledWith('/notifications/1/', {
            method: 'DELETE',
        });
    });

    it('should mark all read', async () => {
        await api.markAllNotificationsRead();
        expect(fetchApi).toHaveBeenCalledWith('/notifications/mark-all-read/', {
            method: 'POST',
        });
    });

    it('should clear all', async () => {
        await api.clearAllNotifications();
        expect(fetchApi).toHaveBeenCalledWith('/notifications/clear-all/', {
            method: 'DELETE',
        });
    });
});
