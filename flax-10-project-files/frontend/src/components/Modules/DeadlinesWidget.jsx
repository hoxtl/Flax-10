import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import {
  getDeadlineCountdown,
  getDeadlineUrgency,
  formatDeadlineDateTime,
  DEADLINE_LABELS,
} from "./utils/deadlineUtils";
import styles from "./DeadlinesWidget.module.css";

export default function DeadlinesWidget({
  mode = "list",      
  limit = 3,
  showViewAll = false,
}) {
  const nav = useNavigate();
  const deadlines = useUpcomingDeadlines(limit);

  const nextDeadline = useMemo(() => deadlines[0] || null, [deadlines]);

  if (!deadlines.length) return null;

  // Next deadline card
  if (mode === "next") {
    const d = nextDeadline;
    const urgency = getDeadlineUrgency(d.start_due_date);
    const countdown = getDeadlineCountdown(d.start_due_date);

    return (
      <div className={styles.widget}>
        <div className={styles.headerRow}>
          <span className={styles.heading}>Next deadline</span>
          {showViewAll && (
            <button className={styles.viewAllBtn} onClick={() => nav("/modules")}>
              View all →
            </button>
          )}
        </div>

        <div className={`${styles.row} ${styles[urgency]}`}>
          <span className={styles.icon}>⏳</span>

          <div className={styles.body}>
            <div className={styles.titleRow}>
              <span className={styles.type}>{DEADLINE_LABELS[d.deadline_type]}</span>
              <span className={styles.title}>{d.title}</span>
            </div>
            <span className={styles.moduleLabel}>
              {d.module_code} — {d.module_name}
            </span>
          </div>

          <div className={styles.timeColumn}>
            <span className={styles.date}>{formatDeadlineDateTime(d.start_due_date)}</span>
            <span className={`${styles.countdown} ${styles[urgency]}`}>{countdown}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default list
  return (
    <div className={styles.widget}>
      <span className={styles.heading}>Upcoming deadlines</span>
      {deadlines.map((deadline) => (
        <DeadlineRow key={deadline.id} deadline={deadline} />
      ))}
    </div>
  );
}

function useUpcomingDeadlines(limit) {
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    getUpcomingDeadlines()
      .then((data) => setDeadlines((data || []).slice(0, limit)))
      .catch(() => {});
  }, [limit]);

  return deadlines;
}

function DeadlineRow({ deadline }) {
  const urgency = getDeadlineUrgency(deadline.start_due_date);
  const countdown = getDeadlineCountdown(deadline.start_due_date);

  return (
    <div className={`${styles.row} ${styles[urgency]}`}>
      <span className={styles.icon}>⏳</span>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.type}>{DEADLINE_LABELS[deadline.deadline_type]}</span>
          <span className={styles.title}>{deadline.title}</span>
        </div>
        <span className={styles.moduleLabel}>
          {deadline.module_code} — {deadline.module_name}
        </span>
      </div>
      <div className={styles.timeColumn}>
        <span className={styles.date}>{formatDeadlineDateTime(deadline.start_due_date)}</span>
        <span className={`${styles.countdown} ${styles[urgency]}`}>{countdown}</span>
      </div>
    </div>
  );
}