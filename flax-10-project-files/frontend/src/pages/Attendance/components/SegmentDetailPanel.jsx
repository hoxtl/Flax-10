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
      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <h3>{segmentLabel}</h3>
          <span className={styles.eventCount}>{events.length} events</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <ul className={styles.detailList}>
        {events.map((event) => (
          <li key={event.id} className={styles.detailItem}>
            <div className={styles.eventInfo}>
              <div className={styles.eventMain}>
                <span className={styles.eventTitle}>{event.title}</span>
              </div>
              <div className={styles.eventMeta}>
                <span className={styles.eventDate}>
                  {formatDate(event.start_time)}
                </span>
                <span className={styles.eventTypeTag}>{event.event_type}</span>
              </div>
            </div>
            <div className={styles.eventAction}>
              <PrimaryButton
                variant="ghost"
                pill
                className={styles.statusToggleBtn}
                onClick={() => handleToggle(event.id, event.attended)}
                loading={toggling[event.id]}
                data-tooltip={event.attended ? "Mark as missed" : "Mark as attended"}
              >
                {event.attended ? "Attended" : "Missed"}
              </PrimaryButton>
            </div>
          </li>
        ))}
        {events.length === 0 && (
          <li className={styles.emptyDetail}>No records found for this segment.</li>
        )}
      </ul>
    </div>
  );
}
