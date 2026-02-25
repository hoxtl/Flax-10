import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import {
  getDeadlineCountdown,
  getDeadlineUrgency,
  formatDeadlineDateTime,
  DEADLINE_LABELS,
} from "./utils/deadlineUtils";
import styles from "./DeadlinesWidget.module.css";

/* ─── Main widget ─────────────────────────────── */
export default function DeadlinesWidget({ onModuleTagClick }) {
  const navigate = useNavigate();
  const deadlines = useUpcomingDeadlines();
  const [selected, setSelected] = useState(null);

  const handleModuleClick = (moduleId, moduleCode) => {
    if (onModuleTagClick) {
      onModuleTagClick(moduleId, moduleCode);
    } else {
      const url = moduleId ? `/modules?moduleId=${moduleId}` : (moduleCode ? `/modules?code=${encodeURIComponent(moduleCode)}` : "/modules");
      navigate(url);
    }
  };

  if (!deadlines.length) return null;

  return (
    <>
      <div className={styles.widget}>
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <span className={styles.headerLabel}>Deadlines</span>
            <h2 className={styles.headerTitle}>
              <span className={styles.headerIcon} aria-hidden>🕐</span>
              Upcoming Deadlines
            </h2>
          </div>
        </div>

        {deadlines.map((deadline) => (
          <DeadlineRow
            key={deadline.id}
            deadline={deadline}
            onClick={() => setSelected(deadline)}
            onModuleClick={onModuleTagClick ? handleModuleClick : undefined}
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

/* ─── Single row: title, then bubbles (module + type), countdown pill ── */
function DeadlineRow({ deadline, onClick, onModuleClick }) {
  const urgency = getDeadlineUrgency(deadline.start_due_date);
  const countdown = getDeadlineCountdown(deadline.start_due_date);
  const dueStr = formatDeadlineDateTime(deadline.start_due_date);
  const typeKey = (deadline.deadline_type || "coursework").toLowerCase();
  const typeLabel = DEADLINE_LABELS[deadline.deadline_type] ?? deadline.deadline_type ?? "Coursework";
  const moduleId = deadline.module ?? deadline.module_id;
  const moduleCode = deadline.module_code;
  const typeBubbleClass =
    typeKey === "exam" ? "bubbleExam"
    : typeKey === "coursework" ? "bubbleCoursework"
    : "bubbleOther";

  const moduleHref = moduleId ? `/modules?moduleId=${moduleId}` : (moduleCode ? `/modules?code=${encodeURIComponent(moduleCode)}` : "/modules");

  const handleBubbleClick = (e) => {
    e.stopPropagation();
    if (onModuleClick) {
      onModuleClick(moduleId, moduleCode);
    }
  };

  return (
    <div
      className={`${styles.row} ${styles[urgency] || ""}`}
      onClick={onClick}
    >
      <div className={styles.body}>
        <div className={styles.rowContent}>
          <span className={styles.title}>{deadline.title}</span>
          <div className={styles.bubbleRow}>
            {(moduleCode || moduleId) && (
              onModuleClick ? (
                <button
                  type="button"
                  className={`${styles.bubble} ${styles.bubbleModule}`}
                  onClick={handleBubbleClick}
                >
                  {moduleCode || `Module ${moduleId}`}
                </button>
              ) : (
                <Link
                  to={moduleHref}
                  className={`${styles.bubble} ${styles.bubbleModule}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {moduleCode || `Module ${moduleId}`}
                </Link>
              )
            )}
            <span className={`${styles.bubble} ${styles[typeBubbleClass]}`}>
              {typeLabel}
            </span>
          </div>
        </div>
        <span
          className={`${styles.pill} ${styles[urgency] || ""}`}
          title={dueStr}
        >
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
              {deadline.module_code ? (
                <>
                  <Link to={`/modules?code=${encodeURIComponent(deadline.module_code)}`} className={styles.moduleCodeLink} onClick={onClose}>
                    <strong>{deadline.module_code}</strong>
                  </Link>
                  {deadline.module_name && ` — ${deadline.module_name}`}
                </>
              ) : (
                <>
                  <strong>{deadline.module_code}</strong>
                  {deadline.module_name && ` — ${deadline.module_name}`}
                </>
              )}
            </span>
          </div>

          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Due</span>
            <span className={styles.modalValue}>
              {formatDeadlineDateTime(deadline.start_due_date)}
            </span>
          </div>

          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Left</span>
            <span className={`${styles.modalValue} ${styles.modalTag} ${styles[urgency] || ""}`}>
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