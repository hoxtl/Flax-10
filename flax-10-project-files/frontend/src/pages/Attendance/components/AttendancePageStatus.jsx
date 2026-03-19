/*
 * Attendance page loading and error states.
 */

import styles from "../AttendancePage.module.css";

export default function AttendancePageStatus({ loading, error }) {
  if (loading) return <AttendanceLoadingState />;
  if (error) return <p className={styles.error}>{error}</p>;
  return null;
}

function AttendanceLoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <p>Please wait while we fetch your stats...</p>
    </div>
  );
}
