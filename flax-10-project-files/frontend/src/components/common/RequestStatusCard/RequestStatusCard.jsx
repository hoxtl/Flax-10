/*
 * Status card for pending, approved, or rejected requests with an optional cancel action.
 */

import styles from "./RequestStatusCard.module.css";

function CancelButton({ cancelling, cancellingLabel, cancelLabel, onCancel }) {
  return (
    <div className={styles.action}>
      <button type="button" className={styles.cancelBtn} disabled={cancelling} onClick={onCancel}>
        {cancelling ? cancellingLabel : cancelLabel}
      </button>
    </div>
  );
}

/** Card showing a request's current status with an optional cancel action. */
export default function RequestStatusCard({ icon, title, subtitle, cancelLabel = "Cancel request", cancellingLabel = "Cancelling…", cancelling = false, onCancel, successMessage }) {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.body}>
        {successMessage && <p className={styles.successMsg}>{successMessage}</p>}
        <p className={styles.title}>{title}</p>
        {subtitle && <p className={styles.sub}>{subtitle}</p>}
      </div>
      {onCancel && <CancelButton cancelling={cancelling} cancellingLabel={cancellingLabel} cancelLabel={cancelLabel} onCancel={onCancel} />}
    </div>
  );
}
