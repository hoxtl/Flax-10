import { useState } from "react";
import { recordAttendance } from "../../../api/attendanceApi";
import styles from "../AttendancePage.module.css";

function formatEventDate(startTime) {
  if (!startTime) return "";
  const d = new Date(startTime);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Single responsibility: list timetable events with Attended/Missed buttons. */
export default function RecordAttendanceList({ events, onRecorded }) {
  const [submittingId, setSubmittingId] = useState(null);

  const handleRecord = async (eventId, attended) => {
    setSubmittingId(eventId);
    try {
      await recordAttendance(eventId, attended);
      onRecorded?.();
    } catch {
      // leave state unchanged
    } finally {
      setSubmittingId(null);
    }
  };

  if (!events.length) return null;

  return (
    <section className={styles.recordSection}>
      <p className={styles.recordHint}>Mark attendance for your timetable events to update the charts above.</p>
      <ul className={styles.eventList}>
        {events.slice(0, 20).map((ev) => (
          <li key={ev.id} className={styles.eventRow}>
            <span className={styles.eventInfo}>
              <strong>{ev.title}</strong>
              <span className={styles.eventMeta}>{formatEventDate(ev.start_time)}</span>
            </span>
            <span className={styles.eventActions}>
              <button
                type="button"
                className={styles.btnAttended}
                onClick={() => handleRecord(ev.id, true)}
                disabled={submittingId === ev.id}
              >
                Attended
              </button>
              <button
                type="button"
                className={styles.btnMissed}
                onClick={() => handleRecord(ev.id, false)}
                disabled={submittingId === ev.id}
              >
                Missed
              </button>
            </span>
          </li>
        ))}
      </ul>
      {events.length > 20 && (
        <p className={styles.recordHint}>Showing first 20 events. Use the prompt during class for more.</p>
      )}
    </section>
  );
}
