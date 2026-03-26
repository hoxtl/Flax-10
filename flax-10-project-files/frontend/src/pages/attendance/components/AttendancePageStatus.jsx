/*
 * Attendance page loading and error states.
 */

<<<<<<< HEAD
import SkeletonBlock from '../../../components/common/loading_state/SkeletonBlock';
=======
import SkeletonBlock from '../../../components/common/LoadingState/SkeletonBlock';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "../AttendancePage.module.css";

export default function AttendancePageStatus({ loading, error }) {
  if (loading) return <AttendanceLoadingState />;
  if (error) return <p className={styles.error}>{error}</p>;
  return null;
}

function AttendanceLoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSkeleton} aria-hidden="true">
        <SkeletonBlock className={styles.loadingTopCard} />
        <div className={styles.loadingGrid}>
          <div className={styles.loadingCharts}>
            <SkeletonBlock className={styles.loadingChartCard} />
            <SkeletonBlock className={styles.loadingChartCard} />
          </div>
          <SkeletonBlock className={styles.loadingListCard} />
        </div>
      </div>
    </div>
  );
}
