import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Reset module state between tests
let browserNotification;

const mockNotification = (permission = 'granted') => {
    const instances = [];
    const NotifConstructor = vi.fn(function (title, opts) {
        this.title = title;
        this.opts = opts;
        this.onclick = null;
        instances.push(this);
    });
    NotifConstructor.permission = permission;
    NotifConstructor.requestPermission = vi.fn().mockResolvedValue(permission);
    NotifConstructor._instances = instances;
    vi.stubGlobal('Notification', NotifConstructor);
    return NotifConstructor;
};

describe('browserNotification: requestPermission', () => {
    beforeEach(async () => {
        vi.resetModules();
        browserNotification = await import('../../components/notifications/utils/browserNotification');
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('requests permission when Notification is default', () => {
        const Notif = mockNotification('default');
        browserNotification.requestPermission();
        expect(Notif.requestPermission).toHaveBeenCalled();
    });

    it('does nothing when permission is already granted', () => {
        const Notif = mockNotification('granted');
        browserNotification.requestPermission();
        // requestPermission should NOT be called when permission is not 'default'
        expect(Notif.requestPermission).not.toHaveBeenCalled();
    });

    it('does nothing if Notification not in window', () => {
        const original = global.Notification;
        delete global.Notification;
        expect(() => browserNotification.requestPermission()).not.toThrow();
        global.Notification = original;
    });
});

describe('browserNotification: sendBrowserNotification', () => {
    beforeEach(async () => {
        vi.resetModules();
        localStorage.clear();
        browserNotification = await import('../../components/notifications/utils/browserNotification');
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('sends notification when permission is granted', () => {
        const Notif = mockNotification('granted');
        browserNotification.sendBrowserNotification('Test Title', 'Test Body');
        expect(Notif).toHaveBeenCalledWith('Test Title', expect.objectContaining({ body: 'Test Body' }));
    });

    it('does not send if permission is not granted', () => {
        const Notif = mockNotification('denied');
        browserNotification.sendBrowserNotification('Title', 'Body');
        expect(Notif).not.toHaveBeenCalled();
    });

    it('does not send duplicate notification with same tag', () => {
        const Notif = mockNotification('granted');
        browserNotification.sendBrowserNotification('Title', 'Body', 'my-tag');
        browserNotification.sendBrowserNotification('Title', 'Body', 'my-tag');
        expect(Notif).toHaveBeenCalledTimes(1);
    });

    it('sets onclick handler when action is provided', () => {
        const Notif = mockNotification('granted');
        browserNotification.sendBrowserNotification('Title', 'Body', null, { url: '/timer' });
        const instance = Notif._instances[0];
        expect(typeof instance.onclick).toBe('function');
    });

    it('calls window.focus and executeNotificationAction on notification click', async () => {
        vi.resetModules();
        vi.mock('../../components/notifications/utils/notificationAction', () => ({
            executeNotificationAction: vi.fn(),
        }));
        browserNotification = await import('../../components/notifications/utils/browserNotification');
        const { executeNotificationAction } = await import('../../components/notifications/utils/notificationAction');

        const Notif = mockNotification('granted');
        const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {});

        browserNotification.sendBrowserNotification('Title', 'Body', null, { url: '/timer' });
        const instance = Notif._instances[0];
        instance.onclick();

        expect(focusSpy).toHaveBeenCalled();
        expect(executeNotificationAction).toHaveBeenCalledWith({ url: '/timer' });
        focusSpy.mockRestore();
    });
});
