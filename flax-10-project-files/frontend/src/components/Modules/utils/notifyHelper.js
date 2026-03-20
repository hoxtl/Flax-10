/** Factory for creating notification helper from addNotification context. */
export function createNotify(addNotification) {
    return (message, type) => addNotification({
        title: type === 'error' ? '⚠️ Action failed' : '✓ Done',
        message
    });
}
