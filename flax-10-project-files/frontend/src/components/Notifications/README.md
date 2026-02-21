# Notification System Guidelines

This guide explains how to use the `useNotify` hook to send notifications in the Flax-10 frontend. This hook unifies **Browser Notifications**, **In-App Toasts**, and **Notification Sounds** into a single function call.

## The `useNotify` Hook

The `useNotify` hook provides a simple function to trigger notifications. It handles:
1.  **Browser Notification**: Sends a system-level notification (if permission is granted).
2.  **In-App Toast**: Displays a toast message at the bottom of the app.
3.  **Sound**: Plays a subtle notification sound.
4.  **Backend Persistence**: Saves the notification to the database via the API.

### Location
`src/components/Notifications/hooks/useNotify.js`

### Usage

1.  **Import the Hook**:
    ```javascript
    import { useNotify } from '../../components/Notifications/hooks/useNotify'; // Adjust path as needed
    ```

2.  **Initialize Inside Component**:
    ```javascript
    const notify = useNotify();
    ```

3.  **Call the Function**:
    ```javascript
    notify("Lecture Starting", "Your Software Engineering lecture starts in 10 minutes.");
    ```

### Signature
```javascript
notify(title, message, options)
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | The bold title of the notification (e.g., "New Event"). |
| `message` | `string` | **Yes** | The body text of the notification. |
| `options` | `object` | No | Optional settings. Currently supports `{ tag: string }` for grouping browser notifications. |

### Example Implementation

Here is an example of how to use it in a component (e.g., when a timer finishes):

```javascript
import React from 'react';
import { useNotify } from '../components/Notifications/hooks/useNotify';

export function TimerButton() {
    // 1. Get the notify function
    const notify = useNotify();

    const handleTimerFinish = () => {
        // ... timer logic ...

        // 2. Trigger notification
        notify(
            "Timer Finished",           // Title
            "Your 25-minute focus session is complete!" // Message
        );
    };

    return <button onClick={handleTimerFinish}>Start Timer</button>;
}
```

## Best Practices

-   **Concise Titles**: Keep titles short and clear (2-4 words).
-   **Actionable Messages**: The message should tell the user what happened or what to do next.
-   **Don't Overuse**: Only notify for important events to avoid "notification fatigue".
