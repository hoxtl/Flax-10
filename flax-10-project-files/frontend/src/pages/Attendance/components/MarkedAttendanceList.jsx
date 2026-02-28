import styles from "../AttendancePage.module.css";

function formatEventDate(startTime) {
  if (!startTime) return "";
  const d = new Date(startTime);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Single responsibility: list events that have been marked with Attended/Missed badge. */
export default function MarkedAttendanceList({ markedEvents }) {
  if (!markedEvents.length) return null;

  return (
    <section className={styles.recordSection}>
      <p className={styles.recordHint}>Events you’ve already marked. They’re removed from “Record attendance”.</p>
      <ul className={styles.eventList}>
        {markedEvents.slice(0, 30).map((ev) => (
          <li key={ev.id} className={styles.eventRow}>
            <span className={styles.eventInfo}>
              <strong>{ev.title}</strong>
              <span className={styles.eventMeta}>{formatEventDate(ev.start_time)}</span>
            </span>
            <span className={ev.attended ? styles.badgeAttended : styles.badgeMissed}>
              {ev.attended ? "Attended" : "Missed"}
            </span>
          </li>
        ))}
      </ul>
      {markedEvents.length > 30 && (
        <p className={styles.recordHint}>Showing 30 most recent.</p>
      )}
    </section>
  );
}
