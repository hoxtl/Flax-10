/*
 * Attendance summary bar.
 */

import styles from "./AttendanceSummaryBar.module.css";

export default function AttendanceSummaryBar({ summary }) {
  if (summary.pct === null) return null;
  return <SummaryBarContent summary={summary} />;
}

function SummaryBarContent({ summary }) {
  return (
    <div className={styles.summaryBar}>
      <SummaryMetric label="Overall" value={`${summary.pct}%`} first />
      <SummaryDivider />
      <SummaryMetric label="Attended" value={summary.attended} valueClassName={styles.summaryAttended} />
      <SummaryDivider />
      <SummaryMetric label="Missed" value={summary.missed} valueClassName={styles.summaryMissed} />
      <SummaryDivider />
      <SummaryMetric label="To record" value={summary.unmarkedCount} />
    </div>
  );
}

function SummaryMetric({ label, value, valueClassName = "", first = false }) {
  const itemClassName = first ? `${styles.summaryItem} ${styles.summaryItemFirst}` : styles.summaryItem;
  const metricClassName = valueClassName ? `${styles.summaryValue} ${valueClassName}` : styles.summaryValue;

  return (
    <div className={itemClassName}>
      <span className={metricClassName}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}

function SummaryDivider() {
  return <div className={styles.summarySep} />;
}
