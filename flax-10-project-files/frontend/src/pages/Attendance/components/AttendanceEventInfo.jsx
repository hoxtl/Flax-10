/*
 * Attendance event title and date.
 */

import { formatEventTime } from "../utils/attendanceEventDate";
import styles from "./AttendanceList.module.css";

export default function AttendanceEventInfo({ event }) {
  return (
    <span className={styles.eventInfo}>
      <strong>{event.title}</strong>
      <span className={styles.eventMeta}>{formatEventTime(event.start_time)}</span>
    </span>
  );
}
