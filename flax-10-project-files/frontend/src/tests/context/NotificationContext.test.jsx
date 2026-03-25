import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';
import * as api from '../../api/notificationApi';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ refreshProfile: vi.fn() }),
}));

vi.mock('../../api/notificationApi', () => ({
    fetchNotifications: vi.fn(),
    createNotification: vi.fn(),
    deleteNotification: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    clearAllNotifications: vi.fn(),
}));

vi.mock('../../components/Notifications/utils/browserNotification', () => ({
    requestPermission: vi.fn(),
    sendBrowserNotification: vi.fn(),
}));

vi.mock('../../components/Notifications/utils/notificationSound', () => ({
    playNotificationSound: vi.fn(),
}));

const TestComponent = () => {
    const {
        notifications,
        addNotification,
        dismissNotification,
        markAllRead,
        clearAll,
        hasUnread,
        isOpen,
        togglePanel,
        closePanel
    } = useNotifications();

    return (
        <div>
            <div data-testid="count">{notifications.length}</div>
            <div data-testid="unread">{hasUnread ? 'yes' : 'no'}</div>
            <div data-testid="isOpen">{isOpen ? 'open' : 'closed'}</div>
            <button onClick={() => addNotification({ title: 'New' })}>Add</button>
            <button onClick={() => dismissNotification(1)}>Dismiss</button>
            <button onClick={markAllRead}>Read All</button>
            <button onClick={clearAll}>Clear</button>
            <button onClick={togglePanel}>Toggle</button>
            <button onClick={closePanel}>Close</button>
        </div>
    );
};

describe('NotificationContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchNotifications.mockResolvedValue([]);
    });

    it('should load notifications on mount', async () => {
        api.fetchNotifications.mockResolvedValue([{ id: 1, title: 'Test', read: false }]);
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
        expect(screen.getByTestId('unread')).toHaveTextContent('yes');
    });

    it('should add notification', async () => {
        api.createNotification.mockResolvedValue({ id: 2, title: 'New', read: false });
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        await act(async () => {
            screen.getByText('Add').click();
        });

        expect(api.createNotification).toHaveBeenCalled();
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    });

    it('should dismiss notification', async () => {
        api.fetchNotifications.mockResolvedValue([{ id: 1, title: 'Test', read: false }]);
        api.deleteNotification.mockResolvedValue({});

        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

        await act(async () => {
            screen.getByText('Dismiss').click();
        });

        expect(api.deleteNotification).toHaveBeenCalledWith(1);
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
    });

    it('should handle toggle and close panel', async () => {
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        expect(screen.getByTestId('isOpen')).toHaveTextContent('closed');

        await act(async () => { screen.getByText('Toggle').click(); });
        expect(screen.getByTestId('isOpen')).toHaveTextContent('open');

        await act(async () => { screen.getByText('Close').click(); });
        expect(screen.getByTestId('isOpen')).toHaveTextContent('closed');
    });

    it('should mark all read', async () => {
        api.fetchNotifications.mockResolvedValue([{ id: 1, read: false }]);
        api.markAllNotificationsRead.mockResolvedValue({});

        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('yes'));

        await act(async () => {
            screen.getByText('Read All').click();
        });

        expect(api.markAllNotificationsRead).toHaveBeenCalled();
        await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('no'));
    });

    it('should clear all', async () => {
        api.fetchNotifications.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        api.clearAllNotifications.mockResolvedValue({});

        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));

        await act(async () => {
            screen.getByText('Clear').click();
        });

        expect(api.clearAllNotifications).toHaveBeenCalled();
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
    });

    it('should handle API errors gracefully', async () => {
        api.fetchNotifications.mockRejectedValue(new Error('Fetch failed'));
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        // Wait for mount fetch to settle (silently swallowed by source)
        await act(async () => { await Promise.resolve(); });
        // Create error - source silently swallows, should not throw
        api.createNotification.mockRejectedValue(new Error('Create failed'));
        await act(async () => { screen.getByText('Add').click(); });
        // Delete error - source silently swallows
        api.deleteNotification.mockRejectedValue(new Error('Delete failed'));
        api.fetchNotifications.mockResolvedValue([{ id: 1 }]);
        await act(async () => { screen.getByText('Dismiss').click(); });
        // Mark read error - source silently swallows
        api.markAllNotificationsRead.mockRejectedValue(new Error('Mark read failed'));
        await act(async () => { screen.getByText('Read All').click(); });
        // Clear error - source silently swallows
        api.clearAllNotifications.mockRejectedValue(new Error('Clear failed'));
        await act(async () => { screen.getByText('Clear').click(); });
        // All operations completed without throwing
        expect(screen.getByTestId('count')).toBeInTheDocument();
    });

    it('should throw error when used outside provider', () => {
        // Prevent console.error from React
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => renderHook(() => useNotifications())).toThrow('useNotifications must be used within NotificationProvider');

        consoleSpy.mockRestore();
    });

    it('should handle poll fetch error', async () => {
        vi.useFakeTimers();
        api.fetchNotifications.mockResolvedValue([]);
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await act(async () => { vi.advanceTimersByTime(0); });
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        // Poll error is silently swallowed by source (uses .catch(() => null))
        api.fetchNotifications.mockRejectedValueOnce(new Error('poll failed'));
        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });
        // Count stays 0 since poll error was silently swallowed
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        vi.useRealTimers();
    });

    it('should process new notifications from poll and notify user', async () => {
        const { sendBrowserNotification } = await import('../../components/Notifications/utils/browserNotification');
        vi.useFakeTimers();
        api.fetchNotifications.mockResolvedValueOnce([]);
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await act(async () => { vi.advanceTimersByTime(0); });
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        api.fetchNotifications.mockResolvedValueOnce([
            { id: 99, title: 'Polled', message: 'New from poll', notification_type: 'info' },
        ]);
        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });
        expect(screen.getByTestId('count')).toHaveTextContent('1');
        expect(sendBrowserNotification).toHaveBeenCalledWith('Polled', 'New from poll', 'notification-99', null);
        vi.useRealTimers();
    });

    it('should not send browser notification for reminder type from poll', async () => {
        const { sendBrowserNotification } = await import('../../components/Notifications/utils/browserNotification');
        sendBrowserNotification.mockClear();
        vi.useFakeTimers();
        api.fetchNotifications.mockResolvedValueOnce([]);
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );
        await act(async () => { vi.advanceTimersByTime(0); });
        expect(screen.getByTestId('count')).toHaveTextContent('0');
        api.fetchNotifications.mockResolvedValueOnce([
            { id: 88, title: 'Reminder', message: 'Task due', notification_type: 'reminder' },
        ]);
        act(() => { vi.advanceTimersByTime(30000); });
        await act(async () => { await Promise.resolve(); });
        expect(screen.getByTestId('count')).toHaveTextContent('1');
        expect(sendBrowserNotification).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});
