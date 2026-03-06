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
import { formatHour12h } from "../../utils/dateFormatUtils";

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
  const timeStr = formatHour12h(
    Math.floor(DAY_START_HOUR + row.gapStartMins / 60),
    row.gapStartMins % 60
  );

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
                Slot in →
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
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={styles.planTimelineGapPersonal}>
          <span className={styles.planTimelineGapPersonalDur}>{durLabel} free</span>
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
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={styles.planTimelineGapEvening}>
          <span className={styles.planTimelineGapEveningDur}>{durLabel} free</span>
        </div>
      </div>
    );
  }

  /* ── Study windows (compact single-line style) ── */
  const topDeadlineShort = deadlineSuggestions[0] ?? null;
  const candidateTask = suggestedTask || (topDeadlineShort
    ? {
        title: `Revision: ${topDeadlineShort.assessment_title || topDeadlineShort.title}`,
        estimated_blocks: Math.max(1, Math.round(row.minutes / 25)),
        due_date: topDeadlineShort.start_due_date,
      }
    : null);
  const candidateDueLabel = formatDueLabel(candidateTask);
  const urgent = candidateDueLabel === "overdue" || (candidateDueLabel?.startsWith("due in") && /(\d+)h/.test(candidateDueLabel));
  const windowLabel = candidateTask ? `${durLabel} window` : `${durLabel} free`;

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
          className={`${styles.planTimelineNode} ${isBestWindow ? styles.planTimelineNodeBestWindow : ""}`}
          aria-hidden
        />
      </div>
      <div className={styles.planTimelineGapShortWindow}>
        <span className={styles.planTimelineGapShortDur}>{windowLabel}</span>
        {candidateTask ? (
          <div className={styles.planTimelineGapShortTaskRow}>
            {urgent && <span className={styles.planTimelineGapUrgencyChip}>urgent!</span>}
            <span
              className={styles.planTimelineGapTaskTitle}
              title={candidateTask.title}
            >
              {candidateTask.title}
            </span>
            <span className={styles.planTimelineGapTaskMeta}>
              {taskDurationMins(candidateTask)}m
            </span>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask(candidateTask)}
              aria-label={`Start ${candidateTask.title}`}
            >
              Slot in →
            </button>
          </div>
        ) : (
          <span className={styles.planTimelineGapNoTasks}>Your time — take a breather</span>
        )}
      </div>
    </div>
  );
}
