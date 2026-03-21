/*
 * Animated toast notification with optional action button.
 */

import { motion } from "framer-motion";
import styles from "./AppToast.module.css";

function getDefaultIcon(variant) {
  if (variant === "error") return "!";
  if (variant === "info") return "i";
  return "✓";
}

function ToastIcon({ icon, variant }) {
  return <span className={styles.icon} aria-hidden>{icon || getDefaultIcon(variant)}</span>;
}

function ToastCopy({ heading, subcopy }) {
  return (
    <div className={styles.copy}>
      <span className={styles.message}>{heading}</span>
      {subcopy && <span className={styles.description}>{subcopy}</span>}
    </div>
  );
}

function ToastAction({ actionLabel, onAction, onClose }) {
  if (!actionLabel || typeof onAction !== "function") return null;
  return (
    <button type="button" className={styles.action}
      onClick={async () => { onClose?.(); await onAction(); }}>
      {actionLabel}
    </button>
  );
}

function ToastBody({ icon, variant, heading, subcopy, actionLabel, onAction, onClose }) {
  return (
    <motion.div className={`${styles.toast} ${styles[variant] || styles.success}`}
      role="status" aria-live="polite"
      initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.985 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
      <div className={styles.content}>
        <ToastIcon icon={icon} variant={variant} />
        <ToastCopy heading={heading} subcopy={subcopy} />
      </div>
      <ToastAction actionLabel={actionLabel} onAction={onAction} onClose={onClose} />
      <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss toast">✕</button>
    </motion.div>
  );
}

/** Animated toast notification rendered at the bottom of the viewport. */
export default function AppToast({
  title = null, message, description = null, onClose,
  actionLabel = null, onAction = null, variant = "success", icon = null,
}) {
  const heading = title || message;
  const subcopy = title ? (description || message || null) : description;
  return (
    <div className={styles.portal}>
      <ToastBody icon={icon} variant={variant} heading={heading} subcopy={subcopy}
        actionLabel={actionLabel} onAction={onAction} onClose={onClose} />
    </div>
  );
}
