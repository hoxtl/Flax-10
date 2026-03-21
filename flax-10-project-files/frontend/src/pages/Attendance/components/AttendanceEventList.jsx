/*
<<<<<<< HEAD
 * Attendance event list renderer — grouped by date header.
 */

import AttendanceEventInfo from "./AttendanceEventInfo";
import { formatDateGroupHeader } from "../utils/attendanceEventDate";
import styles from "./AttendanceList.module.css";

function groupEventsByDate(events) {
  const groups = new Map();
  events.forEach((event) => {
    const header = formatDateGroupHeader(event.start_time);
    if (!groups.has(header)) groups.set(header, []);
    groups.get(header).push(event);
  });
  return Array.from(groups.entries());
}

export default function AttendanceEventList({ events, renderActions }) {
  const groups = groupEventsByDate(events);
  return (
    <div className={styles.eventList}>
      {groups.map(([header, groupEvents]) => (
        <div key={header} className={styles.dateGroup}>
          <h3 className={styles.dateHeader}>{header}</h3>
          <ul className={styles.groupList}>
            {groupEvents.map((event) => (
              <AttendanceEventRow key={event.id} event={event} actions={renderActions(event)} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
=======
 * Attendance event list renderer.
 */

import AttendanceEventInfo from "./AttendanceEventInfo";
import styles from "./AttendanceList.module.css";

export default function AttendanceEventList({ events, renderActions }) {
  return <ul className={styles.eventList}>{events.map((event) => <AttendanceEventRow key={event.id} event={event} actions={renderActions(event)} />)}</ul>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function AttendanceEventRow({ event, actions }) {
  return (
    <li className={styles.eventRow}>
      <AttendanceEventInfo event={event} />
      {actions}
    </li>
  );
}
