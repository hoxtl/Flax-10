import { useEffect, useState } from "react";
import * as api from "../api/notificationApi";
import { requestPermission, sendBrowserNotification } from "../components/Notifications/utils/browserNotification";
import { playNotificationSound } from "../components/Notifications/utils/notificationSound";
import { parseNotificationAction } from "../components/Notifications/utils/notificationAction";

const POLL_INTERVAL = 30000;

const ROLE_CHANGE_TITLES = new Set([
  "teacher role approved",
  "teacher request rejected",
  "course change approved",
  "course change rejected",
]);

function isRoleChangeNotification(notification) {
  return ROLE_CHANGE_TITLES.has((notification.title || "").toLowerCase());
}

function isReminderNotification(notification) {
  return notification.notification_type === "reminder";
}

function notifyUser(notification) {
  if (isReminderNotification(notification)) return;
  const action = parseNotificationAction(notification);
  const tag = `notification-${notification.id}`;
  sendBrowserNotification(notification.title, notification.message, tag, action);
  playNotificationSound();
}

function processNewNotifications(fresh, knownIds, setNotifications, refreshProfile) {
  const newOnes = fresh.filter((notification) => !knownIds.has(notification.id));
  if (newOnes.length === 0) return;

  let needsSessionRefresh = false;
  newOnes.forEach((notification) => {
    notifyUser(notification);
    knownIds.add(notification.id);
    if (isRoleChangeNotification(notification)) {
      needsSessionRefresh = true;
    }
  });

  setNotifications(fresh);
  if (needsSessionRefresh && refreshProfile) {
    refreshProfile();
  }
}

async function pollNotifications(knownIds, setNotifications, refreshProfile) {
  const fresh = await api.fetchNotifications().catch(() => null);
  if (fresh) {
    processNewNotifications(fresh, knownIds, setNotifications, refreshProfile);
  }
}

export function useNotificationLoader() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestPermission();
    api.fetchNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { notifications, setNotifications, loading };
}

export function useNotificationPolling(notifications, setNotifications, knownIds, refreshProfile) {
  useEffect(() => {
    notifications.forEach((notification) => knownIds.current.add(notification.id));
  }, [notifications, knownIds]);

  useEffect(() => {
    const interval = setInterval(
      () => pollNotifications(knownIds.current, setNotifications, refreshProfile),
      POLL_INTERVAL,
    );
    return () => clearInterval(interval);
  }, [setNotifications, knownIds, refreshProfile]);
}
