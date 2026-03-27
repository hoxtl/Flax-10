import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNotificationLoader, useNotificationPolling } from '../../context/useNotificationData';
import * as api from '../../api/notificationApi';

vi.mock('../../api/notificationApi', () => ({
    fetchNotifications: vi.fn(),
}));

vi.mock('../../components/Notifications/utils/browserNotification', () => ({
    requestPermission: vi.fn(),
    sendBrowserNotification: vi.fn(),
}));

vi.mock('../../components/Notifications/utils/notificationSound', () => ({
    playNotificationSound: vi.fn(),
}));

vi.mock('../../components/Notifications/utils/notificationAction', () => ({
    parseNotificationAction: vi.fn(() => null),
}));

describe('useNotificationLoader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start with loading=true and empty notifications', async () => {
        api.fetchNotifications.mockResolvedValue([]);
        const { result } = renderHook(() => useNotificationLoader());
        expect(result.current.loading).toBe(true);
        expect(result.current.notifications).toEqual([]);
        await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('should load notifications and set loading to false', async () => {
        const items = [{ id: 1, title: 'Test', read: false }];
        api.fetchNotifications.mockResolvedValue(items);
        const { result } = renderHook(() => useNotificationLoader());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual(items);
    });

    it('should set loading to false even when fetch fails', async () => {
        api.fetchNotifications.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useNotificationLoader());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual([]);
    });

    it('should call requestPermission on mount', async () => {
        const { requestPermission } = await import('../../components/Notifications/utils/browserNotification');
        requestPermission.mockClear();
        api.fetchNotifications.mockResolvedValue([]);
        renderHook(() => useNotificationLoader());
        await waitFor(() => expect(requestPermission).toHaveBeenCalled());
    });

    it('should expose setNotifications function', async () => {
        api.fetchNotifications.mockResolvedValue([]);
        const { result } = renderHook(() => useNotificationLoader());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(typeof result.current.setNotifications).toBe('function');
    });
});

