/*
 * Attendance event title and date.
 */

import { formatAttendanceEventDate } from "../utils/attendanceEventDate";
import styles from "./AttendanceList.module.css";

export default function AttendanceEventInfo({ event }) {
  return (
    <span className={styles.eventInfo}>
      <strong>{event.title}</strong>
      <span className={styles.eventMeta}>{formatAttendanceEventDate(event.start_time)}</span>
    </span>
  );
}
