/*
 * Inline alert for success, error, warning, and info messages with auto-dismiss support.
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./InlineAlert.module.css";

const ICONS = { success: "✓", error: "✕", warning: "!", info: "i" };

function useMessageSync(message, visible, dismiss, setDisplayMessage, setVisible, setExiting) {
  useEffect(() => {
    if (message) { setDisplayMessage(message); setVisible(true); setExiting(false); }
    else if (visible) dismiss();
  }, [message, visible, dismiss, setDisplayMessage, setVisible, setExiting]);
}

function useAutoDismiss(visible, autoDismiss, message, dismiss) {
  useEffect(() => {
    if (!visible || !autoDismiss || !message) return;
    const timer = setTimeout(dismiss, autoDismiss);
    return () => clearTimeout(timer);
  }, [visible, autoDismiss, message, dismiss]);
}

function useInlineAlertState(message, autoDismiss, onDismiss) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(message);
  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => { setVisible(false); setExiting(false); onDismiss?.(); }, 250);
  }, [onDismiss]);
  useMessageSync(message, visible, dismiss, setDisplayMessage, setVisible, setExiting);
  useAutoDismiss(visible, autoDismiss, message, dismiss);
  return { visible, exiting, displayMessage };
}

/** Inline alert that animates in and out, with optional auto-dismiss. */

export default function InlineAlert({ message, variant = "success", autoDismiss = 0, onDismiss, className = "" }) {
  const { visible, exiting, displayMessage } = useInlineAlertState(message, autoDismiss, onDismiss);
  if (!visible) return null;
  return (
    <div className={`${styles.alert} ${styles[variant] || styles.success} ${className}`}
      data-exiting={exiting || undefined} role={variant === "error" ? "alert" : "status"}>
      <span className={styles.icon}>{ICONS[variant]}</span>
      <span className={styles.message}>{displayMessage}</span>
    </div>
  );
}
