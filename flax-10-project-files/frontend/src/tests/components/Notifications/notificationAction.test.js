import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createNotificationAction,
    createEventPopupAction,
    parseNotificationAction,
    hasNotificationAction,
    executeNotificationAction,
} from '../../../components/Notifications/utils/notificationAction';

describe('createNotificationAction', () => {
    it('returns null when url is falsy', () => {
        expect(createNotificationAction(null)).toBeNull();
        expect(createNotificationAction(undefined)).toBeNull();
        expect(createNotificationAction('')).toBeNull();
    });

    it('returns action object with url and scrollToId', () => {
        expect(createNotificationAction('/settings', 'section-1')).toEqual({ url: '/settings', scrollToId: 'section-1' });
    });

    it('defaults scrollToId to null when not provided', () => {
        expect(createNotificationAction('/home')).toEqual({ url: '/home', scrollToId: null });
    });
});

describe('createEventPopupAction', () => {
    it('returns null when eventId is falsy', () => {
        expect(createEventPopupAction(null)).toBeNull();
        expect(createEventPopupAction(0)).toBeNull();
        expect(createEventPopupAction('')).toBeNull();
    });

    it('returns action object with url=calendar, eventId, openPopup=true', () => {
        expect(createEventPopupAction(42)).toEqual({ url: 'calendar', eventId: 42, openPopup: true });
    });
});

describe('parseNotificationAction', () => {
    it('returns notification.action directly if present', () => {
        const action = { url: '/calendar' };
        expect(parseNotificationAction({ action })).toBe(action);
    });

    it('returns null when no action or action_url', () => {
        expect(parseNotificationAction({})).toBeNull();
    });

    it('builds popup action for reminder notification with scroll_to_id', () => {
        const notification = { action_url: 'calendar', notification_type: 'reminder', scroll_to_id: '5' };
        expect(parseNotificationAction(notification)).toEqual({ url: 'calendar', eventId: '5', openPopup: true });
    });

    it('builds url-based action for non-reminder notification', () => {
        const notification = { action_url: '/societies', scroll_to_id: 'society-2' };
        expect(parseNotificationAction(notification)).toEqual({ url: '/societies', scrollToId: 'society-2' });
    });

    it('sets scrollToId to null when scroll_to_id is absent on non-reminder', () => {
        const notification = { action_url: '/home' };
        expect(parseNotificationAction(notification)).toEqual({ url: '/home', scrollToId: null });
    });

    it('does not treat reminder notification without scroll_to_id as popup action', () => {
        const notification = { action_url: 'calendar', notification_type: 'reminder' };
        const result = parseNotificationAction(notification);
        // isReminderNotification is false because scroll_to_id is falsy
        expect(result).toEqual({ url: 'calendar', scrollToId: null });
    });
});

describe('hasNotificationAction', () => {
    it('returns true when action is present', () => {
        expect(hasNotificationAction({ action: { url: '/x' } })).toBe(true);
    });

    it('returns true when action_url is present', () => {
        expect(hasNotificationAction({ action_url: '/x' })).toBe(true);
    });

    it('returns false when neither action nor action_url', () => {
        expect(hasNotificationAction({})).toBe(false);
    });
});

describe('executeNotificationAction', () => {
    let dispatchSpy;

    function getDispatchedEvents(type) {
        return dispatchSpy.mock.calls
            .map(([event]) => ({ type: event.type, detail: event.detail }))
            .filter((event) => !type || event.type === type);
    }

    beforeEach(() => {
        vi.useFakeTimers();
        dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        dispatchSpy.mockRestore();
    });

    it('does nothing when action is null or has no url', () => {
        executeNotificationAction(null);
        executeNotificationAction({});
        expect(getDispatchedEvents()).toHaveLength(0);
    });

    it('dispatches navigate event for old underscore prefixed url', () => {
        executeNotificationAction({ url: 'societies_1' });
        expect(getDispatchedEvents('navigate')).toEqual([{ type: 'navigate', detail: 'societies_1' }]);
    });

    it('dispatches navigate with /url prefix for simple nav strings', () => {
        executeNotificationAction({ url: 'calendar' });
        expect(getDispatchedEvents('navigate')).toEqual([{ type: 'navigate', detail: '/calendar' }]);
    });

    it('dispatches navigate with url as-is when it starts with /', () => {
        executeNotificationAction({ url: '/societies?id=1' });
        expect(getDispatchedEvents('navigate')).toEqual([{ type: 'navigate', detail: '/societies?id=1' }]);
    });

    it('schedules open-event-popup when openPopup is true', () => {
        executeNotificationAction({ url: 'calendar', openPopup: true, eventId: 7 });
        expect(getDispatchedEvents()).toHaveLength(1);
        vi.advanceTimersByTime(300);
        expect(getDispatchedEvents()).toHaveLength(2);
        expect(getDispatchedEvents('open-event-popup')).toEqual([{ type: 'open-event-popup', detail: { eventId: 7 } }]);
    });

    it('schedules open-event-popup when scrollToId is a numeric string', () => {
        executeNotificationAction({ url: 'calendar', scrollToId: '42' });
        vi.advanceTimersByTime(300);
        const popup = getDispatchedEvents('open-event-popup')[0];
        expect(popup).toBeDefined();
        expect(popup.detail).toEqual({ eventId: '42' });
    });

    it('schedules scrollIntoView when scrollToId is a non-numeric string and element exists', () => {
        const el = document.createElement('div');
        el.id = 'deadline-card';
        el.scrollIntoView = vi.fn();
        document.body.appendChild(el);

        executeNotificationAction({ url: '/home', scrollToId: 'deadline-card' });
        vi.advanceTimersByTime(300);
        expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

        // highlight class removed after 2 seconds
        expect(el.classList.contains('notification-highlight')).toBe(true);
        vi.advanceTimersByTime(2000);
        expect(el.classList.contains('notification-highlight')).toBe(false);

        document.body.removeChild(el);
    });

    it('does not throw when scrollToId element does not exist', () => {
        executeNotificationAction({ url: '/home', scrollToId: 'non-existent-element' });
        expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    });
});
