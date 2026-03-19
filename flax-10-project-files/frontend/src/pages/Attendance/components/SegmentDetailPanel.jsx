import { useState } from "react";
import styles from "../AttendancePage.module.css";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";

export default function SegmentDetailPanel({
  segmentLabel,
  events,
  onToggleStatus,
  onClose,
  className = "",
  isDetailed = true,
}) {
  const [toggling, setToggling] = useState({});

  const handleToggle = async (eventId, currentAttended) => {
    setToggling((prev) => ({ ...prev, [eventId]: true }));
    try {
      await onToggleStatus(eventId, !currentAttended);
    } catch (err) {
      console.error("Toggle failed", err);
    } finally {
      setToggling((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`${styles.detailPanel} ${className}`}>
      <div className={styles.detailPanelHeader}>
        <div className={styles.detailPanelTitle}>
          <h3>{segmentLabel}</h3>
          <span className={styles.eventCount}>{events.length} events</span>
        </div>
        <button className={styles.detailPanelClose} onClick={onClose}>
          ✕
        </button>
      </div>

      <ul className={styles.detailList}>
        {events.map((event) => (
          <li key={event.id} className={styles.detailRow}>
            <div className={styles.detailRowTitle}>
              {event.title}
            </div>
            <div className={styles.detailRowMeta}>
              <span>{formatDate(event.start_time)}</span>
              <span className={styles.metaDivider}> • </span>
              <span>{event.event_type}</span>
            </div>
            <div className={styles.eventAction} data-tooltip={event.attended ? "Mark as missed" : "Mark as attended"}>
              <PrimaryButton
                pill
                className={`${styles.statusToggleBtn} ${event.attended ? styles.btnAttended : styles.btnMissed}`}
                onClick={() => handleToggle(event.id, event.attended)}
                loading={toggling[event.id]}
              >
                {event.attended ? "Attended" : "Missed"}
              </PrimaryButton>
            </div>
          </li>
        ))}
        {events.length === 0 && (
          <li className={styles.detailEmpty}>No records found for this segment.</li>
        )}
      </ul>
    </div>
  );
}
