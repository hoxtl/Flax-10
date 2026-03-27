/*
 * Toast queue for incoming notifications.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNotifications } from "../../../context/NotificationContext";
import AppToast from "../../common/app_toast/AppToast";
import { executeNotificationAction, hasNotificationAction, parseNotificationAction } from "../utils/notificationAction";
import { playNotificationSound } from "../utils/notificationSound";

export function NotificationToast() {
  const { loading, notifications } = useNotifications();
  const [currentToast, setCurrentToast] = useState(null);
  const refs = useToastRefs();
  const showNext = useShowNext(refs.queue, refs.timeout, setCurrentToast);
  const dismissToast = useDismissToast(refs.timeout, setCurrentToast);
  useToastEffect(notifications, loading, refs, currentToast, showNext);
  useTimeoutCleanup(refs.timeout);
  return <ToastOutlet currentToast={currentToast} onClose={dismissToast} />;
}

function ToastOutlet({ currentToast, onClose }) {
  return (
    <AnimatePresence initial={false}>
      {currentToast && <Toast key={currentToast.id} notification={currentToast} onClose={onClose} />}
    </AnimatePresence>
  );
}

function useToastRefs() {
  return { initialised: useRef(false), queue: useRef([]), seenIds: useRef(new Set()), timeout: useRef(null) };
}

function useShowNext(queueRef, timeoutRef, setCurrentToast) {
  return useCallback(() => showNextToast(queueRef, setCurrentToast, timeoutRef), [queueRef, setCurrentToast, timeoutRef]);
}

function useDismissToast(timeoutRef, setCurrentToast) {
  return useCallback(() => {
    clearToastTimeout(timeoutRef);
    setCurrentToast(null);
  }, [setCurrentToast, timeoutRef]);
}

function useTimeoutCleanup(timeoutRef) {
  useEffect(() => () => clearToastTimeout(timeoutRef), [timeoutRef]);
}

function clearToastTimeout(timeoutRef) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

export function showNextToast(queueRef, setCurrentToast, timeoutRef = { current: null }) {
  clearToastTimeout(timeoutRef);
  if (queueRef.current.length === 0) return setCurrentToast(null);
  setCurrentToast(queueRef.current.shift());
  playNotificationSound();
  timeoutRef.current = setTimeout(() => clearCurrentToast(setCurrentToast, timeoutRef), 3000);
}

function clearCurrentToast(setCurrentToast, timeoutRef) {
  setCurrentToast((current) => (current ? null : current));
  timeoutRef.current = null;
}

function useToastEffect(notifications, loading, refs, currentToast, showNext) {
  useEffect(() => {
    if (loading) return;
    if (!refs.initialised.current) return initialise(notifications, refs);
    queueNew(notifications, refs, currentToast, showNext);
  }, [notifications, loading, currentToast, showNext, refs]);
}

function initialise(notifications, refs) {
  notifications.forEach((notification) => refs.seenIds.current.add(notification.id));
  refs.initialised.current = true;
}

function queueNew(notifications, refs, currentToast, showNext) {
  const freshNotifications = notifications.filter((notification) => !refs.seenIds.current.has(notification.id));
  freshNotifications.forEach((notification) => refs.seenIds.current.add(notification.id));
  refs.queue.current.push(...freshNotifications);
  if (!currentToast && refs.queue.current.length > 0) showNext();
}

function getToastVariant(notification) {
  const title = String(notification?.title || "").toLowerCase();
  if (title.includes("failed") || title.includes("rejected") || title.includes("⚠")) return "error";
  if (title.includes("done") || title.includes("approved") || title.includes("✓")) return "success";
  return "info";
}

function Toast({ notification, onClose }) {
  const isClickable = hasNotificationAction(notification);
  return (
    <AppToast title={notification.title} description={notification.message} variant={getToastVariant(notification)} actionLabel={isClickable ? "Open" : null} onAction={isClickable ? () => executeNotificationAction(parseNotificationAction(notification)) : null} onClose={onClose} />
  );
}
