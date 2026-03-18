# Notification System Guidelines

This guide explains how to use notifications in Flax-10, including clickable notifications that navigate users to relevant pages.

## The `useNotify` Hook

The `useNotify` hook provides a simple function to trigger notifications. It handles:
1.  **Browser Notification**: Sends a system-level notification (if permission is granted).
2.  **In-App Toast**: Displays a toast message at the bottom of the app.
3.  **Sound**: Plays a subtle notification sound.
4.  **Backend Persistence**: Saves the notification to the database via the API.

### Location
`src/components/Notifications/hooks/useNotify.js`

### Usage

```javascript
import { useNotify } from '../../components/Notifications/hooks/useNotify';

const notify = useNotify();
notify("Lecture Starting", "Your lecture starts in 10 minutes.");
```

### Signature
```javascript
notify(title, message, options)
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | The bold title of the notification. |
| `message` | `string` | **Yes** | The body text of the notification. |
| `options` | `object` | No | See options below. |

## Clickable Notifications

To make a notification clickable, add `url` to the options. When clicked, the user navigates to that page.

### URL Format

Use underscores to separate path segments:

| Destination | URL Format |
| :--- | :--- |
| Home | `home` |
| Calendar | `calendar` |
| Timer | `timer` |
| Profile (own) | `profile` |
| Profile (other user) | `profile_<userId>` |
| Admin page | `admin` |
| Society page | `societies_<id>` |
| Society calendar tab | `societies_<id>_calendar` |
| Society announcements tab | `societies_<id>_announcements` |
| Modules page | `modules` |

### Example: Basic Clickable Notification

```javascript
notify("New Event", "Check out the new workshop!", {
    url: "societies_4_calendar"
});
```

### Example: Scroll to Element

Add `scrollToId` to auto-scroll to a specific element after navigation:

```javascript
notify("New Announcement", "Important update posted!", {
    url: "societies_4_announcements",
    scrollToId: "announcement-123"
});
```

The element with `id="announcement-123"` will be scrolled into view and highlighted.

### Example: Open Event Popup (Calendar Reminders)

For calendar reminders, use `notificationType: 'reminder'` with `scrollToId` set to the event ID:

```javascript
notify("Reminder", "Meeting starts in 10 minutes", {
    notificationType: "reminder",
    url: "calendar",
    scrollToId: "456"  // event ID
});
```

This navigates to calendar and opens the event detail popup.

## Backend Notifications

When creating notifications from the backend (Django), set these fields:

```python
Notification.objects.create(
    user=user,
    title="New event in Chess Club",
    message="Tournament next week!",
    notification_type="society_event",
    action_url="societies_5_calendar",      # clickable destination
    scroll_to_id="announcement-10",         # optional: element to scroll to
)
```

### Non-Clickable Notifications

Leave `action_url` as `None` or empty for notifications that shouldn't navigate:
- Module action not allowed (compulsory module)
- Module added successfully
- Module deleted (notifies enrolled students)
- Society deletion

## Notification Types Reference

| Type | Clickable | Destination |
| :--- | :--- | :--- |
| `society_event` | Yes | Society calendar tab |
| `society_announcement` | Yes | Society announcements tab |
| `society_update` | Yes | Society page |
| `society_deleted` | No | - |
| `ratification_request` | Yes | Admin page |
| `ratification_approved` | Yes | Society page |
| `ratification_rejected` | Yes | Society page |
| `reminder` | Yes | Calendar (opens event popup) |
| `general` | Depends | Set `action_url` as needed |
| `module_deleted` | No | - |

## Best Practices

-   **Concise Titles**: Keep titles short and clear (2-4 words).
-   **Actionable Messages**: Tell the user what happened or what to do next.
-   **Don't Overuse**: Only notify for important events to avoid fatigue.
-   **Use Tags**: Pass a unique `tag` option to prevent duplicate browser notifications.
