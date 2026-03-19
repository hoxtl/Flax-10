import styles from "./ProfileBadgesModules.module.css";

export function QuickStatsRail({ totalHours, sessionCount, moduleCount }) {
  return (
    <div className={styles.quickStatsRail}>
      <div className={styles.quickStatItem}>
        <span className={styles.quickStatValue}>{Math.round(totalHours || 0)}h</span>
        <span className={styles.quickStatLabel}>Total Focus</span>
      </div>
      <div className={styles.quickStatDivider} />
      <div className={styles.quickStatItem}>
        <span className={styles.quickStatValue}>{sessionCount || 0}</span>
        <span className={styles.quickStatLabel}>Sessions</span>
      </div>
      <div className={styles.quickStatDivider} />
      <div className={styles.quickStatItem}>
        <span className={styles.quickStatValue}>{moduleCount || 0}</span>
        <span className={styles.quickStatLabel}>Modules</span>
      </div>
    </div>
  );
}
