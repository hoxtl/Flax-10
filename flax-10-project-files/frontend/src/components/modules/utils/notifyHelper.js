/*
 * Factory for creating a notification helper.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function createNotify(addNotification) {
    return (message, type) => addNotification({
        title: type === 'error' ? '⚠️ Action failed' : '✓ Done',
        message
    });
}
