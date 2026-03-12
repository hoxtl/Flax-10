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

/** Single responsibility: show list of events for the selected chart segment. */
export default function SegmentDetailPanel({ segmentLabel, events, onClose }) {
  if (!segmentLabel) return null;

  return (
    <aside className={styles.detailPanel}>
      <div className={styles.detailPanelHeader}>
        <h3 className={styles.detailPanelTitle}>{segmentLabel}</h3>
        <button
          type="button"
          className={styles.detailPanelClose}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <ul className={styles.detailList}>
        {events.length === 0 ? (
          <li className={styles.detailEmpty}>No events in this segment.</li>
        ) : (
          events.map((ev) => (
            <li key={ev.id} className={styles.detailRow}>
              <strong className={styles.detailRowTitle}>{ev.title}</strong>
              <span className={styles.detailRowMeta}>
                {formatEventDate(ev.start_time)}
              </span>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
