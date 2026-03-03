/**
 * Empty day — Empty state when no tasks scheduled.
 */

import styles from "../Homepage.module.css";

export function EmptyDay() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>🌱</span>
      <p>Your garden is clear</p>
      <p className={styles.emptySub}>Time to plant tomorrow&apos;s goals?</p>
    </div>
  );
}
