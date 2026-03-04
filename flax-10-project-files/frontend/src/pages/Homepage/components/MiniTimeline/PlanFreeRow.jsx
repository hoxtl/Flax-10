/**
 * Plan timeline free window row (gap >= 30min).
 * Context-aware:
 *   transit          → campus transit warning (no study suggestion)
 *   transit-partial  → transit note + remaining study tasks
 *   personal         → rest/breather nudge
 *   evening          → wind-down nudge
 *   study (default)  → responsive deadline-driven header + task suggestions
 *     30–59 min → short window: 1 task
 *     60+  min  → full window: up to 2 tasks
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getTasksThatFitGap, taskDurationMins } from "../../utils/taskUtils";
import { CAMPUS_DISPLAY } from "../../utils/planTimelineRows";

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

/** Build a responsive gap header based on context + upcoming task deadline. */
function buildStudyHeader(suggestedTask, durLabel) {
  if (!suggestedTask?.due_date) return `${durLabel} free`;
  const due = new Date(suggestedTask.due_date);
  const now = new Date();
  const diffMs = due - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const diffH = Math.floor(diffMs / 3600000);
  // Truncate long titles
  const title = suggestedTask.title?.length > 28
    ? suggestedTask.title.slice(0, 26) + "…"
    : suggestedTask.title;
  if (diffMs < 0) return `${title} is overdue — now's your chance`;
  if (diffH < 12) return `${title} due in ${diffH}h — use this gap`;
  if (diffDays === 0) return `${title} due today — want to prep?`;
  if (diffDays === 1) return `${title} due tomorrow — prep now`;
  if (diffDays <= 3) return `${title} due in ${diffDays}d — good time to push`;
  return `${durLabel} free`;
}

function deadlineDueLabel(deadline) {
  if (!deadline?.start_due_date) return null;
  const ms = new Date(deadline.start_due_date) - Date.now();
  if (ms <= 0) return "overdue";
  const d = Math.ceil(ms / 86400000);
  return d === 1 ? "due tomorrow" : `due in ${d}d`;
}

