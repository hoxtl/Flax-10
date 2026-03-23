/*
 * Notification dropdown panel and actions.
 */

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { executeNotificationAction, hasNotificationAction, parseNotificationAction } from "./utils/notificationAction";
import "./NotificationPanel.css";

export function NotificationPanel() {
  const { isOpen, notifications, closePanel, markAllRead, dismissNotification, clearAll } = useNotifications();
  const panelRef = useRef(null);
  useClickOutside(panelRef, closePanel, isOpen);
  if (!isOpen) return null;
  return (
    <div className="notification-panel" ref={panelRef}>
      <PanelHeader count={notifications.length} onMarkAllRead={markAllRead} onClearAll={clearAll} />
      <NotificationList notifications={notifications} onDismiss={dismissNotification} onClose={closePanel} />
    </div>
  );
}

function useClickOutside(ref, handler, isActive) {
  useEffect(() => {
    if (!isActive) return;
    const handleClick = (event) => ref.current && !ref.current.contains(event.target) && handler();
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
      <MenuTrigger onClick={() => setIsOpen((current) => !current)} />
      {isOpen && <MenuDropdown onRead={onMarkAllRead} onClear={onClearAll} close={() => setIsOpen(false)} />}
    </div>
  );
}

function MenuTrigger({ onClick }) {
  return <button className="action-menu-btn" onClick={onClick}><MoreHorizontal size={18} /></button>;
}

function MenuDropdown({ onRead, onClear, close }) {
  return (
    <div className="action-menu">
      <button className="action-menu-item" onClick={() => runMenuAction(onRead, close)}>Mark all read</button>
      <button className="action-menu-item danger" onClick={() => runMenuAction(onClear, close)}>Clear all</button>
    </div>
  );
}

function runMenuAction(action, close) {
  action();
  close();
}

function NotificationList({ notifications, onDismiss, onClose }) {
  if (notifications.length === 0) return <div className="notification-empty">No notifications</div>;
  return <ul className="notification-list">{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onDismiss={onDismiss} onClose={onClose} />)}</ul>;
}

function NotificationItem({ notification, onDismiss, onClose }) {
  const isClickable = hasNotificationAction(notification);
  const itemClassName = getNotificationItemClassName(notification.read, isClickable);
  return (
    <li className={itemClassName} onClick={(event) => handleNotificationClick(event, notification, isClickable, onClose)}>
      <NotificationContent notification={notification} />
      <button className="dismiss-btn" onClick={() => onDismiss(notification.id)}>×</button>
    </li>
  );
}

function handleNotificationClick(event, notification, isClickable, onClose) {
  if (event.target.closest(".dismiss-btn") || !isClickable) return;
  onClose();
  executeNotificationAction(parseNotificationAction(notification));
}

function getNotificationItemClassName(read, isClickable) {
  return `notification-item ${read ? "" : "unread"} ${isClickable ? "clickable" : ""}`;
}

function NotificationContent({ notification }) {
  return (
    <div className="notification-content">
      <span className="notification-title">{notification.title}</span>
      <span className="notification-message">{notification.message}</span>
      <span className="notification-time">{formatTime(notification.created_at)}</span>
    </div>
  );
}

function formatTime(time) {
  if (!time) return "";
  return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