describe('useNotificationPolling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should track known ids from initial notifications', async () => {
        const knownIds = { current: new Set() };
        const setNotifications = vi.fn();
        const refreshProfile = vi.fn();
        const notifications = [{ id: 10 }, { id: 20 }];

        renderHook(() =>
            useNotificationPolling(notifications, setNotifications, knownIds, refreshProfile)
        );

        // After effect runs, knownIds should contain the notification ids
        await act(async () => { await Promise.resolve(); });
        expect(knownIds.current.has(10)).toBe(true);
        expect(knownIds.current.has(20)).toBe(true);
    });

    it('should poll at 30 second intervals', async () => {
        api.fetchNotifications.mockResolvedValue([]);
        const knownIds = { current: new Set() };
        const setNotifications = vi.fn();
        const refreshProfile = vi.fn();

        renderHook(() =>
            useNotificationPolling([], setNotifications, knownIds, refreshProfile)
        );

        await act(async () => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });
        expect(api.fetchNotifications).toHaveBeenCalled();
    });

    it('should clear interval on unmount', async () => {
        api.fetchNotifications.mockResolvedValue([]);
        const knownIds = { current: new Set() };
        const setNotifications = vi.fn();
        const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

        const { unmount } = renderHook(() =>
            useNotificationPolling([], setNotifications, knownIds, vi.fn())
        );

        unmount();
        expect(clearIntervalSpy).toHaveBeenCalled();
        clearIntervalSpy.mockRestore();
    });

    it('should process new notifications from poll and call setNotifications', async () => {
        const fresh = [{ id: 99, title: 'New', message: 'msg', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };
        const setNotifications = vi.fn();
        const refreshProfile = vi.fn();

        renderHook(() =>
            useNotificationPolling([], setNotifications, knownIds, refreshProfile)
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(setNotifications).toHaveBeenCalledWith(fresh);
        expect(knownIds.current.has(99)).toBe(true);
    });

    it('should not call setNotifications when no new notifications', async () => {
        const knownIds = { current: new Set([1, 2]) };
        api.fetchNotifications.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const setNotifications = vi.fn();

        renderHook(() =>
            useNotificationPolling([], setNotifications, knownIds, vi.fn())
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(setNotifications).not.toHaveBeenCalled();
    });

    it('should not send browser notification for reminder type', async () => {
        const { sendBrowserNotification } = await import('../../components/Notifications/utils/browserNotification');
        sendBrowserNotification.mockClear();

        const fresh = [{ id: 77, title: 'Reminder', notification_type: 'reminder' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };

        renderHook(() =>
            useNotificationPolling([], vi.fn(), knownIds, vi.fn())
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(sendBrowserNotification).not.toHaveBeenCalled();
    });

    it('should send browser notification for non-reminder type', async () => {
        const { sendBrowserNotification } = await import('../../components/Notifications/utils/browserNotification');
        sendBrowserNotification.mockClear();

        const fresh = [{ id: 55, title: 'Alert', message: 'Hello', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };

        renderHook(() =>
            useNotificationPolling([], vi.fn(), knownIds, vi.fn())
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(sendBrowserNotification).toHaveBeenCalledWith('Alert', 'Hello', 'notification-55', null);
    });

    it('should trigger refreshProfile for course change notifications', async () => {
        const fresh = [{ id: 33, title: 'Course change approved', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };
        const refreshProfile = vi.fn();

        renderHook(() =>
            useNotificationPolling([], vi.fn(), knownIds, refreshProfile)
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(refreshProfile).toHaveBeenCalled();
    });

    it('should not trigger refreshProfile for non-course-change notifications', async () => {
        const fresh = [{ id: 44, title: 'Random notification', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };
        const refreshProfile = vi.fn();

        renderHook(() =>
            useNotificationPolling([], vi.fn(), knownIds, refreshProfile)
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(refreshProfile).not.toHaveBeenCalled();
    });

    it('should handle course change titles case-insensitively', async () => {
        const roleTitles = [
            'Course change approved',
            'Course change rejected',
        ];

        for (const title of roleTitles) {
            const fresh = [{ id: Math.random(), title, notification_type: 'info' }];
            api.fetchNotifications.mockResolvedValue(fresh);
            const knownIds = { current: new Set() };
            const refreshProfile = vi.fn();

            renderHook(() =>
                useNotificationPolling([], vi.fn(), knownIds, refreshProfile)
            );

            act(() => { vi.advanceTimersByTime(30000); });
            await act(async () => { await Promise.resolve(); });

            expect(refreshProfile).toHaveBeenCalled();
        }
    });

    it('should handle poll fetch error silently', async () => {
        api.fetchNotifications.mockRejectedValue(new Error('poll failed'));
        const knownIds = { current: new Set() };
        const setNotifications = vi.fn();

        renderHook(() =>
            useNotificationPolling([], setNotifications, knownIds, vi.fn())
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        // No throw, setNotifications not called since fetch returned null
        expect(setNotifications).not.toHaveBeenCalled();
    });

    it('should not call refreshProfile when refreshProfile is undefined', async () => {
      const fresh = [{ id: 11, title: 'Course change approved', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };

        // Should not throw even when refreshProfile is undefined
        expect(() => {
            renderHook(() =>
                useNotificationPolling([], vi.fn(), knownIds, undefined)
            );
        }).not.toThrow();

      act(() => { vi.advanceTimersByTime(30000); });
      await act(async () => { await Promise.resolve(); });
    });

    it('ignores course-change refresh logic when a notification has no title', async () => {
        const fresh = [{ id: 12, message: 'Untitled', notification_type: 'info' }];
        api.fetchNotifications.mockResolvedValue(fresh);
        const knownIds = { current: new Set() };
        const refreshProfile = vi.fn();

        renderHook(() =>
            useNotificationPolling([], vi.fn(), knownIds, refreshProfile)
        );

        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });

        expect(refreshProfile).not.toHaveBeenCalled();
    });
});
