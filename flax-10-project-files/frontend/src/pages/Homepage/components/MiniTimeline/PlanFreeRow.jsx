/**
 * Plan timeline free window row (gap >= 30min).
 * Design A — tiered:
 *   30–59 min  → short window: 1 task suggestion + "Start 25m ▶"
 *   60+  min   → best study window: header + up to 2 tasks + Start buttons
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getTasksThatFitGap, taskDurationMins } from "../../utils/taskUtils";

function durationLabel(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatDueLabel(task) {
  if (!task?.due_date) return null;
  const due = new Date(task.due_date);
  const now = new Date();
  const diff = due - now;
  if (diff < 0) return "overdue";
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `due in ${h}h`;
  const d = Math.floor(diff / 86400000);
  return `due in ${d}d`;
}

export function PlanFreeRow({
  row,
  suggestableTasks,
  onQuickStart,
  selectedDate,
  taskLists,
  styles,
  slotPopoverRef,
  slotPopoverRowId,
  setSlotPopoverRowId,
}) {
  const { suggested: suggestedTask, top3: top3Tasks } = getTasksThatFitGap(
    suggestableTasks || [],
    row.minutes,
  );
  const gapStartDate = getGapStartDate(selectedDate, row.gapStartMins);
  const isBestWindow = row.minutes >= 60;
  const durLabel = durationLabel(row.minutes);
  const timeStr =
    String(Math.floor(DAY_START_HOUR + row.gapStartMins / 60)).padStart(2, "0") +
    ":" +
    String(row.gapStartMins % 60).padStart(2, "0");

  function startTask(task) {
    if (onQuickStart) onQuickStart(gapStartDate, row.minutes, task);
  }

  /* ── 60+ min: Best Study Window ── */
  if (isBestWindow) {
    const top2 = top3Tasks.slice(0, 2);
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span
            className={`${styles.planTimelineNode} ${styles.planTimelineNodeBestWindow}`}
            aria-hidden
          />
        </div>
        <div className={styles.planTimelineGapBestWindow}>
          <div className={styles.planTimelineGapBestWindowHeader}>
            <span className={styles.planTimelineGapBestWindowLabel}>Best Study Window</span>
            <span className={styles.planTimelineGapBestWindowDur}>{durLabel} free</span>
          </div>
          {top2.length > 0 ? (
            <div className={styles.planTimelineGapTaskList}>
              {top2.map((task) => {
                const due = formatDueLabel(task);
                const mins = taskDurationMins(task);
                return (
                  <div key={task.id ?? task.title} className={styles.planTimelineGapTaskRow}>
                    <div className={styles.planTimelineGapTaskInfo}>
                      <span className={styles.planTimelineGapTaskTitle} title={task.title}>
                        {task.title}
                      </span>
                      <span className={styles.planTimelineGapTaskMeta}>
                        {mins}m{due ? ` · ${due}` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.planTimelineGapStartBtn}
                      onClick={() => startTask(task)}
                      aria-label={`Start ${task.title}`}
                    >
                      Start ▶
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className={styles.planTimelineGapNoTasks}>
              {durLabel} free — great window to review notes or go deep.
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── 30–59 min: Short window ── */
  return (
    <div
      className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
      style={{ marginTop: row.spacingBeforePx || 0 }}
    >
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{timeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        <span className={styles.planTimelineNode} aria-hidden />
      </div>
      <div className={styles.planTimelineGapShortWindow}>
        <span className={styles.planTimelineGapShortDur}>{durLabel} window</span>
        {suggestedTask ? (
          <div className={styles.planTimelineGapShortTaskRow}>
            <span
              className={styles.planTimelineGapTaskTitle}
              title={suggestedTask.title}
            >
              {suggestedTask.title}
            </span>
            <span className={styles.planTimelineGapTaskMeta}>
              {taskDurationMins(suggestedTask)}m
            </span>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask(suggestedTask)}
              aria-label={`Start ${suggestedTask.title}`}
            >
              Start 25m ▶
            </button>
          </div>
        ) : (
          <span className={styles.planTimelineGapNoTasks}>Catch your breath</span>
        )}
      </div>
    </div>
  );
}
