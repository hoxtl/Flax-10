/**
 * Reusable card for showing a pending/approved/rejected request with an
 * optional cancel action and success message.  Used by both the teacher-role
 * and course-change flows on the Settings page.
 */
import styles from "./RequestStatusCard.module.css";

export default function RequestStatusCard({
  icon,
  title,
  subtitle,
  cancelLabel = "Cancel request",
  cancellingLabel = "Cancelling…",
  cancelling = false,
  onCancel,
  successMessage,
}) {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.body}>
        {successMessage && <p className={styles.successMsg}>{successMessage}</p>}
        <p className={styles.title}>{title}</p>
        {subtitle && <p className={styles.sub}>{subtitle}</p>}
      </div>
      {onCancel && (
        <div className={styles.action}>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={cancelling}
            onClick={onCancel}
          >
            {cancelling ? cancellingLabel : cancelLabel}
          </button>
        </div>
      )}
    </div>
  );
}
