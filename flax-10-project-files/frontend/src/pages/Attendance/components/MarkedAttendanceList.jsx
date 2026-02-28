import { useState } from "react";
import { recordAttendance } from "../../../api/attendanceApi";
import styles from "../AttendancePage.module.css";

function formatEventDate(startTime) {
  if (!startTime) return "";
  const d = new Date(startTime);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Single responsibility: list marked events with option to change attendance. */
export default function MarkedAttendanceList({ markedEvents, onRecorded }) {
  const [submittingId, setSubmittingId] = useState(null);

  async function handleChange(eventId, attended) {
    setSubmittingId(eventId);
    try {
      await recordAttendance(eventId, attended);
      onRecorded?.();
    } finally {
      setSubmittingId(null);
    }
  }

  if (!markedEvents.length) return null;

  return (
    <section className={styles.recordSection}>
      <p className={styles.recordHint}>
        Events you've already marked. Click to change if you marked it wrong.
      </p>
      <ul className={styles.eventList}>
        {markedEvents.slice(0, 30).map((ev) => (
          <li key={ev.id} className={styles.eventRow}>
            <span className={styles.eventInfo}>
              <strong>{ev.title}</strong>
              <span className={styles.eventMeta}>
                {formatEventDate(ev.start_time)}
              </span>
            </span>
            <span className={styles.eventActions}>
              <span
                className={
                  ev.attended ? styles.badgeAttended : styles.badgeMissed
                }
              >
                {ev.attended ? "Attended" : "Missed"}
              </span>
              <button
                type="button"
                className={styles.btnChange}
                onClick={() => handleChange(ev.id, !ev.attended)}
                disabled={submittingId === ev.id}
                title={ev.attended ? "Mark as missed" : "Mark as attended"}
              >
                Change
              </button>
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
