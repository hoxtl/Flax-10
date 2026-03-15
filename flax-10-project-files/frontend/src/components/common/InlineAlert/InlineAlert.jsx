import { useState, useEffect, useCallback } from "react";
import styles from "./InlineAlert.module.css";

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

/**
 * Inline alert for success / error / warning / info messages.
 *
 * @param {object}  props
 * @param {string}  props.message   - Text to display (falsy = hidden)
 * @param {"success"|"error"|"warning"|"info"} [props.variant="success"]
 * @param {number}  [props.autoDismiss=0] - ms before auto-hiding (0 = manual)
 * @param {Function} [props.onDismiss] - Called after dismiss animation ends
 * @param {string}  [props.className] - Extra class names
 */
export default function InlineAlert({
  message,
  variant = "success",
  autoDismiss = 0,
  onDismiss,
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(message);

  const dismiss = useCallback(() => {
    setExiting(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDismiss?.();
    }, 250);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      dismiss();
    }
  }, [message, visible, dismiss]);

  useEffect(() => {
    if (!visible || !autoDismiss || !message) return;
    const timer = setTimeout(dismiss, autoDismiss);
    return () => clearTimeout(timer);
  }, [visible, autoDismiss, message, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.alert} ${styles[variant] || styles.success} ${className}`}
      data-exiting={exiting || undefined}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={styles.icon}>{ICONS[variant]}</span>
      <span className={styles.message}>{displayMessage}</span>
    </div>
  );
}