export function PlanFreeRow({
  row,
  suggestableTasks,
  deadlineSuggestions = [],
  onQuickStart,
  selectedDate,
  taskLists,
  styles,
  slotPopoverRef,
  slotPopoverRowId,
  setSlotPopoverRowId,
}) {
  const gapContext = row.gapContext || { type: "study" };
  const { suggested: suggestedTask, top3: top3Tasks } = getTasksThatFitGap(
    suggestableTasks || [],
    gapContext.type === "transit-partial" ? (gapContext.freeAfterTransit ?? row.minutes) : row.minutes,
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

  /* ── Transit: entire gap is travel time ── */
  if (gapContext.type === "transit") {
    const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
    const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span className={`${styles.planTimelineNode} ${styles.planTimelineNodeTransit}`} aria-hidden />
        </div>
        <div className={styles.planTimelineGapTransit}>
          <span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span>
          <div className={styles.planTimelineGapTransitBody}>
            <span className={styles.planTimelineGapTransitLabel}>
              {from} → {to}
            </span>
            <span className={styles.planTimelineGapTransitMeta}>
              ~{gapContext.transitMins}m travel · {durLabel} gap
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Transit-partial: travel + some study time ── */
  if (gapContext.type === "transit-partial") {
    const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
    const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
    const freeLabel = durationLabel(gapContext.freeAfterTransit || 0);
    const top1 = top3Tasks[0] || null;
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0 }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell}>
          <span className={`${styles.planTimelineNode} ${styles.planTimelineNodeTransit}`} aria-hidden />
        </div>
        <div className={styles.planTimelineGapTransitPartial}>
          <div className={styles.planTimelineGapTransitPartialTop}>
            <span className={styles.planTimelineGapTransitIcon} aria-hidden>↗</span>
            <span className={styles.planTimelineGapTransitLabel}>{from} → {to} (~{gapContext.transitMins}m)</span>
            <span className={styles.planTimelineGapTransitPartialFree}>{freeLabel} free after</span>
          </div>
          {top1 && (
            <div className={styles.planTimelineGapShortTaskRow}>
              <span className={styles.planTimelineGapTaskTitle} title={top1.title}>{top1.title}</span>
              <span className={styles.planTimelineGapTaskMeta}>{taskDurationMins(top1)}m</span>
              <button
                type="button"
                className={styles.planTimelineGapStartBtnSm}
                onClick={() => startTask(top1)}
                aria-label={`Start ${top1.title}`}
              >
                Work on →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Personal: between social/routine/leisure events ── */
  if (gapContext.type === "personal") {
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
        <div className={styles.planTimelineGapPersonal}>
          <span className={styles.planTimelineGapPersonalDur}>{durLabel}</span>
          <span className={styles.planTimelineGapPersonalText}>Your time — take a breather</span>
        </div>
      </div>
    );
  }

  /* ── Evening: wind-down ── */
  if (gapContext.type === "evening") {
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
        <div className={styles.planTimelineGapEvening}>
          <span className={styles.planTimelineGapEveningDur}>{durLabel}</span>
          <span className={styles.planTimelineGapEveningText}>Evening — time to wind down</span>
        </div>
      </div>
    );
  }

  /* ── 60+ min: Study window ── */
  if (isBestWindow) {
    const top2 = top3Tasks.slice(0, 2);
    const header = buildStudyHeader(suggestedTask, durLabel);
    const topDeadline = deadlineSuggestions[0] ?? null;
    const revisionBlockMins = Math.min(Math.ceil(row.minutes / 25) * 25, 90);
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
            <span className={styles.planTimelineGapBestWindowLabel}>{header}</span>
            <span className={styles.planTimelineGapBestWindowDur}>{durLabel} free</span>
          </div>
          {/* Deadline revision suggestion — pinned above regular tasks */}
          {topDeadline && (
            <div className={styles.planTimelineGapDeadlineRow}>
              <div className={styles.planTimelineGapDeadlineInfo}>
                <span className={styles.planTimelineGapDeadlineChip}>
                  {deadlineDueLabel(topDeadline)}
                </span>
                <span className={styles.planTimelineGapDeadlineTitle}>
                  {topDeadline.assessment_title || topDeadline.title}
                  {topDeadline.module_code ? ` · ${topDeadline.module_code}` : ""}
                </span>
                <span className={styles.planTimelineGapDeadlineMeta}>no revision scheduled</span>
              </div>
              <button
                type="button"
                className={styles.planTimelineGapDeadlineBtn}
                onClick={() => startTask({
                  title: `Revision: ${topDeadline.assessment_title || topDeadline.title}`,
                  estimated_blocks: Math.round(revisionBlockMins / 25),
                })}
                aria-label={`Schedule revision for ${topDeadline.assessment_title || topDeadline.title}`}
              >
                Schedule {revisionBlockMins}m →
              </button>
            </div>
          )}
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
                      Work on →
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className={styles.planTimelineGapNoTasks}>
              {durLabel} free — great window to go deep.
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── 30–59 min: Short study window ── */
  const topDeadlineShort = deadlineSuggestions[0] ?? null;
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
        {topDeadlineShort && !suggestedTask ? (
          <div className={styles.planTimelineGapShortTaskRow}>
            <div className={styles.planTimelineGapDeadlineInfo}>
              <span className={styles.planTimelineGapDeadlineChip}>
                {deadlineDueLabel(topDeadlineShort)}
              </span>
              <span className={styles.planTimelineGapTaskTitle}>
                {topDeadlineShort.assessment_title || topDeadlineShort.title}
              </span>
            </div>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask({
                title: `Revision: ${topDeadlineShort.assessment_title || topDeadlineShort.title}`,
                estimated_blocks: Math.max(1, Math.round(row.minutes / 25)),
              })}
              aria-label={`Schedule revision for ${topDeadlineShort.assessment_title || topDeadlineShort.title}`}
            >
              Schedule →
            </button>
          </div>
        ) : suggestedTask ? (
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
              Work on →
            </button>
          </div>
        ) : (
          <span className={styles.planTimelineGapNoTasks}>Catch your breath</span>
        )}
      </div>
    </div>
  );
}
