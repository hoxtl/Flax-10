/*
 * Attendance segment detail list.
 */

import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { formatAttendanceDetailDate } from "../utils/attendanceEventDate";
import styles from "./AttendanceDetailPanel.module.css";

export default function SegmentDetailList({ events, toggling, onToggleStatus }) {
  if (!events.length) return <li className={styles.detailEmpty}>No records found for this segment.</li>;
  return <>{events.map((event) => <SegmentDetailItem key={event.id} event={event} toggling={toggling[event.id]} onToggleStatus={onToggleStatus} />)}</>;
}

function SegmentDetailItem({ event, toggling, onToggleStatus }) {
  return (
    <li className={styles.detailRow}>
      <div className={styles.detailRowTitle}>{event.title}</div>
      <div className={styles.detailRowMeta}><span>{formatAttendanceDetailDate(event.start_time)}</span><span className={styles.metaDivider}> | </span><span>{event.event_type}</span></div>
      <div className={styles.eventAction} data-tooltip={event.attended ? "Mark as missed" : "Mark as attended"}><PrimaryButton pill className={`${styles.statusToggleBtn} ${event.attended ? styles.btnAttended : styles.btnMissed}`} onClick={() => onToggleStatus(event.id, event.attended)} loading={toggling}>{event.attended ? "Attended" : "Missed"}</PrimaryButton></div>
    </li>
  );
}
