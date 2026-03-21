/*
 * Attendance event title and date.
 */

<<<<<<< HEAD
import { formatEventTime } from "../utils/attendanceEventDate";
=======
import { formatAttendanceEventDate } from "../utils/attendanceEventDate";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "./AttendanceList.module.css";

export default function AttendanceEventInfo({ event }) {
  return (
    <span className={styles.eventInfo}>
      <strong>{event.title}</strong>
<<<<<<< HEAD
      <span className={styles.eventMeta}>{formatEventTime(event.start_time)}</span>
=======
      <span className={styles.eventMeta}>{formatAttendanceEventDate(event.start_time)}</span>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </span>
  );
}
