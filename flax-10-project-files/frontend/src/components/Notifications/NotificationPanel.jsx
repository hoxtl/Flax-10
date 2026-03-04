import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { useNotifications } from '../../context/NotificationContext';

import './NotificationPanel.css';

export function NotificationPanel() {
    const { isOpen, notifications, closePanel, markAllRead, dismissNotification, clearAll } = useNotifications();
    const panelRef = useRef(null);

    useClickOutside(panelRef, closePanel, isOpen);

    if (!isOpen) return null;

    return (
        <div className="notification-panel" ref={panelRef}>
            <PanelHeader onMarkAllRead={markAllRead} onClearAll={clearAll} count={notifications.length} />
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

function PanelHeader({ onMarkAllRead, onClearAll, count }) {
    return (
        <div className="notification-panel-header">
            <h3>Notifications</h3>
            <HeaderActions count={count} onMarkAllRead={onMarkAllRead} onClearAll={onClearAll} />
        </div>
    );
}

function HeaderActions({ count, onMarkAllRead, onClearAll }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useClickOutside(ref, () => setIsOpen(false), isOpen);

    if (count === 0) return null;

    return (
        <div className="action-menu-container" ref={ref}>
            <MenuTrigger onClick={() => setIsOpen(!isOpen)} />
            {isOpen && <MenuDropdown onRead={onMarkAllRead} onClear={onClearAll} close={() => setIsOpen(false)} />}
        </div>
    );
}

function MenuTrigger({ onClick }) {
    return (
        <button className="action-menu-btn" onClick={onClick}>
            <MoreHorizontal size={18} />
        </button>
    );
}

function MenuDropdown({ onRead, onClear, close }) {
    return (
        <div className="action-menu">
            <button className="action-menu-item" onClick={() => { onRead(); close(); }}>Mark all read</button>
            <button className="action-menu-item danger" onClick={() => { onClear(); close(); }}>Clear all</button>
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
    const { id, title, message, read, created_at, action_url } = notification;

    const handleClick = (e) => {
        // Prevent click if they clicked the dismiss button
        if (e.target.closest('.dismiss-btn')) return;
        if (action_url) {
            // Trigger a custom event that App.jsx can listen to for navigation, 
            // since NotificationPanel might not have access to standard router context 
            // if it's placed outside Routes, OR use standard window event:
            window.location.hash = `#${action_url}`; // For HashRouter
            // But since this app uses standard path routing via activeNav state:
            const event = new CustomEvent('navigate', { detail: action_url.replace(/^\//, '') });
            window.dispatchEvent(event);
        }
    };

    return (
        <li className={`notification-item ${read ? '' : 'unread'} ${action_url ? 'clickable' : ''}`} onClick={handleClick}>
            <div className="notification-content">
                <span className="notification-title">{title}</span>
                <span className="notification-message">{message}</span>
                <span className="notification-time">{formatTime(created_at)}</span>
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
