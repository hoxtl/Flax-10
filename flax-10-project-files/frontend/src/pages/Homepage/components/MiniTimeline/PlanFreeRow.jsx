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
import { taskDurationMins } from "../../utils/taskUtils";
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
  isBestGap = false,
  assignedTask = null,
}) {
  const gapContext = row.gapContext || { type: "study" };
  const gapStartDate = getGapStartDate(selectedDate, row.gapStartMins);
  const isBestWindow = row.minutes >= 60;
  const durLabel = durationLabel(row.minutes);
  const endMins = (row.gapStartMins || 0) + (row.minutes || 0);
  const crossedHourMarkers = Math.max(0, Math.floor(endMins / 60) - Math.floor((row.gapStartMins || 0) / 60));
  const markerCompensation = crossedHourMarkers * 22;
  const gapMinHeight = row.minutes > 0
    ? Math.max(56, Math.min(Math.round(row.minutes * 1.2) + markerCompensation, 260))
    : 56;
  const timeStr = formatHour12h(
    Math.floor(DAY_START_HOUR + row.gapStartMins / 60),
    row.gapStartMins % 60
  );

  function startTask(task) {
    if (onQuickStart) onQuickStart(gapStartDate, row.minutes, task);
  }

  function isOverdue(task) {
    if (!task?.due_date) return false;
    return new Date(task.due_date) < new Date();
  }

  function isUrgent(task) {
    return String(task?.priority || "").toLowerCase() === "urgent";
  }

  function withUrgencyEmoji(task) {
    if (!task) return "";
    const title = task.title || "";
    return isOverdue(task) || isUrgent(task) ? `❗ ${title}` : title;
  }

  /* ── Transit: entire gap is travel time ── */
  if (gapContext.type === "transit") {
    const from = CAMPUS_DISPLAY[gapContext.prevCampus] || "campus";
    const to = CAMPUS_DISPLAY[gapContext.nextCampus] || "next campus";
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}
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
    const top1 = assignedTask || null;
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}
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
              <span className={styles.planTimelineGapTaskTitle} title={withUrgencyEmoji(top1)}>{withUrgencyEmoji(top1)}</span>
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
        style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}>
          <span className={styles.planTimelineGapRail} aria-hidden />
          <div className={styles.planTimelineGapMain}>
            <span className={styles.planTimelineGapLeadDot} aria-hidden />
            <span className={styles.planTimelineGapShortDur}>{durLabel} free</span>
            <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
            <span className={styles.planTimelineGapNoTasks}>Short breather</span>
          </div>
          <span className={styles.planTimelineGapRail} aria-hidden />
        </div>
      </div>
    );
  }

  /* ── Evening: wind-down ── */
  if (gapContext.type === "evening") {
    return (
      <div
        className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
        style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}
      >
        <div className={styles.planTimelineGutter}>
          <span className={styles.planTimelineTime}>{timeStr}</span>
        </div>
        <div className={styles.planTimelineSpineCell} aria-hidden />
        <div className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}>
          <span className={styles.planTimelineGapRail} aria-hidden />
          <div className={styles.planTimelineGapMain}>
            <span className={styles.planTimelineGapLeadDot} aria-hidden />
            <span className={styles.planTimelineGapShortDur}>{durLabel} free</span>
            <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
            <span className={styles.planTimelineGapNoTasks}>Reset</span>
          </div>
          <span className={styles.planTimelineGapRail} aria-hidden />
        </div>
      </div>
    );
  }

  /* ── Study windows (compact single-line style) ── */
  const topDeadlineShort = deadlineSuggestions[0] ?? null;
  const candidateTask = assignedTask || (topDeadlineShort
    ? {
        title: `Revision: ${topDeadlineShort.assessment_title || topDeadlineShort.title}`,
        estimated_blocks: Math.max(1, Math.round(row.minutes / 25)),
        due_date: topDeadlineShort.start_due_date,
        priority: "urgent",
      }
    : null);
  const windowLabel = `${durLabel} free`;
  const recommendationText = candidateTask
    ? `${withUrgencyEmoji(candidateTask)}`
    : `Short breather`;

  return (
    <div
      className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
      style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}
    >
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{timeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div
        className={`${styles.planTimelineGapShortWindow} ${candidateTask ? styles.planTimelineGapShortWindowFeatured : ""} ${isBestGap ? styles.planTimelineGapShortWindowBest : ""} ${!candidateTask ? styles.planTimelineGapShortWindowNoActions : ""}`}
      >
        <span className={styles.planTimelineGapRail} aria-hidden />
        <div className={styles.planTimelineGapMain}>
          <span className={styles.planTimelineGapLeadDot} aria-hidden />
          <span className={styles.planTimelineGapShortDur}>{windowLabel}</span>
          <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
          <span className={styles.planTimelineGapSuggestionText} title={recommendationText}>
            {recommendationText}
          </span>
        </div>
        {candidateTask ? (
          <>
            <span className={styles.planTimelineGapRail} aria-hidden />
            <div className={styles.planTimelineGapActions}>
            <span className={styles.planTimelineGapTaskMeta}>({taskDurationMins(candidateTask)}m)</span>
            <button
              type="button"
              className={styles.planTimelineGapStartBtnSm}
              onClick={() => startTask(candidateTask)}
              aria-label={`Start ${candidateTask.title}`}
            >
              Slot in →
            </button>
            </div>
          </>
        ) : (
          <span className={styles.planTimelineGapRail} aria-hidden />
        )}
      </div>
    </div>
  );
}
