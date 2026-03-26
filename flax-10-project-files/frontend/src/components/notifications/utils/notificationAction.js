/**
 * Shared utilities for clickable notification actions.
 * Handles navigation, scroll-to-element, and event popup functionality.
 */

export function createNotificationAction(url, scrollToId = null) {
    if (!url) return null;
    return { url, scrollToId };
}

export function createEventPopupAction(eventId) {
    if (!eventId) return null;
    return { url: 'calendar', eventId, openPopup: true };
}

export function parseNotificationAction(notification) {
    if (notification.action) return notification.action;
    if (notification.action_url) return buildActionFromUrl(notification);
    return null;
}

function buildActionFromUrl(notification) {
    if (isReminderNotification(notification)) {
        return { url: 'calendar', eventId: notification.scroll_to_id, openPopup: true };
    }
    return { url: notification.action_url, scrollToId: notification.scroll_to_id || null };
}

function isReminderNotification(notification) {
    return notification.notification_type === 'reminder' && notification.scroll_to_id;
}

export function hasNotificationAction(notification) {
    return !!(notification.action || notification.action_url);
}

export function executeNotificationAction(action) {
    if (!action?.url) return;
    navigateToUrl(action.url);
    if (action.openPopup && action.eventId) scheduleEventPopup(action.eventId);
    else if (action.scrollToId) handleScrollToId(action.scrollToId);
}

function handleScrollToId(scrollToId) {
    if (isEventId(scrollToId)) scheduleEventPopup(scrollToId);
    else scheduleScrollTo(scrollToId);
}

function isEventId(id) {
    return /^\d+$/.test(id);
}

function navigateToUrl(url) {
    // Check if the URL is an old prefixed navigation string (like "societies_1")
    if (url && !url.startsWith('/') && url.includes('_') && !url.includes('?')) {
        window.dispatchEvent(new CustomEvent('navigate', { detail: url }));
        return;
    }

    // For proper deep links (like "/societies?id=1") or activeNav updates, pass as is
    const activeNavState = url.startsWith('/') ? url : `/${url}`;
    window.dispatchEvent(new CustomEvent('navigate', { detail: activeNavState }));
}

function scheduleEventPopup(eventId) {
    setTimeout(() => dispatchOpenEventPopup(eventId), 300);
}

function dispatchOpenEventPopup(eventId) {
    window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId } }));
}

function scheduleScrollTo(elementId) {
    setTimeout(() => scrollToElement(elementId), 300);
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightElement(element);
}

function highlightElement(element) {
    element.classList.add('notification-highlight');
    setTimeout(() => element.classList.remove('notification-highlight'), 2000);
}
