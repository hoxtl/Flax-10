import styles from "./AppToast.module.css";

function getDefaultIcon(variant) {
  if (variant === "error") return "!";
  if (variant === "info") return "i";
  return "✓";
}

export default function AppToast({
  message,
  onClose,
  actionLabel = null,
  onAction = null,
  variant = "success",
  icon = null,
}) {
  const rootClass = `${styles.toast} ${styles[variant] || styles.success}`;
  return (
    <div className={rootClass} role="status" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden>
          {icon || getDefaultIcon(variant)}
        </span>
        <span className={styles.message}>{message}</span>
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
    </div>
  );
}
