import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getUpcomingDeadlines } from "../../api/deadlineApi";
import {
  getDeadlineCountdown,
  getDeadlineUrgency,
  formatDeadlineDateTime,
  getTimeRemainingCountdown,
  getDueInPhrase,
  getTimeRemainingMonospace,
  isDeadlineUnder24h,
  DEADLINE_LABELS,
} from "./utils/deadlineUtils";

import styles from "./DeadlinesWidget.module.css";

/* ─── Main widget ─────────────────────────────── */
export default function DeadlinesWidget({ onModuleTagClick, variant }) {
  const navigate = useNavigate();
  const deadlines = useUpcomingDeadlines();
  const [selected, setSelected] = useState(null);
  const isTriage = variant === "triage";
  useTriageTick(isTriage);

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
      <div className={`${styles.widget} ${isTriage ? styles.widgetTriage : ""}`}>
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
            isTriage={isTriage}
            onClick={() => setSelected(deadline)}
            onModuleClick={handleModuleClick}
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

/* Tick every second in triage so monospace countdown updates */
function useTriageTick(isTriage) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isTriage) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isTriage]);
}

/* ─── Single row: Pill A (Module) + Pill B (Assessment) → Task Name → Countdown ── */
function DeadlineRow({ deadline, isTriage, onClick, onModuleClick }) {
  const urgency = getDeadlineUrgency(deadline.start_due_date);
  const under24h = isDeadlineUnder24h(deadline.start_due_date);
  const dueStr = formatDeadlineDateTime(deadline.start_due_date);
  const moduleCode = deadline.module_code || (deadline.module_name ? deadline.module_name.replace(/\s+/g, "").slice(0, 6) : "") || "MOD";
  const assessmentLabel = (DEADLINE_LABELS[deadline.deadline_type] || (deadline.deadline_type && String(deadline.deadline_type).charAt(0).toUpperCase() + String(deadline.deadline_type).slice(1)) || "Task");
  const timeLabel = isTriage ? getTimeRemainingMonospace(deadline.start_due_date) : getTimeRemainingCountdown(deadline.start_due_date);

  return (
    <div
      className={`${styles.row} ${styles[urgency] || ""} ${isTriage ? styles.rowTriage : ""}`}
      onClick={onClick}
    >
      <div className={styles.body}>
        <div className={styles.rowContent}>
          <div className={styles.pillsRow}>
            <span
              className={styles.pillModule}
              onClick={(e) => { e.stopPropagation(); onModuleClick?.(deadline.module ?? deadline.module_id, deadline.module_code); }}
              title={deadline.module_name || deadline.module_code}
            >
              {moduleCode.length > 4 ? moduleCode.slice(0, 4) : moduleCode}
            </span>
            <span className={styles.pillAssessment}>{assessmentLabel}</span>
          </div>
          <span className={styles.title}>{deadline.title}</span>
        </div>
        <span
          className={`${styles.countdownPill} ${under24h ? styles.countdownCoral : styles.countdownCharcoal}`}
          title={dueStr}
        >
          {timeLabel}
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