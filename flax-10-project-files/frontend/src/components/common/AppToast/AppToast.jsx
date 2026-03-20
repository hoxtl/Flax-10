import { motion } from "framer-motion";
import styles from "./AppToast.module.css";

function getDefaultIcon(variant) {
  if (variant === "error") return "!";
  if (variant === "info") return "i";
  return "✓";
}

export default function AppToast({
  title = null,
  message,
  description = null,
  onClose,
  actionLabel = null,
  onAction = null,
  variant = "success",
  icon = null,
}) {
  const rootClass = `${styles.toast} ${styles[variant] || styles.success}`;
  const heading = title || message;
  const subcopy = title ? (description || message || null) : description;
  return (
    <div className={styles.portal}>
      <motion.div
        className={rootClass}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.content}>
          <span className={styles.icon} aria-hidden>
            {icon || getDefaultIcon(variant)}
          </span>
          <div className={styles.copy}>
            <span className={styles.message}>{heading}</span>
            {subcopy && <span className={styles.description}>{subcopy}</span>}
          </div>
        </div>
        {actionLabel && typeof onAction === "function" && (
          <button
            type="button"
            className={styles.action}
            onClick={async () => {
              onClose?.();
              await onAction();
            }}
          >
            {actionLabel}
          </button>
        )}
        <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss toast">
          ✕
        </button>
      </motion.div>
    </div>
  );
}
