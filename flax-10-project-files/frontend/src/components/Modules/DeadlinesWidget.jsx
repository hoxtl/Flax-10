import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import {
  getDeadlineCountdown,
  getDeadlineUrgency,
  formatDeadlineDateTime,
  DEADLINE_LABELS,
} from "./utils/deadlineUtils";
import styles from "./DeadlinesWidget.module.css";

/* ─── Main widget ─────────────────────────────── */
export default function DeadlinesWidget() {
  const deadlines = useUpcomingDeadlines();
  const [selected, setSelected] = useState(null);

  if (!deadlines.length) return null;

  return (
    <>
      <div className={styles.widget}>
        {/* Header — consistent with Today's Tasks & AI card */}
        <div className={styles.headerRow}>
          <span className={styles.heading}>Upcoming Deadlines</span>
          <Link to="/modules" className={styles.viewAllBtn}>
            View all →
          </Link>
        </div>

        {deadlines.map((deadline) => (
          <DeadlineRow
            key={deadline.id}
            deadline={deadline}
            onClick={() => setSelected(deadline)}
          />
        ))}
      </div>

      {selected && (
        <DeadlineDetailModal
          deadline={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ─── Data hook ───────────────────────────────── */
function useUpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState([]);
  useEffect(() => {
    getUpcomingDeadlines()
      .then((data) => setDeadlines((data || []).slice(0, 3)))
      .catch(() => {});
  }, []);
  return deadlines;
}

/* ─── Single row ──────────────────────────────── */
function DeadlineRow({ deadline, onClick }) {
  const urgency = getDeadlineUrgency(deadline.start_due_date);
  const countdown = getDeadlineCountdown(deadline.start_due_date);

  return (
    <div
      className={`${styles.row} ${styles[urgency] || ""}`}
      onClick={onClick}
    >
      <span className={styles.icon}>⏳</span>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.type}>
            {DEADLINE_LABELS[deadline.deadline_type] ?? deadline.deadline_type}
          </span>
          <span className={styles.title}>{deadline.title}</span>
        </div>
        <span className={styles.moduleLabel}>
          {deadline.module_code} — {deadline.module_name}
        </span>
      </div>

      <div className={styles.timeColumn}>
        <span className={styles.date}>
          {formatDeadlineDateTime(deadline.start_due_date)}
        </span>
        <span className={`${styles.countdown} ${styles[urgency] || ""}`}>
          {countdown}
        </span>
      </div>
    </div>
  );
}

/* ─── Detail modal ────────────────────────────── */
function DeadlineDetailModal({ deadline, onClose }) {
  const urgency = getDeadlineUrgency(deadline.start_due_date);
  const countdown = getDeadlineCountdown(deadline.start_due_date);

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div
        className={styles.modalCard}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalIcon}>⏳</span>
          <div className={styles.modalTitleGroup}>
            <span className={styles.type}>
              {DEADLINE_LABELS[deadline.deadline_type] ?? deadline.deadline_type}
            </span>
            <h2 className={styles.modalTitle}>{deadline.title}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Module</span>
            <span className={styles.modalValue}>
              <strong>{deadline.module_code}</strong> — {deadline.module_name}
            </span>
          </div>

          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Due</span>
            <span className={styles.modalValue}>
              {formatDeadlineDateTime(deadline.start_due_date)}
            </span>
          </div>

          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Time left</span>
            <span className={`${styles.modalValue} ${styles[urgency] || ""}`}>
              {countdown}
            </span>
          </div>

          {deadline.description && (
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>Notes</span>
              <span className={styles.modalValue}>{deadline.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}