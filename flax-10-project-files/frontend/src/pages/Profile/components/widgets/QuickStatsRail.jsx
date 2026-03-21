<<<<<<< HEAD
import StatStrip from '../../../../components/common/stat_strip/StatStrip';
import { useCountUp } from '../../../../hooks/useCountUp';

export function QuickStatsRail({ totalHours, sessionCount, moduleCount, hideZeroItems = false }) {
  const hours = Math.round(totalHours || 0);
  const hoursRef = useCountUp(hours, 1200);
  const sessionsRef = useCountUp(sessionCount || 0, 1200);
  const modulesRef = useCountUp(moduleCount || 0, 1200);
  const items = [
    { key: 'total-focus', label: 'Total Focus', value: hours, valueRef: hoursRef, suffix: 'h' },
    { key: 'sessions', label: 'Sessions', value: sessionCount || 0, valueRef: sessionsRef },
    { key: 'modules', label: 'Modules', value: moduleCount || 0, valueRef: modulesRef },
  ].filter((item) => !hideZeroItems || item.value > 0);
  if (!items.length) return null;
  return <StatStrip items={items} />;
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
