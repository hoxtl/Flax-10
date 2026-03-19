/*
 * Attendance segment detail header.
 */

import styles from "./AttendanceDetailPanel.module.css";

export default function SegmentDetailHeader({ segmentLabel, count, onClose }) {
  return (
    <div className={styles.detailPanelHeader}>
      <div className={styles.detailPanelTitle}>
        <h3>{segmentLabel}</h3>
        <span className={styles.eventCount}>{count} events</span>
      </div>
      <button type="button" className={styles.detailPanelClose} onClick={onClose}>✕</button>
    </div>
  );
}
