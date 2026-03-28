import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotify } from '../../../components/notifications/hooks/useNotify';

vi.mock('../../../context/NotificationContext', () => ({
    useNotifications: vi.fn(() => ({ addNotification: vi.fn() })),
}));

vi.mock('../../../components/notifications/utils/browserNotification', () => ({
    sendBrowserNotification: vi.fn(),
}));

vi.mock('../../../components/notifications/utils/notificationSound', () => ({
    playNotificationSound: vi.fn(),
}));

vi.mock('../../../components/notifications/utils/notificationAction', () => ({
    createNotificationAction: vi.fn((url, scrollToId) => ({ url, scrollToId })),
}));

import { useNotifications } from '../../../context/NotificationContext';
import { sendBrowserNotification } from '../../../components/notifications/utils/browserNotification';
import { playNotificationSound } from '../../../components/notifications/utils/notificationSound';
import { createNotificationAction } from '../../../components/notifications/utils/notificationAction';

describe('useNotify', () => {
    let addNotification;

    beforeEach(() => {
        vi.clearAllMocks();
        addNotification = vi.fn();
        useNotifications.mockReturnValue({ addNotification });
    });

    it('returns a notify function', () => {
        const { result } = renderHook(() => useNotify());
        expect(typeof result.current).toBe('function');
    });

    it('calls sendBrowserNotification with title and message', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('Hello', 'World');
        });
        expect(sendBrowserNotification).toHaveBeenCalledWith('Hello', 'World', undefined, expect.anything());
    });

    it('calls playNotificationSound', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('Test', 'Msg');
        });
        expect(playNotificationSound).toHaveBeenCalledTimes(1);
    });

    it('calls addNotification with correct payload', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('Title', 'Message', { url: '/path', notificationType: 'alert' });
        });
        expect(addNotification).toHaveBeenCalledWith({
            title: 'Title',
            message: 'Message',
            action_url: '/path',
            scroll_to_id: null,
            notification_type: 'alert',
        });
    });

    it('defaults notification_type to "general"', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('T', 'M');
        });
        expect(addNotification).toHaveBeenCalledWith(expect.objectContaining({
            notification_type: 'general',
        }));
    });

    it('passes scrollToId to createNotificationAction', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('T', 'M', { scrollToId: 'section-1' });
        });
        expect(createNotificationAction).toHaveBeenCalledWith(undefined, 'section-1');
    });

    it('passes tag option to sendBrowserNotification', () => {
        const { result } = renderHook(() => useNotify());
        act(() => {
            result.current('T', 'M', { tag: 'my-tag' });
        });
        expect(sendBrowserNotification).toHaveBeenCalledWith('T', 'M', 'my-tag', expect.anything());
    });
});
