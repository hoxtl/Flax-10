/*
 * Factory for creating a notification helper.
 */

export function createNotify(addNotification) {
    return (message, type) => addNotification({
        title: type === 'error' ? '⚠️ Action failed' : '✓ Done',
        message
    });
}
