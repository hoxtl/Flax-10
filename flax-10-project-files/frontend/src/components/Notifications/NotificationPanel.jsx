import { useNotifications } from '../../context/NotificationContext';
import { useEffect, useRef } from 'react';
import './NotificationPanel.css';

export function NotificationPanel() {
    const { isOpen, notifications, closePanel, markAllRead, dismissNotification } = useNotifications();
    const panelRef = useRef(null);

    useClickOutside(panelRef, closePanel, isOpen);

    if (!isOpen) return null;

    return (
        <div className="notification-panel" ref={panelRef}>
            <PanelHeader onMarkAllRead={markAllRead} count={notifications.length} />
            <NotificationList notifications={notifications} onDismiss={dismissNotification} />
        </div>
    );
}

function useClickOutside(ref, handler, isActive) {
    useEffect(() => {
        if (!isActive) return;

        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) handler();
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, handler, isActive]);
}

function PanelHeader({ onMarkAllRead, count }) {
    return (
        <div className="notification-panel-header">
            <h3>Notifications</h3>
            {count > 0 && (
                <button className="mark-read-btn" onClick={onMarkAllRead}>
                    Mark all read
                </button>
            )}
        </div>
    );
}

function NotificationList({ notifications, onDismiss }) {
    if (notifications.length === 0) {
        return <div className="notification-empty">No notifications</div>;
    }

    return (
        <ul className="notification-list">
            {notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
            ))}
        </ul>
    );
}

function NotificationItem({ notification, onDismiss }) {
    const { id, title, message, read, time } = notification;

    return (
        <li className={`notification-item ${read ? '' : 'unread'}`}>
            <div className="notification-content">
                <span className="notification-title">{title}</span>
                <span className="notification-message">{message}</span>
                <span className="notification-time">{formatTime(time)}</span>
            </div>
            <button className="dismiss-btn" onClick={() => onDismiss(id)}>×</button>
        </li>
    );
}

function formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
