import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createNotificationAction, createEventPopupAction, parseNotificationAction,
    hasNotificationAction, executeNotificationAction
} from '../../components/notifications/utils/notificationAction';

describe('notificationAction', () => {
    describe('createNotificationAction', () => {
        it('returns null when url is falsy', () => {
            expect(createNotificationAction(null)).toBeNull();
            expect(createNotificationAction('')).toBeNull();
        });
        it('returns action object with url and scrollToId', () => {
            expect(createNotificationAction('/timer', 'sec1')).toEqual({ url: '/timer', scrollToId: 'sec1' });
        });
        it('defaults scrollToId to null', () => {
            expect(createNotificationAction('/timer')).toEqual({ url: '/timer', scrollToId: null });
        });
    });

    describe('createEventPopupAction', () => {
        it('returns null when eventId is falsy', () => {
            expect(createEventPopupAction(null)).toBeNull();
            expect(createEventPopupAction(0)).toBeNull();
        });
        it('returns popup action with eventId', () => {
            expect(createEventPopupAction(42)).toEqual({ url: 'calendar', eventId: 42, openPopup: true });
        });
    });

    describe('parseNotificationAction', () => {
        it('returns action if present directly', () => {
            const notif = { action: { url: 'timer' } };
            expect(parseNotificationAction(notif)).toEqual({ url: 'timer' });
        });
        it('returns null if no action and no action_url', () => {
            expect(parseNotificationAction({})).toBeNull();
        });
        it('builds action from action_url for non-reminder', () => {
            const notif = { action_url: '/timer', scroll_to_id: null };
            const result = parseNotificationAction(notif);
            expect(result).toEqual({ url: '/timer', scrollToId: null });
        });
        it('builds popup action for reminder notification', () => {
            const notif = {
                action_url: '/calendar',
                notification_type: 'reminder',
                scroll_to_id: '99'
            };
            const result = parseNotificationAction(notif);
            expect(result).toEqual({ url: 'calendar', eventId: '99', openPopup: true });
        });
    });

    describe('hasNotificationAction', () => {
        it('returns true when action exists', () => {
            expect(hasNotificationAction({ action: { url: 'x' } })).toBe(true);
        });
        it('returns true when action_url exists', () => {
            expect(hasNotificationAction({ action_url: '/x' })).toBe(true);
        });
        it('returns false when neither exists', () => {
            expect(hasNotificationAction({})).toBe(false);
        });
    });

    describe('executeNotificationAction', () => {
        let dispatchedEvents;
        beforeEach(() => {
            dispatchedEvents = [];
            vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => { dispatchedEvents.push(e); });
            vi.useFakeTimers();
        });
        afterEach(() => {
            vi.restoreAllMocks();
            vi.useRealTimers();
        });

        it('does nothing when action has no url', () => {
            executeNotificationAction(null);
            executeNotificationAction({});
            expect(dispatchedEvents).toHaveLength(0);
        });

        it('navigates when action has url', () => {
            executeNotificationAction({ url: 'timer' });
            expect(dispatchedEvents.some(e => e.type === 'navigate')).toBe(true);
            const navEvent = dispatchedEvents.find(e => e.type === 'navigate');
            expect(navEvent.detail).toBe('/timer');
        });

        it('schedules event popup when openPopup is true', () => {
            executeNotificationAction({ url: 'calendar', openPopup: true, eventId: 42 });
            vi.advanceTimersByTime(400);
            const popupEvent = dispatchedEvents.find(e => e.type === 'open-event-popup');
            expect(popupEvent).toBeDefined();
            expect(popupEvent.detail.eventId).toBe(42);
        });

        it('schedules scroll for numeric scrollToId (treated as eventId)', () => {
            executeNotificationAction({ url: 'timer', scrollToId: '42' });
            vi.advanceTimersByTime(400);
            const popupEvent = dispatchedEvents.find(e => e.type === 'open-event-popup');
            expect(popupEvent).toBeDefined();
        });

        it('scrolls to element for non-numeric scrollToId', () => {
            const el = document.createElement('div');
            el.id = 'section-id';
            el.scrollIntoView = vi.fn();
            document.body.appendChild(el);

            executeNotificationAction({ url: 'timer', scrollToId: 'section-id' });
            vi.advanceTimersByTime(400);

            expect(el.scrollIntoView).toHaveBeenCalled();
            document.body.removeChild(el);
        });

        it('handles missing element gracefully', () => {
            executeNotificationAction({ url: 'timer', scrollToId: 'nonexistent-element' });
            expect(() => vi.advanceTimersByTime(400)).not.toThrow();
        });
    });
});
