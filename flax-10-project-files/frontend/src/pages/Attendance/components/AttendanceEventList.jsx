/*
 * Attendance event list renderer.
 */

import AttendanceEventInfo from "./AttendanceEventInfo";
import styles from "./AttendanceList.module.css";

export default function AttendanceEventList({ events, renderActions }) {
  return <ul className={styles.eventList}>{events.map((event) => <AttendanceEventRow key={event.id} event={event} actions={renderActions(event)} />)}</ul>;
}

function AttendanceEventRow({ event, actions }) {
  return (
    <li className={styles.eventRow}>
      <AttendanceEventInfo event={event} />
      {actions}
    </li>
  );
}
