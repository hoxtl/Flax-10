/*
 * Auto schedule summary copy.
 */
import styles from '../shared/scheduleFormStyles';

export function AutoScheduleSummary({ deadlines }) {
  return <p className={styles.muted}>Will schedule {deadlines.length} upcoming deadlines with 60 min/day blocks.</p>;
}
