/**
 * Shared utilities for clickable notification actions.
 * Handles navigation and scroll-to-element functionality.
 */

export function createNotificationAction(url, scrollToId = null) {
    if (!url) return null;
    return { url, scrollToId };
}

export function parseNotificationAction(notification) {
    if (notification.action) return notification.action;
    if (notification.action_url) return { url: notification.action_url, scrollToId: notification.scroll_to_id || null };
    return null;
}

export function hasNotificationAction(notification) {
    return !!(notification.action || notification.action_url);
}

export function executeNotificationAction(action) {
    if (!action?.url) return;
    navigateToUrl(action.url);
    if (action.scrollToId) scheduleScrollTo(action.scrollToId);
}

function navigateToUrl(url) {
    const path = url.replace(/^\//, '');
    window.dispatchEvent(new CustomEvent('navigate', { detail: path }));
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
