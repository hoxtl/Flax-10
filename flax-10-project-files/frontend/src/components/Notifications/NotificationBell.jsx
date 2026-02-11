import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

export function NotificationBell() {
    const { hasUnread, notifications, togglePanel, isOpen } = useNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <button className="notification-bell" onClick={togglePanel} aria-label="Notifications">
            <BellIcon active={isOpen} />
            {hasUnread && <NotificationBadge count={unreadCount} />}
        </button>
    );
}

function BellIcon({ active }) {
    return (
        <svg viewBox="0 0 24 24" fill={active ? '#7a5d3d' : '#9E7E5D'} className="bell-icon">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
    );
}

function NotificationBadge({ count }) {
    if (count === 0) return null;
    const display = count > 9 ? '9+' : count;
    return <span className="notification-badge">{display}</span>;
}
