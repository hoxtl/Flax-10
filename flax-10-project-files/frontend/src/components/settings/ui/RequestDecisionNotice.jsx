/*
 * Reusable notice shown on request submission dialogues.
 */

<<<<<<< HEAD
import styles from "../../../pages/settings/styles/Settings.module.css";
=======
import styles from "../../../pages/settings/Settings.module.css";
>>>>>>> main

export default function RequestDecisionNotice() {
  return (
    <div className={styles.modalWarning}>
      <span className={styles.modalWarningIcon}>⚠️</span>
      <span>Your request may be <strong>accepted or rejected</strong>. You'll be notified once a decision is made.</span>
    </div>
  );
}
