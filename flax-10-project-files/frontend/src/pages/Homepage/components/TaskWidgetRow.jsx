/**
 * Task widget row — single task display with play button.
 */

import { Link } from "react-router-dom";
import { PRIORITY_COLOURS } from "../utils/eventUtils";
import { fmtDuration } from "../utils/dateFormatUtils";
import styles from "../Homepage.module.css";

export function TaskWidgetRow({ task, onPlay, isActiveInTimer }) {
  const color = PRIORITY_COLOURS[task.priority] || "var(--muted)";
  const estMins = task.estimated_blocks ? task.estimated_blocks * 25 : null;
  const priorityClass = task.priority === "urgent" ? styles.twDotUrgent
    : task.priority === "high" ? styles.twDotHigh
    : task.priority === "low" ? styles.twDotLow
    : "";
  const moduleId = task.moduleId ?? task.module_id;
  const moduleCode = task.module_code;
  const assignmentType = (task.assignment_type || task.deadline_type || "").toLowerCase();
  const typeBubbleClass =
    assignmentType === "exam" ? styles.twBubbleExam
    : assignmentType === "coursework" ? styles.twBubbleCoursework
    : assignmentType === "lab" ? styles.twBubbleOther
    : null;
  const typeLabel = assignmentType === "exam" ? "Exam" : assignmentType === "coursework" ? "Coursework" : assignmentType === "lab" ? "Lab" : null;
  const moduleHref = moduleId ? `/modules?moduleId=${moduleId}` : (moduleCode ? `/modules?code=${encodeURIComponent(moduleCode)}` : "/modules");

  return (
    <div className={`${styles.twRow} ${isActiveInTimer ? styles.twRowActiveTimer : ""}`}>
      <div className={styles.twLeft}>
        <span className={`${styles.twDot} ${priorityClass}`} style={{ background: color }} />
        <div className={styles.twBody}>
          <span className={styles.twTitle}>{task.title}</span>
          <div className={styles.twMeta}>
            {(moduleCode || moduleId) && (
              <Link to={moduleHref} className={`${styles.twBubble} ${styles.twBubbleModule}`} onClick={(e) => e.stopPropagation()}>
                {moduleCode || `Module ${moduleId}`}
              </Link>
            )}
            {typeLabel && typeBubbleClass && (
              <span className={`${styles.twBubble} ${typeBubbleClass}`}>{typeLabel}</span>
            )}
            {estMins && <span className={styles.twTime}>{fmtDuration(estMins)}</span>}
          </div>
        </div>
      </div>
      {onPlay && !task.completed && (
        <button
          type="button"
          className={styles.twPlay}
          title="Start timer for this task"
          onClick={() => onPlay(task)}
          aria-label="Start timer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7L8 5z" /></svg>
        </button>
      )}
    </div>
  );
}
